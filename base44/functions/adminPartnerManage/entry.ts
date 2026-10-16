import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  planDefaults, loadPlanSettings, priceFor, publicPlans, intervalAdvanceMs,
  buildPaymentEntry, applyPaymentPatch, verifyPaymentPatch, findExistingPayment,
  auditEntry, adminAuditEntry, effectiveStatus, paymentStatusPatch, scheduledTierPatch,
} from '../../shared/partnerBilling.ts';
import { canTransition, validateCampaignDates, adDisplayEligible } from '../../shared/partnerAds.ts';
import { notifyPartner } from '../../shared/partnerNotifications.ts';

// Administrator management of the partner advertising system: plan settings
// (prices, currency, interval, intro offers, grace period, availability,
// cancellation policy) and the subscription ledger. A subscription becomes
// ACTIVE only when the affiliation and administrative approval AND a verified
// payment are in place; upgrade/downgrade pricing applies at the next renewal
// so an already-paid period's terms never change silently. Admin-only — every
// call is rejected for non-admin accounts. Only administrators approve
// advertisements; partners can never approve their own.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || '';

    if (action === 'get_plans') {
      const settings = await loadPlanSettings(base44);
      return Response.json({
        settings,
        plans: {
          pharmacy: publicPlans(settings, 'pharmacy'),
          laboratory: publicPlans(settings, 'laboratory'),
          hospital: publicPlans(settings, 'hospital'),
        },
      });
    }

    if (action === 'update_plans') {
      const input = body.settings || {};
      const num = (v) => {
        if (v === '' || v == null) return null;
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 && n <= 1000000 ? n : null;
      };
      const patch = {
        currency: String(input.currency || 'LYD').trim().slice(0, 8) || 'LYD',
        billing_interval: input.billing_interval === 'year' ? 'year' : 'month',
        pharmacy_standard_price: num(input.pharmacy_standard_price),
        pharmacy_premium_price: num(input.pharmacy_premium_price),
        lab_standard_price: num(input.lab_standard_price),
        lab_premium_price: num(input.lab_premium_price),
        hospital_standard_price: num(input.hospital_standard_price),
        hospital_premium_price: num(input.hospital_premium_price),
        premium_upgrade_fee: num(input.premium_upgrade_fee) ?? 0,
        pharmacy_standard_description: String(input.pharmacy_standard_description || '').slice(0, 500),
        pharmacy_premium_description: String(input.pharmacy_premium_description || '').slice(0, 500),
        lab_standard_description: String(input.lab_standard_description || '').slice(0, 500),
        lab_premium_description: String(input.lab_premium_description || '').slice(0, 500),
        hospital_standard_description: String(input.hospital_standard_description || '').slice(0, 500),
        hospital_premium_description: String(input.hospital_premium_description || '').slice(0, 500),
        plan_features: (Array.isArray(input.plan_features) ? input.plan_features : [])
          .map((f) => String(f || '').trim().slice(0, 120)).filter(Boolean).slice(0, 10),
        intro_offer_enabled: !!input.intro_offer_enabled,
        intro_discount_percent: num(input.intro_discount_percent) ?? 0,
        intro_duration_months: num(input.intro_duration_months) ?? 0,
        grace_days: num(input.grace_days) ?? 7,
        overdue_policy: String(input.overdue_policy || '').slice(0, 500),
        cancellation_policy: input.cancellation_policy === 'immediate' ? 'immediate' : 'end_of_period',
        pharmacy_standard_available: input.pharmacy_standard_available !== false,
        pharmacy_premium_available: input.pharmacy_premium_available !== false,
        lab_standard_available: input.lab_standard_available !== false,
        lab_premium_available: input.lab_premium_available !== false,
        hospital_standard_available: input.hospital_standard_available !== false,
        hospital_premium_available: input.hospital_premium_available !== false,
        updated_datetime: new Date().toISOString(),
        updated_by_name: user.full_name || user.email,
      };
      const existing = await base44.entities.PartnerPlanSettings.filter({}, { limit: 1 });
      const current = (existing.items || existing)[0];
      const saved = current
        ? await base44.entities.PartnerPlanSettings.update(current.id, patch)
        : await base44.entities.PartnerPlanSettings.create({ ...planDefaults(), ...patch });
      return Response.json({ settings: saved });
    }

    const subsEntity = base44.asServiceRole.entities.PartnerSubscription;
    const adsEntity = base44.asServiceRole.entities.PartnerAdvertisement;

    if (action === 'list') {
      const subs = await subsEntity.filter({}, { sort: '-created_date', limit: 200 });
      const ads = await adsEntity.filter({}, { sort: '-created_date', limit: 400 });
      const settings = await loadPlanSettings(base44);
      const now = new Date();
      const adsBySub = {};
      for (const ad of (ads.items || ads)) {
        if (!adsBySub[ad.subscription_id]) adsBySub[ad.subscription_id] = ad;
      }
      return Response.json({
        subscriptions: (subs.items || subs).map((s) => ({
          ...s,
          effective_status: effectiveStatus(s, settings, now),
          advertisement: adsBySub[s.id] || null,
        })),
        settings,
      });
    }

    // Subscription revenue and advertisement performance summaries.
    if (action === 'summary') {
      const subs = await subsEntity.filter({}, { limit: 500 });
      const ads = await adsEntity.filter({}, { limit: 500 });
      const settings = await loadPlanSettings(base44);
      const now = new Date();
      const all = subs.items || subs;
      const revenue = { total: 0, last30: 0, pharmacy: 0, laboratory: 0, hospital: 0, pending_verification: 0 };
      const cutoff30 = now.getTime() - 30 * 86400000;
      let outstandingUpgradeFees = 0;
      let overdueCount = 0;
      const counts = {
        pending_approval: 0, pending_payment: 0, active: 0, past_due: 0,
        suspended: 0, cancellation_pending: 0, cancelled: 0,
      };
      for (const s of all) {
        const effective = effectiveStatus(s, settings, now);
        counts[s.status] = (counts[s.status] || 0) + 1;
        if (effective === 'suspended' && ['active', 'past_due'].includes(s.status)) overdueCount += 1;
        outstandingUpgradeFees += s.pending_upgrade_fee || 0;
        for (const p of s.payments || []) {
          if (p.verification === 'pending_verification') revenue.pending_verification += p.amount;
          if (p.verification !== 'confirmed') continue;
          if (p.entry_type === 'refund') {
            revenue.total -= p.amount;
            revenue.last30 -= new Date(p.datetime).getTime() >= cutoff30 ? p.amount : 0;
            revenue[s.partner_type] -= p.amount;
          } else if (p.entry_type === 'payment') {
            revenue.total += p.amount;
            revenue.last30 += new Date(p.datetime).getTime() >= cutoff30 ? p.amount : 0;
            revenue[s.partner_type] += p.amount;
          }
        }
      }
      const adCounts = {};
      for (const ad of (ads.items || ads)) {
        adCounts[ad.status] = (adCounts[ad.status] || 0) + 1;
      }
      return Response.json({
        summary: {
          counts, overdue_count: overdueCount, revenue, outstanding_upgrade_fees: outstandingUpgradeFees,
          ad_counts: adCounts, currency: settings.currency || 'LYD',
        },
      });
    }

    // Administrator-level analytics: aggregated advertisement performance per
    // partner (impressions, detail views, contact and direction clicks),
    // premium vs standard comparison, verified revenue and outstanding
    // balances. Analytics events carry NO patient identities, health
    // information or diagnoses — only one-way deduplication hashes.
    if (action === 'analytics') {
      const eventsEntity = base44.asServiceRole.entities.PartnerAdEvent;
      const scopeType = ['laboratory', 'pharmacy', 'hospital'].includes(body.partner_type)
        ? body.partner_type : null;
      const scopeQuery = scopeType ? { partner_type: scopeType } : {};
      const subs = await subsEntity.filter(scopeQuery, { limit: 500 });
      const settings = await loadPlanSettings(base44);
      const now = new Date();
      const all = subs.items || subs;
      const byType = await eventsEntity.aggregate({ query: scopeQuery, groupBy: 'event_type' });
      const byPartner = await eventsEntity.aggregate({ query: scopeQuery, groupBy: 'partner_id' });
      const impressionsByPartner = await eventsEntity.aggregate({
        query: { ...scopeQuery, event_type: 'impression' }, groupBy: 'partner_id',
      });
      const totalsByType = {};
      for (const row of byType.rows || []) totalsByType[row.event_type] = row.count;
      const totalEventsByPartner = {};
      for (const row of byPartner.rows || []) totalEventsByPartner[row.partner_id] = row.count;
      const impressionsByPartnerMap = {};
      for (const row of impressionsByPartner.rows || []) impressionsByPartnerMap[row.partner_id] = row.count;
      const partners = all.map((s) => {
        const effective = effectiveStatus(s, settings, now);
        const verified = (s.payments || []).filter((p) => p.verification === 'confirmed');
        const paid = verified.filter((p) => p.entry_type === 'payment').reduce((a, p) => a + p.amount, 0);
        const refunded = verified.filter((p) => p.entry_type === 'refund').reduce((a, p) => a + p.amount, 0);
        return {
          partner_id: s.partner_id,
          partner_name: s.partner_name,
          partner_type: s.partner_type,
          tier: s.tier,
          status: s.status,
          effective_status: effective,
          impressions: impressionsByPartnerMap[s.partner_id] || 0,
          total_events: totalEventsByPartner[s.partner_id] || 0,
          verified_revenue: Math.round((paid - refunded) * 100) / 100,
          outstanding_upgrade_fee: s.pending_upgrade_fee || 0,
          next_billing_datetime: s.next_billing_datetime || null,
        };
      });
      const agg = (list, pred) => {
        const sel = list.filter(pred);
        return {
          partners: sel.length,
          impressions: sel.reduce((a, p) => a + p.impressions, 0),
          total_events: sel.reduce((a, p) => a + p.total_events, 0),
          verified_revenue: Math.round(sel.reduce((a, p) => a + p.verified_revenue, 0) * 100) / 100,
        };
      };
      return Response.json({
        analytics: {
          totals_by_type: totalsByType,
          premium_vs_standard: {
            premium: agg(partners, (p) => p.tier === 'premium'),
            standard: agg(partners, (p) => p.tier !== 'premium'),
          },
          partners,
          outstanding_upgrade_fees: partners.reduce((a, p) => a + p.outstanding_upgrade_fee, 0),
          overdue_count: partners.filter((p) => p.effective_status === 'suspended' && ['active', 'past_due'].includes(p.status)).length,
          currency: settings.currency || 'LYD',
        },
      });
    }

    // ---- Advertisement review actions (ad_id based) ----

    const reviewPatch = () => ({
      reviewed_by_name: user.full_name || user.email,
      reviewed_datetime: new Date().toISOString(),
      updated_datetime: new Date().toISOString(),
    });

    if (action === 'approve_ad' || action === 'reject_ad') {
      const ad = await adsEntity.get(body.ad_id);
      if (!ad) return Response.json({ error: 'Advertisement not found' }, { status: 404 });
      if (action === 'approve_ad') {
        if (!canTransition(ad.status, 'approved')) {
          return Response.json({ error: `An advertisement in status "${ad.status}" cannot be approved` }, { status: 400 });
        }
        const dates = validateCampaignDates(ad.campaign_start_date, ad.campaign_end_date);
        if (dates.error) return Response.json({ error: dates.error }, { status: 400 });
        const [subscription, settings] = await Promise.all([
          subsEntity.get(ad.subscription_id),
          loadPlanSettings(base44.asServiceRole),
        ]);
        const publishNow = adDisplayEligible({ ...ad, status: 'approved' }, subscription, settings).eligible;
        const updated = await adsEntity.update(ad.id, {
          ...reviewPatch(), status: publishNow ? 'published' : 'approved', rejection_reason: null,
        });
        await notifyPartner(base44.asServiceRole, ad.partner_type, ad, {
          title: publishNow ? 'Advertisement published' : 'Advertisement approved',
          message: publishNow
            ? `"${ad.title || 'Your advertisement'}" was approved and is now live in the Patient Portal.`
            : `"${ad.title || 'Your advertisement'}" was approved. It goes live automatically when the subscription is active and the campaign dates permit.`, 
          dedupeKey: `ad:${ad.id}:approved:${updated.reviewed_datetime}`,
        });
        return Response.json({ advertisement: updated });
      }
      if (!canTransition(ad.status, 'rejected')) {
        return Response.json({ error: `An advertisement in status "${ad.status}" cannot be rejected` }, { status: 400 });
      }
      const reason = String(body.reason || '').trim().slice(0, 300);
      if (!reason) return Response.json({ error: 'A rejection reason is required' }, { status: 400 });
      const updated = await adsEntity.update(ad.id, {
        ...reviewPatch(), status: 'rejected', rejection_reason: reason,
      });
      await notifyPartner(base44.asServiceRole, ad.partner_type, ad, {
        title: 'Advertisement rejected',
        message: `"${ad.title || 'Your advertisement'}" was rejected: ${reason}`,
        dedupeKey: `ad:${ad.id}:rejected:${updated.reviewed_datetime}`,
      });
      return Response.json({ advertisement: updated });
    }

    if (action === 'schedule_ad') {
      const ad = await adsEntity.get(body.ad_id);
      if (!ad) return Response.json({ error: 'Advertisement not found' }, { status: 404 });
      if (!canTransition(ad.status, 'scheduled')) {
        return Response.json({ error: `An advertisement in status "${ad.status}" cannot be scheduled` }, { status: 400 });
      }
      const dates = validateCampaignDates(body.campaign_start_date, body.campaign_end_date);
      if (dates.error) return Response.json({ error: dates.error }, { status: 400 });
      if (!dates.start_date) return Response.json({ error: 'A campaign start date is required to schedule' }, { status: 400 });
      const updated = await adsEntity.update(ad.id, {
        ...reviewPatch(), status: 'scheduled',
        campaign_start_date: dates.start_date, campaign_end_date: dates.end_date,
      });
      await notifyPartner(base44.asServiceRole, ad.partner_type, ad, {
        title: 'Advertisement scheduled',
        message: `"${ad.title || 'Your advertisement'}" is scheduled to start on ${dates.start_date}.`,
        dedupeKey: `ad:${ad.id}:scheduled:${updated.reviewed_datetime}`,
      });
      return Response.json({ advertisement: updated });
    }

    // Publication conditions: an approved ad may go live only when the linked
    // subscription is ACTIVE (affiliation approved AND a verified payment
    // recorded). Approval, payment and publication are separate conditions.
    if (action === 'publish_ad') {
      const ad = await adsEntity.get(body.ad_id);
      if (!ad) return Response.json({ error: 'Advertisement not found' }, { status: 404 });
      if (!canTransition(ad.status, 'published')) {
        return Response.json({ error: `An advertisement in status "${ad.status}" cannot be published` }, { status: 400 });
      }
      const sub = await subsEntity.get(ad.subscription_id);
      const settings = await loadPlanSettings(base44);
      if (!sub || effectiveStatus(sub, settings) !== 'active') {
        return Response.json({ error: 'The subscription must be approved with a verified payment (active) before the advertisement can be published' }, { status: 400 });
      }
      if (ad.campaign_end_date) {
        const today = new Date().toISOString().slice(0, 10);
        if (today > ad.campaign_end_date) {
          return Response.json({ error: 'The campaign end date has already passed' }, { status: 400 });
        }
      }
      const updated = await adsEntity.update(ad.id, {
        ...reviewPatch(), status: 'published', rejection_reason: null,
      });
      await notifyPartner(base44.asServiceRole, ad.partner_type, ad, {
        title: 'Advertisement published',
        message: `"${ad.title || 'Your advertisement'}" is now live in the Patient Portal.`,
        dedupeKey: `ad:${ad.id}:published_admin:${updated.reviewed_datetime}`,
      });
      return Response.json({ advertisement: updated });
    }

    if (action === 'pause_ad' || action === 'resume_ad') {
      const ad = await adsEntity.get(body.ad_id);
      if (!ad) return Response.json({ error: 'Advertisement not found' }, { status: 404 });
      const to = action === 'pause_ad' ? 'paused' : 'published';
      if (!canTransition(ad.status, to)) {
        return Response.json({ error: `An advertisement in status "${ad.status}" cannot be ${action === 'pause_ad' ? 'paused' : 'resumed'}` }, { status: 400 });
      }
      if (action === 'resume_ad') {
        const sub = await subsEntity.get(ad.subscription_id);
        const settings = await loadPlanSettings(base44);
        if (!sub || !['active', 'past_due'].includes(effectiveStatus(sub, settings))) {
          return Response.json({ error: 'The subscription must be paid and active to resume the advertisement' }, { status: 400 });
        }
      }
      const updated = await adsEntity.update(ad.id, { ...reviewPatch(), status: to });
      await notifyPartner(base44.asServiceRole, ad.partner_type, ad, action === 'pause_ad' ? {
        title: 'Advertisement paused',
        message: `"${ad.title || 'Your advertisement'}" was paused by the administrator and is not shown to patients.`,
        dedupeKey: `ad:${ad.id}:paused:${updated.reviewed_datetime}`,
      } : {
        title: 'Advertisement live again',
        message: `"${ad.title || 'Your advertisement'}" is visible to patients again.`,
        dedupeKey: `ad:${ad.id}:resumed:${updated.reviewed_datetime}`,
      });
      return Response.json({ advertisement: updated });
    }

    // ---- Subscription actions (subscription_id based) ----

    if (!body.subscription_id) return Response.json({ error: 'subscription_id is required' }, { status: 400 });
    const sub = await subsEntity.get(body.subscription_id);
    if (!sub) return Response.json({ error: 'Subscription not found' }, { status: 404 });
    const settingsForSub = await loadPlanSettings(base44);

    // Affiliation / ownership verification: the administrator confirms the
    // partner organization and locks its subscription terms (price, currency,
    // interval, intro offer). Billing has not started yet — the subscription
    // enters PENDING_PAYMENT and becomes ACTIVE only once the first payment is
    // verified. This does NOT approve the advertisement — that is a separate
    // review, and publication additionally requires the active status.
    if (action === 'approve') {
      if (sub.status !== 'pending_approval') {
        return Response.json({ error: 'Only pending subscriptions can be approved' }, { status: 400 });
      }
      const settings = settingsForSub;
      const price = priceFor(settings, sub.partner_type, sub.tier);
      if (!price) return Response.json({ error: 'Set the plan pricing first' }, { status: 400 });
      const now = new Date();
      const patch = {
        status: 'pending_payment',
        price_amount: price,
        currency: settings.currency || 'LYD',
        billing_interval: settings.billing_interval || 'month',
        approved_by_name: user.full_name || user.email,
        approved_datetime: now.toISOString(),
        admin_notes: body.admin_notes ? String(body.admin_notes).slice(0, 500) : (sub.admin_notes || ''),
      };
      if (settings.intro_offer_enabled && (settings.intro_discount_percent || 0) > 0) {
        patch.intro_discount_percent = settings.intro_discount_percent;
        patch.intro_months_remaining = settings.intro_duration_months || 1;
      }
      patch.admin_audit = [
        ...(sub.admin_audit || []),
        adminAuditEntry('subscription_approved', user.full_name || user.email, `Tier ${sub.tier} approved — awaiting the first verified payment`),
      ];
      await subsEntity.update(sub.id, patch);
      await notifyPartner(base44.asServiceRole, sub.partner_type, sub, {
        title: 'Subscription approved',
        message: 'Your subscription was approved. The first verified payment activates it.',
        dedupeKey: `sub:${sub.id}:approved`,
      });
      return Response.json({ subscription: { ...sub, ...patch } });
    }

    if (action === 'suspend') {
      const reason = String(body.reason || '').slice(0, 300) || 'Suspended by the administrator';
      await subsEntity.update(sub.id, {
        status: 'suspended',
        suspension_reason: reason,
        admin_notes: body.admin_notes ? String(body.admin_notes).slice(0, 500) : (sub.admin_notes || ''),
        admin_audit: [
          ...(sub.admin_audit || []),
          adminAuditEntry('subscription_suspended', user.full_name || user.email, reason),
        ],
      });
      await notifyPartner(base44.asServiceRole, sub.partner_type, sub, {
        title: 'Subscription suspended',
        message: `Your subscription was suspended: ${reason}. Its advertisement is no longer shown.`,
        dedupeKey: `sub:${sub.id}:suspended_admin:${Date.now()}`,
      });
      // A suspended subscription can never display a Premium advertisement:
      // its live ad is paused immediately.
      const ads = await adsEntity.filter({ subscription_id: sub.id });
      for (const ad of (ads.items || ads)) {
        if (['published', 'scheduled'].includes(ad.status)) {
          await adsEntity.update(ad.id, { status: 'paused', updated_datetime: new Date().toISOString() });
        }
      }
      return Response.json({ subscription: { ...sub, status: 'suspended' } });
    }

    if (action === 'reinstate') {
      if (sub.status !== 'suspended') return Response.json({ error: 'Only suspended subscriptions can be reinstated' }, { status: 400 });
      await subsEntity.update(sub.id, {
        status: 'active',
        suspension_reason: null,
        admin_audit: [
          ...(sub.admin_audit || []),
          adminAuditEntry('subscription_reinstated', user.full_name || user.email, 'Reinstated by the administrator'),
        ],
      });
      // Reinstate paused ads whose campaign window still permits display.
      const ads = await adsEntity.filter({ subscription_id: sub.id });
      const today = new Date().toISOString().slice(0, 10);
      for (const ad of (ads.items || ads)) {
        if (ad.status !== 'paused') continue;
        const windowOk = (!ad.campaign_start_date || today >= ad.campaign_start_date)
          && (!ad.campaign_end_date || today <= ad.campaign_end_date);
        if (windowOk) {
          await adsEntity.update(ad.id, { status: 'published', updated_datetime: new Date().toISOString() });
        }
      }
      return Response.json({ subscription: { ...sub, status: 'active' } });
    }

    if (action === 'cancel') {
      const cancelReason = String(body.reason || '').slice(0, 300);
      await subsEntity.update(sub.id, {
        status: 'cancelled',
        suspension_reason: cancelReason,
        cancellation_effective_datetime: null,
        cancelled_datetime: new Date().toISOString(),
        admin_audit: [
          ...(sub.admin_audit || []),
          adminAuditEntry('subscription_cancelled', user.full_name || user.email, cancelReason || 'Cancelled by the administrator'),
        ],
      });
      await notifyPartner(base44.asServiceRole, sub.partner_type, sub, {
        title: 'Subscription cancelled',
        message: 'Your subscription was cancelled by the administrator. Its advertisement has expired.',
        dedupeKey: `sub:${sub.id}:cancelled_admin:${Date.now()}`,
      });
      // A cancelled subscription never retains its placement: its live or
      // scheduled advertisement expires.
      const ads = await adsEntity.filter({ subscription_id: sub.id });
      for (const ad of (ads.items || ads)) {
        if (['published', 'scheduled', 'approved', 'paused', 'pending_review'].includes(ad.status)) {
          await adsEntity.update(ad.id, { status: 'expired', updated_datetime: new Date().toISOString() });
        }
      }
      return Response.json({ subscription: { ...sub, status: 'cancelled' } });
    }

    if (action === 'record_payment') {
      // An administrator suspension always requires an explicit reinstatement
      // first; an automatic overdue suspension is lifted by a caught-up
      // payment, per the configured policy.
      if (sub.status === 'suspended' && !String(sub.suspension_reason || '').startsWith('Overdue')) {
        return Response.json({ error: 'This subscription is suspended — reinstate it first' }, { status: 400 });
      }
      // Duplicate protection: the same idempotency key never creates a second
      // payment record.
      const existing = findExistingPayment(sub, body.idempotency_key);
      if (existing) return Response.json({ subscription: sub, payment: existing, duplicate: true });
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
        return Response.json({ error: 'Enter a valid payment amount' }, { status: 400 });
      }
      const paymentDate = body.payment_date ? String(body.payment_date).trim() : '';
      if (paymentDate && !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
        return Response.json({ error: 'The payment date is not a valid date' }, { status: 400 });
      }
      const appliesTo = body.applies_to === 'upgrade_fee' && (sub.pending_upgrade_fee || 0) > 0
        ? 'upgrade_fee' : 'subscription';
      const entry = buildPaymentEntry(
        sub,
        {
          amount, method: body.method, note: body.note, appliesTo,
          entryType: body.entry_type === 'adjustment' || body.entry_type === 'refund' ? body.entry_type : 'payment',
          paymentReference: body.payment_reference, paymentDate, idempotencyKey: body.idempotency_key,
        },
        user.full_name || user.email,
        'admin'
      );
      let patch = applyPaymentPatch(sub, entry);
      patch = paymentStatusPatch(sub, patch);
      // A scheduled tier/price change applies once its effective date (the
      // renewal the payment just created) has arrived.
      const tierPatch = scheduledTierPatch({ ...sub, ...patch }, adsEntity);
      if (tierPatch) Object.assign(patch, tierPatch);
      patch.payment_audit = [
        ...(sub.payment_audit || []),
        auditEntry('recorded', user.full_name || user.email, entry.payment_id,
          `${entry.entry_type} · ${entry.verification}${entry.payment_reference ? ` · ref ${entry.payment_reference}` : ''}`),
      ];
      if (patch.status === 'active' && tierPatch) {
        const ads = await adsEntity.filter({ subscription_id: sub.id }, { sort: '-created_date', limit: 1 });
        const ad = (ads.items || ads)[0];
        if (ad) {
          await adsEntity.update(ad.id, { placement: patch.tier, updated_datetime: new Date().toISOString() });
        }
      }
      await subsEntity.update(sub.id, patch);
      // Notify the partner: cash is confirmed immediately; any other method
      // is announced strictly as awaiting verification — never as paid.
      await notifyPartner(base44.asServiceRole, sub.partner_type, sub, {
        title: entry.verification === 'confirmed' ? 'Payment recorded' : 'Payment received — awaiting verification',
        message: entry.verification === 'confirmed'
          ? `A ${entry.entry_type} of ${entry.amount} ${sub.currency || ''} was recorded for your subscription.`
          : `A ${entry.entry_type} of ${entry.amount} ${sub.currency || ''} was recorded and is awaiting administrator verification.`,
        dedupeKey: `sub:${sub.id}:payment_recorded:${entry.payment_id}`,
      });
      return Response.json({ subscription: { ...sub, ...patch }, payment: entry });
    }

    // Administrator verification of a pending (non-cash) payment. Until this
    // is called the payment does NOT advance billing — a partner-submitted
    // receipt is never treated as paid on its own.
    if (action === 'verify_payment') {
      if (!body.payment_id) return Response.json({ error: 'payment_id is required' }, { status: 400 });
      let patch = verifyPaymentPatch(sub, body.payment_id, user.full_name || user.email);
      if (!patch) return Response.json({ error: 'This payment is not pending verification' }, { status: 400 });
      patch = paymentStatusPatch(sub, patch);
      const tierPatch = scheduledTierPatch({ ...sub, ...patch }, adsEntity);
      if (tierPatch) Object.assign(patch, tierPatch);
      patch.payment_audit = [
        ...(sub.payment_audit || []),
        auditEntry('verified', user.full_name || user.email, body.payment_id, 'Payment confirmed by the administrator'),
      ];
      if (patch.status === 'active' && tierPatch) {
        const ads = await adsEntity.filter({ subscription_id: sub.id }, { sort: '-created_date', limit: 1 });
        const ad = (ads.items || ads)[0];
        if (ad) {
          await adsEntity.update(ad.id, { placement: patch.tier, updated_datetime: new Date().toISOString() });
        }
      }
      await subsEntity.update(sub.id, patch);
      await notifyPartner(base44.asServiceRole, sub.partner_type, sub, {
        title: 'Payment verified',
        message: 'Your payment was verified by the administrator. Billing has been updated.',
        dedupeKey: `sub:${sub.id}:payment_verified:${body.payment_id}`,
      });
      return Response.json({ subscription: { ...sub, ...patch } });
    }

    if (action === 'reject_payment') {
      if (!body.payment_id) return Response.json({ error: 'payment_id is required' }, { status: 400 });
      const target = (sub.payments || []).find((p) => p.payment_id === body.payment_id);
      if (!target || target.verification !== 'pending_verification') {
        return Response.json({ error: 'This payment is not pending verification' }, { status: 400 });
      }
      const reason = String(body.reason || '').trim().slice(0, 300);
      if (!reason) return Response.json({ error: 'A rejection reason is required' }, { status: 400 });
      const patch = {
        payments: (sub.payments || []).filter((p) => p.payment_id !== body.payment_id),
        payment_audit: [
          ...(sub.payment_audit || []),
          auditEntry('rejected', user.full_name || user.email, body.payment_id, reason),
        ],
      };
      await subsEntity.update(sub.id, patch);
      await notifyPartner(base44.asServiceRole, sub.partner_type, sub, {
        title: 'Payment rejected',
        message: `A recorded payment was rejected by the administrator: ${reason}`,
        dedupeKey: `sub:${sub.id}:payment_rejected:${body.payment_id}`,
      });
      return Response.json({ subscription: { ...sub, ...patch } });
    }

    // Decide a partner change request (upgrade / downgrade / renewal / cancellation).
    // Upgrade: Premium entitlement and placement start immediately, the new
    // price applies at the next renewal (the paid period keeps its terms) and
    // any configured upgrade fee becomes due now. Downgrade: Standard tier,
    // placement and price all switch at the next renewal. Cancellation:
    // follows the configured policy — end of paid period or immediate.
    if (action === 'approve_change' || action === 'reject_change') {
      const change = sub.pending_change;
      if (!change || change.status !== 'pending') {
        return Response.json({ error: 'There is no pending change request on this subscription' }, { status: 400 });
      }
      const decisionNote = String(body.decision_note || '').slice(0, 300);
      const decided = {
        ...change,
        status: action === 'approve_change' ? 'approved' : 'rejected',
        decided_by_name: user.full_name || user.email,
        decided_datetime: new Date().toISOString(),
        decision_note: decisionNote,
      };
      if (action === 'reject_change') {
        const updated = await subsEntity.update(sub.id, {
          ...{ pending_change: decided },
          admin_audit: [
            ...(sub.admin_audit || []),
            adminAuditEntry(`change_${change.request_type}_rejected`, user.full_name || user.email, decisionNote || 'Rejected by the administrator'),
          ],
        });
        await notifyPartner(base44.asServiceRole, sub.partner_type, sub, {
          title: 'Change request rejected',
          message: `Your ${change.request_type} request was rejected${decisionNote ? `: ${decisionNote}` : '.'}`,
          dedupeKey: `sub:${sub.id}:change_rejected:${decided.decided_datetime}`,
        });
        return Response.json({ subscription: updated });
      }
      const settings = settingsForSub;
      const patch = { pending_change: decided };
      if (change.request_type === 'upgrade' || change.request_type === 'downgrade') {
        const price = priceFor(settings, sub.partner_type, change.requested_tier);
        if (!price) return Response.json({ error: 'Set the plan pricing first' }, { status: 400 });
        if (change.request_type === 'upgrade') {
          // Premium starts now; the new price applies from the next renewal.
          patch.tier = 'premium';
          patch.scheduled_tier = 'premium';
          patch.scheduled_price_amount = price;
          patch.price_effective_datetime = sub.next_billing_datetime || new Date().toISOString();
          if (sub.tier === 'standard' && (settings.premium_upgrade_fee || 0) > 0) {
            patch.pending_upgrade_fee = settings.premium_upgrade_fee;
          }
        } else {
          // Downgrade waits for the end of the paid period.
          patch.scheduled_tier = 'standard';
          patch.scheduled_price_amount = price;
          patch.price_effective_datetime = sub.next_billing_datetime || new Date().toISOString();
        }
      } else if (change.request_type === 'cancellation') {
        const policy = settings.cancellation_policy === 'immediate' ? 'immediate' : 'end_of_period';
        if (policy === 'immediate' || !sub.next_billing_datetime) {
          patch.status = 'cancelled';
          patch.cancellation_effective_datetime = new Date().toISOString();
          patch.cancelled_datetime = new Date().toISOString();
          const ads = await adsEntity.filter({ subscription_id: sub.id });
          for (const ad of (ads.items || ads)) {
            if (['published', 'scheduled', 'approved', 'paused', 'pending_review'].includes(ad.status)) {
              await adsEntity.update(ad.id, { status: 'expired', updated_datetime: new Date().toISOString() });
            }
          }
        } else {
          // End-of-period policy: the subscription remains active with its ad
          // live until the end of the current paid period.
          patch.status = 'cancellation_pending';
          patch.cancellation_effective_datetime = sub.next_billing_datetime;
        }
      }
      // 'renewal' requests are satisfied by recording the renewal payment —
      // approving the request only clears it.
      const changeMessages = {
        upgrade: 'Your Premium upgrade was approved. Featured placement starts now; the new price applies from your next renewal.',
        downgrade: 'Your downgrade to Standard was approved. It takes effect at your next renewal.',
        renewal: 'Your renewal request was approved — the renewal payment is recorded with the administrator.',
        cancellation: patch.status === 'cancelled'
          ? 'Your cancellation was approved and takes effect immediately.'
          : 'Your cancellation was approved. The subscription stays active until the end of the paid period, then ends automatically.',
      };
      await subsEntity.update(sub.id, {
        ...patch,
        admin_audit: [
          ...(sub.admin_audit || []),
          adminAuditEntry(`change_${change.request_type}_approved`, user.full_name || user.email, decisionNote || 'Approved by the administrator'),
        ],
      });
      await notifyPartner(base44.asServiceRole, sub.partner_type, sub, {
        title: 'Change request approved',
        message: changeMessages[change.request_type] || 'Your request was approved by the administrator.',
        dedupeKey: `sub:${sub.id}:change_approved:${decided.decided_datetime}`,
      });
      const updated = await subsEntity.get(sub.id);
      return Response.json({ subscription: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}