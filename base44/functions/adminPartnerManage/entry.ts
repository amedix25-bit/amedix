import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  planDefaults, loadPlanSettings, priceFor, publicPlans, intervalAdvanceMs,
  buildPaymentEntry, applyPaymentPatch, effectiveStatus,
} from '../../shared/partnerBilling.ts';
import { canTransition, validateCampaignDates } from '../../shared/partnerAds.ts';

// Administrator management of the partner advertising system: plan settings
// (prices, currency, interval, intro offers, grace period, availability) and
// the subscription ledger (affiliation approval, suspend, reinstate, cancel,
// payments) plus advertisement review (approve, reject, schedule, publish,
// pause, resume) and partner change requests. Admin-only — every call is
// rejected for non-admin accounts. Only administrators approve advertisements;
// partners can never approve their own.
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
        premium_upgrade_fee: num(input.premium_upgrade_fee) ?? 0,
        pharmacy_standard_description: String(input.pharmacy_standard_description || '').slice(0, 500),
        pharmacy_premium_description: String(input.pharmacy_premium_description || '').slice(0, 500),
        lab_standard_description: String(input.lab_standard_description || '').slice(0, 500),
        lab_premium_description: String(input.lab_premium_description || '').slice(0, 500),
        plan_features: (Array.isArray(input.plan_features) ? input.plan_features : [])
          .map((f) => String(f || '').trim().slice(0, 120)).filter(Boolean).slice(0, 10),
        intro_offer_enabled: !!input.intro_offer_enabled,
        intro_discount_percent: num(input.intro_discount_percent) ?? 0,
        intro_duration_months: num(input.intro_duration_months) ?? 0,
        grace_days: num(input.grace_days) ?? 7,
        overdue_policy: String(input.overdue_policy || '').slice(0, 500),
        pharmacy_standard_available: input.pharmacy_standard_available !== false,
        pharmacy_premium_available: input.pharmacy_premium_available !== false,
        lab_standard_available: input.lab_standard_available !== false,
        lab_premium_available: input.lab_premium_available !== false,
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
      const adsBySub = {};
      for (const ad of (ads.items || ads)) {
        if (!adsBySub[ad.subscription_id]) adsBySub[ad.subscription_id] = ad;
      }
      return Response.json({
        subscriptions: (subs.items || subs).map((s) => ({
          ...s,
          advertisement: adsBySub[s.id] || null,
        })),
        settings,
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
        const updated = await adsEntity.update(ad.id, {
          ...reviewPatch(), status: 'approved', rejection_reason: null,
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
      return Response.json({ advertisement: updated });
    }

    if (action === 'publish_ad') {
      const ad = await adsEntity.get(body.ad_id);
      if (!ad) return Response.json({ error: 'Advertisement not found' }, { status: 404 });
      if (!canTransition(ad.status, 'published')) {
        return Response.json({ error: `An advertisement in status "${ad.status}" cannot be published` }, { status: 400 });
      }
      // Publication requires a verified, affiliated organization: the linked
      // subscription must be active (affiliation approved). Ad approval alone
      // says nothing about payment — the overdue/grace rules are applied at
      // display time.
      const sub = await subsEntity.get(ad.subscription_id);
      if (!sub || sub.status !== 'active') {
        return Response.json({ error: 'The subscription must be approved and active before the advertisement can be published' }, { status: 400 });
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
        if (!sub || sub.status !== 'active') {
          return Response.json({ error: 'The subscription must be active to resume the advertisement' }, { status: 400 });
        }
      }
      const updated = await adsEntity.update(ad.id, { ...reviewPatch(), status: to });
      return Response.json({ advertisement: updated });
    }

    // ---- Subscription actions (subscription_id based) ----

    if (!body.subscription_id) return Response.json({ error: 'subscription_id is required' }, { status: 400 });
    const sub = await subsEntity.get(body.subscription_id);
    if (!sub) return Response.json({ error: 'Subscription not found' }, { status: 404 });

    // Affiliation / ownership verification: the administrator confirms the
    // partner organization and its subscription terms before billing starts.
    // This does NOT approve the advertisement — that is a separate review.
    if (action === 'approve') {
      if (sub.status !== 'pending_approval') {
        return Response.json({ error: 'Only pending subscriptions can be approved' }, { status: 400 });
      }
      const settings = await loadPlanSettings(base44);
      const price = priceFor(settings, sub.partner_type, sub.tier);
      if (!price) return Response.json({ error: 'Set the plan pricing first' }, { status: 400 });
      const now = new Date();
      const patch = {
        status: 'active',
        price_amount: price,
        currency: settings.currency || 'LYD',
        billing_interval: settings.billing_interval || 'month',
        start_datetime: now.toISOString(),
        next_billing_datetime: new Date(now.getTime() + intervalAdvanceMs(settings.billing_interval || 'month')).toISOString(),
        approved_by_name: user.full_name || user.email,
        approved_datetime: now.toISOString(),
        admin_notes: body.admin_notes ? String(body.admin_notes).slice(0, 500) : (sub.admin_notes || ''),
      };
      if (settings.intro_offer_enabled && (settings.intro_discount_percent || 0) > 0) {
        patch.intro_discount_percent = settings.intro_discount_percent;
        patch.intro_months_remaining = settings.intro_duration_months || 1;
      }
      await subsEntity.update(sub.id, patch);
      return Response.json({ subscription: { ...sub, ...patch } });
    }

    if (action === 'suspend') {
      await subsEntity.update(sub.id, {
        status: 'suspended',
        suspension_reason: String(body.reason || '').slice(0, 300) || 'Suspended by the administrator',
        admin_notes: body.admin_notes ? String(body.admin_notes).slice(0, 500) : (sub.admin_notes || ''),
      });
      return Response.json({ subscription: { ...sub, status: 'suspended' } });
    }

    if (action === 'reinstate') {
      if (sub.status !== 'suspended') return Response.json({ error: 'Only suspended subscriptions can be reinstated' }, { status: 400 });
      await subsEntity.update(sub.id, { status: 'active', suspension_reason: null });
      return Response.json({ subscription: { ...sub, status: 'active' } });
    }

    if (action === 'cancel') {
      await subsEntity.update(sub.id, {
        status: 'cancelled',
        suspension_reason: String(body.reason || '').slice(0, 300),
        cancelled_datetime: new Date().toISOString(),
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
      const settings = await loadPlanSettings(base44);
      if (effectiveStatus(sub, settings) === 'suspended' && sub.status === 'active' && sub.next_billing_datetime) {
        return Response.json({ error: 'This subscription is overdue past its grace period — reinstate it first' }, { status: 400 });
      }
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
        return Response.json({ error: 'Enter a valid payment amount' }, { status: 400 });
      }
      const appliesTo = body.applies_to === 'upgrade_fee' && (sub.pending_upgrade_fee || 0) > 0
        ? 'upgrade_fee' : 'subscription';
      const entry = buildPaymentEntry(
        sub,
        { amount, method: body.method, note: body.note, appliesTo },
        user.full_name || user.email,
        'admin',
        body.entry_type === 'adjustment' || body.entry_type === 'refund' ? body.entry_type : 'payment'
      );
      const patch = applyPaymentPatch(sub, entry);
      // A caught-up payment clears an overdue state. A payment NEVER changes
      // advertisement approval status — those are separate concepts.
      if (sub.status === 'active' && patch.next_billing_datetime) {
        patch.suspension_reason = null;
      }
      await subsEntity.update(sub.id, patch);
      return Response.json({ subscription: { ...sub, ...patch } });
    }

    // Decide a partner change request (upgrade / downgrade / renewal / cancellation).
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
        const updated = await subsEntity.update(sub.id, { pending_change: decided });
        return Response.json({ subscription: updated });
      }
      const settings = await loadPlanSettings(base44);
      const patch = { pending_change: decided };
      if (change.request_type === 'upgrade' || change.request_type === 'downgrade') {
        const price = priceFor(settings, sub.partner_type, change.requested_tier);
        if (!price) return Response.json({ error: 'Set the plan pricing first' }, { status: 400 });
        patch.tier = change.requested_tier;
        patch.price_amount = price;
        if (sub.tier === 'standard' && change.requested_tier === 'premium' && (settings.premium_upgrade_fee || 0) > 0) {
          patch.pending_upgrade_fee = settings.premium_upgrade_fee;
        }
        // Premium placement follows the subscription tier — never the other way.
        const ads = await adsEntity.filter({ subscription_id: sub.id }, { sort: '-created_date', limit: 1 });
        const ad = (ads.items || ads)[0];
        if (ad) {
          await adsEntity.update(ad.id, { placement: change.requested_tier, updated_datetime: new Date().toISOString() });
        }
      } else if (change.request_type === 'cancellation') {
        patch.status = 'cancelled';
        patch.cancelled_datetime = new Date().toISOString();
        const ads = await adsEntity.filter({ subscription_id: sub.id });
        for (const ad of (ads.items || ads)) {
          if (['published', 'scheduled', 'approved', 'paused', 'pending_review'].includes(ad.status)) {
            await adsEntity.update(ad.id, { status: 'expired', updated_datetime: new Date().toISOString() });
          }
        }
      }
      // 'renewal' requests are satisfied by recording the renewal payment —
      // approving the request only clears it.
      const updated = await subsEntity.update(sub.id, patch);
      return Response.json({ subscription: updated });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}