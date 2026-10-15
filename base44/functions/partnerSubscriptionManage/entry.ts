import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  loadPlanSettings, priceFor, isAvailable, publicPlans,
  buildPaymentEntry, applyPaymentPatch, effectiveStatus, DAY_MS,
} from '../../shared/partnerBilling.ts';

// Partner-side management of advertising subscriptions for pharmacies and
// laboratories. Partners can subscribe to a tier, edit their advertisement,
// change tier, record payments against the billing ledger and cancel. Every
// action is scoped to the authenticated organization account — partners can
// never touch another partner's subscription.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'get';
    const partnerType = body.partner_type === 'laboratory' ? 'laboratory' : 'pharmacy';

    const settings = await loadPlanSettings(base44);

    // The existing organization profile is reused — never duplicated.
    const profileEntity = partnerType === 'pharmacy'
      ? base44.entities.PharmacyProfile : base44.entities.LaboratoryProfile;
    const profiles = await profileEntity.filter({ user_id: user.id });
    const profile = (profiles.items || profiles)[0];
    if (!profile) return Response.json({ error: 'Organization profile not found' }, { status: 404 });

    const own = await base44.entities.PartnerSubscription.filter({
      partner_user_id: user.id,
      partner_type: partnerType,
    });
    const sub = (own.items || own)[0] || null;

    const refreshSnapshot = () => ({
      partner_id: profile.id,
      partner_name: partnerType === 'pharmacy' ? profile.pharmacy_name : profile.lab_name,
      partner_number: partnerType === 'pharmacy' ? profile.pharmacy_number : profile.lab_number,
      partner_logo_url: profile.logo_url || '',
      partner_address: profile.address || '',
      partner_phone: profile.phone || '',
      partner_whatsapp: profile.whatsapp_number || '',
    });

    if (action === 'get') {
      const effective = sub ? effectiveStatus(sub, settings) : null;
      return Response.json({
        subscription: sub ? { ...sub, effective_status: effective } : null,
        plans: publicPlans(settings, partnerType),
      });
    }

    if (action === 'subscribe') {
      const tier = body.tier === 'premium' ? 'premium' : 'standard';
      if (!isAvailable(settings, partnerType, tier)) {
        return Response.json({ error: 'This plan is not currently accepting new subscriptions' }, { status: 400 });
      }
      if (!priceFor(settings, partnerType, tier)) {
        return Response.json({ error: 'Plan pricing has not been configured yet — please contact the administrator' }, { status: 400 });
      }
      if (sub && ['active', 'pending_approval'].includes(sub.status)) {
        return Response.json({ error: 'You already have a subscription' }, { status: 400 });
      }
      const snapshot = refreshSnapshot();
      const base = {
        ...snapshot,
        tier,
        status: 'pending_approval',
        ad_description: '',
        ad_services: [],
        ad_contact_phone: profile.phone || '',
        ad_hours: (partnerType === 'pharmacy' ? profile.operating_hours : '') || '',
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
      };
      if (sub) {
        await base44.entities.PartnerSubscription.update(sub.id, base);
        return Response.json({ subscription: { ...sub, ...base } });
      }
      const created = await base44.entities.PartnerSubscription.create({
        ...base,
        partner_user_id: user.id,
        created_datetime: new Date().toISOString(),
      });
      return Response.json({ subscription: created });
    }

    if (!sub) return Response.json({ error: 'No subscription found' }, { status: 404 });

    if (action === 'update_ad') {
      if (sub.status === 'cancelled') return Response.json({ error: 'Subscription is cancelled' }, { status: 400 });
      const patch = {
        partner_logo_url: refreshSnapshot().partner_logo_url, // keep logo in sync with the profile
        ad_description: String(body.ad_description || '').slice(0, 1000),
        ad_cover_url: body.ad_cover_url ? String(body.ad_cover_url).slice(0, 500) : '',
        ad_services: (Array.isArray(body.ad_services) ? body.ad_services : [])
          .map((s) => String(s || '').trim().slice(0, 80)).filter(Boolean).slice(0, 12),
        ad_contact_phone: String(body.ad_contact_phone || '').slice(0, 40),
        ad_hours: String(body.ad_hours || '').slice(0, 120),
      };
      await base44.entities.PartnerSubscription.update(sub.id, patch);
      return Response.json({ subscription: { ...sub, ...patch } });
    }

    if (action === 'change_tier') {
      if (sub.status !== 'active') return Response.json({ error: 'Only an active subscription can change tier' }, { status: 400 });
      const tier = body.tier === 'premium' ? 'premium' : 'standard';
      if (tier === sub.tier) return Response.json({ subscription: sub });
      if (!isAvailable(settings, partnerType, tier)) {
        return Response.json({ error: 'This plan is not currently accepting subscriptions' }, { status: 400 });
      }
      const price = priceFor(settings, partnerType, tier);
      if (!price) return Response.json({ error: 'Plan pricing has not been configured yet' }, { status: 400 });
      const patch = { tier, price_amount: price, billing_interval: settings.billing_interval || 'month' };
      // The Premium price is the total inclusive price; only charge an extra
      // upgrade fee when the administrator explicitly configured one.
      if (sub.tier === 'standard' && tier === 'premium' && (settings.premium_upgrade_fee || 0) > 0) {
        patch.pending_upgrade_fee = settings.premium_upgrade_fee;
      }
      await base44.entities.PartnerSubscription.update(sub.id, patch);
      return Response.json({ subscription: { ...sub, ...patch } });
    }

    if (action === 'record_payment') {
      if (sub.status !== 'active') return Response.json({ error: 'Only an active subscription can receive payments' }, { status: 400 });
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
        partnerType
      );
      const patch = applyPaymentPatch(sub, entry);
      await base44.entities.PartnerSubscription.update(sub.id, patch);
      return Response.json({ subscription: { ...sub, ...patch, effective_status: 'active' } });
    }

    if (action === 'cancel') {
      await base44.entities.PartnerSubscription.update(sub.id, {
        status: 'cancelled',
        cancelled_datetime: new Date().toISOString(),
      });
      return Response.json({ subscription: { ...sub, status: 'cancelled' } });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}