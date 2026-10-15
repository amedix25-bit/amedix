import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { loadPlanSettings, effectiveStatus, DAY_MS } from '../../shared/partnerBilling.ts';
import { adDisplayEligible } from '../../shared/partnerAds.ts';

// Serves published partner advertisements to the Patient Portal. A section is
// passed in ('pharmacy' or 'laboratory') and ONLY advertisements of that type
// are returned — pharmacy ads appear exclusively in the patient Prescriptions
// tab and laboratory ads exclusively in the Labs tab.
//
// Display rules: APPROVED and due SCHEDULED ads are published automatically
// when the subscription permits display; paused, rejected, expired, draft and
// unapproved ads are never returned; a scheduled ad never appears before its
// start date and every ad stops after its end date; the linked subscription
// must be active and not overdue past its grace period — an expired
// subscription never retains paid Premium placement. Lazily applies the
// scheduled→published and published→expired transitions as time passes. No
// pricing or billing data is ever returned here.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const section = body.section === 'laboratory' ? 'laboratory' : 'pharmacy';

    // Entitlement settings are administrator-only. Read them server-side after
    // authentication, without exposing billing settings to the patient.
    const settings = await loadPlanSettings(base44.asServiceRole);
    const now = new Date();

    const adsEntity = base44.asServiceRole.entities.PartnerAdvertisement;
    const subsEntity = base44.asServiceRole.entities.PartnerSubscription;

    const ads = await adsEntity.filter({ partner_type: section }, { sort: '-created_date', limit: 200 });
    // Ads keep running for active, past-due (grace period),
    // cancellation-pending (end of the paid period) and pending-payment
    // (first payment not yet verified) subscriptions.
    const subs = await subsEntity.filter({
      partner_type: section,
      status: { $in: ['active', 'past_due', 'cancellation_pending', 'pending_payment'] },
    });
    const subById = {};
    for (const s of (subs.items || subs)) subById[s.id] = s;

    const out = [];
    const pendingStatusPatches = [];

    for (const ad of (ads.items || ads)) {
      const sub = subById[ad.subscription_id];
      const check = adDisplayEligible(ad, sub, settings, now);

      // Approved content with an entitled subscription and an open campaign
      // window becomes genuinely published, not just eligible in this response.
      if (['approved', 'scheduled'].includes(ad.status) && check.eligible) {
        pendingStatusPatches.push(adsEntity.update(ad.id, {
          status: 'published', updated_datetime: now.toISOString(),
        }));
      } else if (ad.status === 'published' && check.reason === 'after_end') {
        pendingStatusPatches.push(adsEntity.update(ad.id, { status: 'expired' }));
      } else if (['published', 'scheduled'].includes(ad.status) && check.reason === 'subscription_inactive') {
        pendingStatusPatches.push(adsEntity.update(ad.id, { status: 'expired' }));
      }

      if (!check.eligible) continue;
      out.push({
        ad_id: ad.id,
        partner_id: ad.partner_id,
        partner_name: ad.partner_name,
        partner_number: ad.partner_number,
        partner_logo_url: ad.logo_url || '',
        partner_address: ad.location || '',
        partner_phone: '',
        partner_whatsapp: '',
        tier: sub.tier,
        company_name: ad.company_name || '',
        ad_title: ad.title || '',
        ad_description: ad.description || '',
        ad_cover_url: ad.cover_url || '',
        ad_services: ad.services || [],
        ad_contact_phone: ad.contact_phone || '',
        ad_hours: ad.hours || '',
      });
    }

    if (pendingStatusPatches.length) {
      await Promise.allSettled(pendingStatusPatches);
    }

    // Deduplicate: one advertisement per organization, even if duplicate
    // records or subscriptions ever exist.
    const seen = new Set();
    const unique = out.filter((a) => {
      if (seen.has(a.partner_id)) return false;
      seen.add(a.partner_id);
      return true;
    });

    // Deterministic ordering with fair rotation: Premium partners are featured
    // first, but within each group the order rotates daily — so repeated
    // refreshes never change the order, yet no partner keeps the top regular
    // slot forever.
    const rotate = (arr, offset) => (arr.length ? arr.map((_, i) => arr[(i + offset) % arr.length]) : arr);
    const dayNumber = Math.floor(now.getTime() / DAY_MS);
    const premium = rotate(unique.filter((a) => a.tier === 'premium'), dayNumber);
    const standard = rotate(unique.filter((a) => a.tier !== 'premium'), dayNumber);

    return Response.json({ ads: [...premium, ...standard] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}