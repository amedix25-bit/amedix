import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  loadPlanSettings, planDefaults, effectiveStatus, intervalAdvanceMs, DAY_MS,
} from '../../shared/partnerBilling.ts';
import { notifyPartner } from '../../shared/partnerNotifications.ts';

// Automatic lifecycle scan for partner subscriptions and advertisements.
// Called only by the scheduled "Partner Lifecycle Scan" workflow, so it
// verifies the workflow's admin identity before doing anything.
//
// Responsibilities (all idempotent — a transition only happens from its
// expected source state, and a once-per-day guard on the plan settings
// prevents the same day from being processed twice):
//  - ACTIVE/PAST_DUE past the billing date within the grace period -> PAST_DUE
//    (ad keeps running under the grace-period policy).
//  - Past the grace period without payment -> SUSPENDED with an automatic
//    reason; the paid advertising entitlement is suspended (live ads pause).
//  - CANCELLATION_PENDING past its cancellation effective date -> CANCELLED
//    (end-of-period policy); its ads expire.
//  - Scheduled tier/price changes take effect once their effective date
//    arrives.
//  - PUBLISHED ads past their campaign end date -> EXPIRED; SCHEDULED ads
//    whose campaign window has begun and whose subscription is paid ->
//    PUBLISHED.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const s = base44.asServiceRole;
    const now = new Date();
    const nowIso = now.toISOString();
    const today = nowIso.slice(0, 10);

    // Ensure a settings record exists so the once-per-day guard works even
    // before the administrator saves any commercial terms.
    const existingSettings = await base44.entities.PartnerPlanSettings.filter({}, { limit: 1 });
    let settings = (existingSettings.items || existingSettings)[0];
    if (!settings) {
      settings = await base44.entities.PartnerPlanSettings.create({ ...planDefaults() });
    }
    if (settings.last_lifecycle_scan_date === today) {
      return Response.json({ skipped: true, date: today, note: 'Lifecycle already processed today' });
    }

    const subsEntity = s.entities.PartnerSubscription;
    const adsEntity = s.entities.PartnerAdvertisement;
    const subs = await subsEntity.filter({}, { limit: 500 });
    const all = subs.items || subs;
    const subById = {};
    for (const sub of all) subById[sub.id] = sub;

    const grace = (settings.grace_days == null ? 7 : settings.grace_days) * DAY_MS;
    const changes = { subscriptions: 0, ads: 0 };

    for (const sub of all) {
      let patch = null;
      const eff = effectiveStatus(sub, settings, now);

      // Grace period / overdue policy.
      if (sub.next_billing_datetime && ['active', 'past_due'].includes(sub.status)) {
        const overdueMs = now.getTime() - new Date(sub.next_billing_datetime).getTime();
        if (overdueMs > 0 && overdueMs <= grace && sub.status !== 'past_due') {
          patch = { status: 'past_due' };
        } else if (overdueMs > grace) {
          // Grace period ended without payment: suspend the paid advertising
          // entitlement per the configured policy.
          patch = {
            status: 'suspended',
            suspension_reason: `Overdue past the grace period (${settings.grace_days == null ? 7 : settings.grace_days} days) — automatic policy`,
          };
        }
      }

      // End-of-period cancellation finalization.
      if (sub.status === 'cancellation_pending' && sub.cancellation_effective_datetime) {
        if (now.getTime() >= new Date(sub.cancellation_effective_datetime).getTime()) {
          patch = {
            status: 'cancelled',
            cancelled_datetime: nowIso,
            cancellation_effective_datetime: sub.cancellation_effective_datetime,
          };
        }
      }

      // Scheduled tier/price change taking effect at the renewal date.
      if (!patch && sub.scheduled_tier && sub.price_effective_datetime
        && now.getTime() >= new Date(sub.price_effective_datetime).getTime()) {
        patch = {
          tier: sub.scheduled_tier,
          price_amount: sub.scheduled_price_amount != null ? sub.scheduled_price_amount : sub.price_amount,
          scheduled_tier: null,
          scheduled_price_amount: null,
          price_effective_datetime: null,
        };
      }

      // Approaching-renewal reminder — once per billing date, 7 days ahead.
      if (sub.status === 'active' && sub.next_billing_datetime) {
        const dueMs = new Date(sub.next_billing_datetime).getTime() - now.getTime();
        if (dueMs > 0 && dueMs <= 7 * DAY_MS) {
          await notifyPartner(s, sub.partner_type, sub, {
            title: 'Renewal due soon',
            message: `Your subscription renews on ${sub.next_billing_datetime.slice(0, 10)}.`,
            dedupeKey: `sub:${sub.id}:renewal_7d:${sub.next_billing_datetime}`,
          });
        }
      }

      if (patch) {
        await subsEntity.update(sub.id, patch);
        changes.subscriptions += 1;
        const updated = { ...sub, ...patch };
        if (updated.status === 'past_due') {
          await notifyPartner(s, sub.partner_type, sub, {
            title: 'Payment overdue',
            message: `The renewal payment is overdue (was due ${sub.next_billing_datetime ? sub.next_billing_datetime.slice(0, 10) : ''}). The grace period is running — the advertisement keeps showing until it ends.`,
            dedupeKey: `sub:${sub.id}:past_due:${sub.next_billing_datetime}`,
          });
        }
        if (updated.status === 'suspended') {
          await notifyPartner(s, sub.partner_type, sub, {
            title: 'Subscription suspended',
            message: 'The grace period ended without a verified payment — the paid advertising entitlement is suspended. Record a payment to restore it.',
            dedupeKey: `sub:${sub.id}:suspended:${today}`,
          });
        }
        if (updated.status === 'cancelled') {
          await notifyPartner(s, sub.partner_type, sub, {
            title: 'Subscription cancelled',
            message: 'Your subscription reached its cancellation date and has ended. Its advertisement has expired.',
            dedupeKey: `sub:${sub.id}:cancelled:${today}`,
          });
        }
        // A suspended subscription can never display a Premium advertisement.
        if (updated.status === 'suspended') {
          const ads = await adsEntity.filter({ subscription_id: sub.id });
          for (const ad of (ads.items || ads)) {
            if (['published', 'scheduled'].includes(ad.status)) {
              await adsEntity.update(ad.id, { status: 'paused', updated_datetime: nowIso });
              changes.ads += 1;
            }
          }
        }
        // A finalized cancellation expires its ads.
        if (updated.status === 'cancelled') {
          const ads = await adsEntity.filter({ subscription_id: sub.id });
          for (const ad of (ads.items || ads)) {
            if (['published', 'scheduled', 'approved', 'paused', 'pending_review'].includes(ad.status)) {
              await adsEntity.update(ad.id, { status: 'expired', updated_datetime: nowIso });
              changes.ads += 1;
            }
          }
        }
      }
    }

    // Campaign window transitions for live advertisements.
    const ads = await adsEntity.filter({}, { limit: 500 });
    for (const ad of (ads.items || ads)) {
      const sub = subById[ad.subscription_id];
      const subEff = sub ? effectiveStatus(sub, settings, now) : null;
      if (ad.status === 'published' && ad.campaign_end_date && today > ad.campaign_end_date) {
        await adsEntity.update(ad.id, { status: 'expired', updated_datetime: nowIso });
        changes.ads += 1;
        await notifyPartner(s, ad.partner_type, ad, {
          title: 'Advertisement campaign ended',
          message: `"${ad.title || 'Your advertisement'}" expired after its campaign end date.`,
          dedupeKey: `ad:${ad.id}:expired:${today}`,
        });
      } else if (ad.status === 'scheduled' && ad.campaign_start_date && today >= ad.campaign_start_date) {
        if (!ad.campaign_end_date || today <= ad.campaign_end_date) {
          if (['active', 'past_due'].includes(subEff)) {
            await adsEntity.update(ad.id, { status: 'published', updated_datetime: nowIso });
            changes.ads += 1;
            await notifyPartner(s, ad.partner_type, ad, {
              title: 'Advertisement is now live',
              message: `"${ad.title || 'Your advertisement'}" is now visible to patients.`,
              dedupeKey: `ad:${ad.id}:published:${today}`,
            });
          }
        } else {
          await adsEntity.update(ad.id, { status: 'expired', updated_datetime: nowIso });
          changes.ads += 1;
          await notifyPartner(s, ad.partner_type, ad, {
            title: 'Advertisement campaign ended',
            message: `"${ad.title || 'Your advertisement'}" expired after its campaign end date.`,
            dedupeKey: `ad:${ad.id}:expired:${today}`,
          });
        }
      }
    }

    // Advance the once-per-day guard.
    await base44.entities.PartnerPlanSettings.update(settings.id, { last_lifecycle_scan_date: today });

    return Response.json({ processed: true, date: today, changes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}