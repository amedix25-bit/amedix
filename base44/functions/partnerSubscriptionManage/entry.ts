import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  loadPlanSettings, priceFor, isAvailable, publicPlans, effectiveStatus,
} from '../../shared/partnerBilling.ts';
import {
  validateAdContent, validateCampaignDates, partnerProfileSnapshot, canTransition,
} from '../../shared/partnerAds.ts';

// Partner-side management of advertising subscriptions for pharmacies and
// laboratories. Partners subscribe to a tier (confirming the billing terms),
// edit and submit their advertisement for review, view their subscription
// status / plan / billing history / renewal date / pending actions, and request
// an upgrade, downgrade, renewal or cancellation subject to the configured
// terms. Partners can NEVER approve their own advertisement or change their
// own subscription payment status — payments are recorded by the administrator
// only. Every action is scoped to the authenticated organization account.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'get';
    const partnerType = body.partner_type === 'laboratory' ? 'laboratory' : 'pharmacy';

    // Subscription, advertisement, profile and plan-settings operations run
    // through the service role: these records are writable only by backend
    // logic (and the administrator for settings) — never directly by a
    // partner account at the database layer.
    const svc = base44.asServiceRole;
    const settings = await loadPlanSettings(svc);

    // The existing organization profile is reused — never duplicated.
    const profileEntity = partnerType === 'pharmacy'
      ? svc.entities.PharmacyProfile : svc.entities.LaboratoryProfile;
    const profiles = await profileEntity.filter({ user_id: user.id });
    const profile = (profiles.items || profiles)[0];
    if (!profile) return Response.json({ error: 'Organization profile not found' }, { status: 404 });

    const own = await svc.entities.PartnerSubscription.filter({
      partner_user_id: user.id,
      partner_type: partnerType,
    });
    const sub = (own.items || own)[0] || null;

    const loadAd = async () => {
      if (!sub) return null;
      const res = await svc.entities.PartnerAdvertisement.filter(
        { subscription_id: sub.id },
        { sort: '-created_date', limit: 1 }
      );
      return (res.items || res)[0] || null;
    };

    if (action === 'get') {
      const effective = sub ? effectiveStatus(sub, settings) : null;
      const ad = await loadAd();
      return Response.json({
        subscription: sub ? { ...sub, effective_status: effective } : null,
        advertisement: ad,
        plans: publicPlans(settings, partnerType),
      });
    }

    // Subscribe: the representative selects a tier, reviews the billing terms
    // and explicitly confirms them. The subscription enters pending_approval
    // and a DRAFT advertisement record is created alongside it.
    if (action === 'subscribe') {
      if (body.confirmed !== true) {
        return Response.json({ error: 'Please confirm the billing terms to submit your request' }, { status: 400 });
      }
      const tier = body.tier === 'premium' ? 'premium' : 'standard';
      if (!isAvailable(settings, partnerType, tier)) {
        return Response.json({ error: 'This plan is not currently accepting new subscriptions' }, { status: 400 });
      }
      if (!priceFor(settings, partnerType, tier)) {
        return Response.json({ error: 'Plan pricing has not been configured yet — please contact the administrator' }, { status: 400 });
      }
      if (sub && sub.status !== 'cancelled') {
        return Response.json({ error: 'You already have a subscription' }, { status: 400 });
      }
      // Validate the advertisement content BEFORE creating the subscription so
      // a rejected cover image or invalid content never leaves an orphaned
      // subscription record behind.
      const adContent = validateAdContent(body.ad || {});
      if (adContent.error) return Response.json({ error: adContent.error }, { status: 400 });
      const snapshot = partnerProfileSnapshot(partnerType, profile);
      const now = new Date().toISOString();
      const base = {
        ...snapshot,
        partner_type: partnerType,
        tier,
        status: 'pending_approval',
        price_amount: null,
        currency: null,
        billing_interval: null,
        intro_months_remaining: null,
        intro_discount_percent: null,
        pending_upgrade_fee: null,
        start_datetime: null,
        next_billing_datetime: null,
        approved_by_name: null,
        approved_datetime: null,
        cancelled_datetime: null,
        suspension_reason: null,
        pending_change: null,
      };
      let savedSub;
      if (sub) {
        savedSub = await svc.entities.PartnerSubscription.update(sub.id, base);
      } else {
        savedSub = await svc.entities.PartnerSubscription.create({
          ...base,
          partner_user_id: user.id,
          created_datetime: now,
        });
      }
      // Expire any previous advertisement of this partner.
      const prevAds = await svc.entities.PartnerAdvertisement.filter({ partner_user_id: user.id, partner_type: partnerType });
      for (const old of (prevAds.items || prevAds)) {
        if (!['expired'].includes(old.status)) {
          await svc.entities.PartnerAdvertisement.update(old.id, { status: 'expired', updated_datetime: now });
        }
      }
      const ad = await svc.entities.PartnerAdvertisement.create({
        ad_id: `PAB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        subscription_id: savedSub.id,
        partner_type: partnerType,
        partner_id: snapshot.partner_id,
        partner_user_id: user.id,
        partner_name: snapshot.partner_name,
        partner_number: snapshot.partner_number,
        logo_url: snapshot.partner_logo_url,
        location: snapshot.partner_address,
        ...adContent.patch,
        contact_phone: adContent.patch.contact_phone || profile.phone || '',
        placement: tier,
        status: 'draft',
        campaign_start_date: null,
        campaign_end_date: null,
        rejection_reason: null,
        reviewed_by_name: null,
        reviewed_datetime: null,
        created_datetime: now,
        updated_datetime: now,
      });
      return Response.json({ subscription: savedSub, advertisement: ad });
    }

    if (!sub) return Response.json({ error: 'No subscription found' }, { status: 404 });

    // Edit advertisement content. While the ad is already approved, scheduled,
    // published or paused, an important content change requires renewed
    // approval: the ad returns to pending_review. A rejected ad returns to
    // draft when its content is edited, so the partner can resubmit.
    if (action === 'update_ad') {
      if (sub.status === 'cancelled') return Response.json({ error: 'Subscription is cancelled' }, { status: 400 });
      const ad = body.ad_id
        ? await svc.entities.PartnerAdvertisement.get(body.ad_id)
        : await loadAd();
      if (!ad || ad.partner_user_id !== user.id) return Response.json({ error: 'Advertisement not found' }, { status: 404 });
      if (ad.status === 'expired') return Response.json({ error: 'This advertisement has expired' }, { status: 400 });
      const content = validateAdContent(body);
      if (content.error) return Response.json({ error: content.error }, { status: 400 });
      const needsRenewedReview = ['approved', 'scheduled', 'published', 'paused'].includes(ad.status);
      const patch = {
        ...content.patch,
        logo_url: partnerProfileSnapshot(partnerType, profile).partner_logo_url, // keep logo in sync
        updated_datetime: new Date().toISOString(),
      };
      if (needsRenewedReview) {
        patch.status = 'pending_review';
        patch.reviewed_by_name = null;
        patch.reviewed_datetime = null;
      } else if (ad.status === 'rejected') {
        patch.status = 'draft';
      }
      const updated = await svc.entities.PartnerAdvertisement.update(ad.id, patch);
      return Response.json({ advertisement: updated });
    }

    // Submit for review: draft or rejected → pending_review. Only the
    // administrator can approve — a partner can never approve their own ad.
    if (action === 'submit_ad') {
      if (sub.status === 'cancelled') return Response.json({ error: 'Subscription is cancelled' }, { status: 400 });
      const ad = body.ad_id
        ? await svc.entities.PartnerAdvertisement.get(body.ad_id)
        : await loadAd();
      if (!ad || ad.partner_user_id !== user.id || ad.subscription_id !== sub.id || ad.partner_type !== partnerType) {
        return Response.json({ error: 'Advertisement not found' }, { status: 404 });
      }
      if (!canTransition(ad.status, 'pending_review')) {
        return Response.json({ error: `An advertisement in status "${ad.status}" cannot be submitted for review` }, { status: 400 });
      }
      // Merge before normalization: older open pages submit only the action.
      // Normalizing that request alone would erase the already saved fields.
      const content = validateAdContent({ ...ad, ...body }, { requireContent: true });
      if (content.error) {
        const unsaved = body.title === undefined && body.description === undefined && (!ad.title || !ad.description);
        return Response.json({
          error: unsaved ? 'Your changes have not been saved yet. Click Save, then Submit for review.' : content.error,
        }, { status: 400 });
      }
      const dates = validateCampaignDates(ad.campaign_start_date, ad.campaign_end_date);
      if (dates.error) return Response.json({ error: dates.error }, { status: 400 });
      const updated = await svc.entities.PartnerAdvertisement.update(ad.id, {
        ...content.patch,
        status: 'pending_review',
        rejection_reason: null,
        updated_datetime: new Date().toISOString(),
      });
      return Response.json({ advertisement: updated });
    }

    // Withdraw back to draft.
    if (action === 'withdraw_ad') {
      const ad = await loadAd();
      if (!ad) return Response.json({ error: 'Advertisement not found' }, { status: 404 });
      if (!canTransition(ad.status, 'draft')) {
        return Response.json({ error: `An advertisement in status "${ad.status}" cannot be withdrawn` }, { status: 400 });
      }
      const updated = await svc.entities.PartnerAdvertisement.update(ad.id, {
        status: 'draft',
        updated_datetime: new Date().toISOString(),
      });
      return Response.json({ advertisement: updated });
    }

    // Request an upgrade, downgrade, renewal or cancellation. Requests are
    // decided by the administrator; the partner cannot change payment status.
    if (action === 'request_change') {
      // A paid subscription in its grace period (past_due) can still request
      // changes; pending, suspended and cancelled ones cannot.
      if (!['active', 'past_due'].includes(sub.status)) {
        return Response.json({ error: 'Only an active subscription can be changed' }, { status: 400 });
      }
      if (sub.pending_change && sub.pending_change.status === 'pending') {
        return Response.json({ error: 'You already have a change request awaiting the administrator' }, { status: 400 });
      }
      const type = String(body.change_type || '');
      if (!['upgrade', 'downgrade', 'renewal', 'cancellation'].includes(type)) {
        return Response.json({ error: 'Unknown request type' }, { status: 400 });
      }
      const requestedTier = type === 'upgrade' ? 'premium' : type === 'downgrade' ? 'standard' : null;
      if (requestedTier) {
        if (requestedTier === sub.tier) return Response.json({ error: 'You are already on this plan' }, { status: 400 });
        if (!isAvailable(settings, partnerType, requestedTier)) {
          return Response.json({ error: 'This plan is not currently accepting subscriptions' }, { status: 400 });
        }
        if (!priceFor(settings, partnerType, requestedTier)) {
          return Response.json({ error: 'Plan pricing has not been configured yet' }, { status: 400 });
        }
      }
      const pendingChange = {
        request_type: type,
        requested_tier: requestedTier,
        note: String(body.note || '').slice(0, 300),
        requested_by_name: user.full_name || user.email,
        requested_datetime: new Date().toISOString(),
        status: 'pending',
        decided_by_name: null,
        decided_datetime: null,
        decision_note: null,
      };
      const updated = await svc.entities.PartnerSubscription.update(sub.id, { pending_change: pendingChange });
      return Response.json({ subscription: { ...updated, pending_change: pendingChange } });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}