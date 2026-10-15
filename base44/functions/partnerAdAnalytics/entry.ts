import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { effectiveStatus, expectedPaymentAmount } from '../../shared/partnerBilling.ts';

// Partner-side advertisement analytics. A partner may see analytics ONLY for
// its own organization (every query is filtered by the authenticated partner
// account). Returns totals per event type, a daily impression series for the
// last 30 days, a per-advertisement breakdown, and the subscription context
// (plan, status, campaign dates, verified payments). Analytics events carry no
// patient identities or health information — only deduplicated, anonymized
// counts.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const partnerType = body.partner_type === 'laboratory' ? 'laboratory' : 'pharmacy';

    const profileEntity = partnerType === 'pharmacy'
      ? base44.entities.PharmacyProfile : base44.entities.LaboratoryProfile;
    const profiles = await profileEntity.filter({ user_id: user.id });
    const profile = (profiles.items || profiles)[0];
    if (!profile) return Response.json({ error: 'Organization profile not found' }, { status: 404 });

    const subs = await base44.entities.PartnerSubscription.filter({
      partner_user_id: user.id, partner_type: partnerType,
    });
    const sub = (subs.items || subs)[0] || null;
    if (!sub) return Response.json({ error: 'No subscription found' }, { status: 404 });

    const settings = await loadPlanSettingsSafe(base44);
    const now = new Date();
    const effective = effectiveStatus(sub, settings, now);

    const adsEntity = base44.entities.PartnerAdvertisement;
    const ownAds = await adsEntity.filter({ partner_user_id: user.id, partner_type: partnerType }, { sort: '-created_date', limit: 50 });
    const adList = (ownAds.items || ownAds);

    const eventsEntity = base44.entities.PartnerAdEvent;
    const scoped = { partner_user_id: user.id };

    const byType = await eventsEntity.aggregate({ query: scoped, groupBy: 'event_type' });
    const totalsByType = { impression: 0, detail_view: 0, contact_click: 0, direction_click: 0 };
    for (const row of byType.rows || []) totalsByType[row.event_type] = row.count;

    const cutoff = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    const daily = await eventsEntity.aggregate({
      query: { ...scoped, event_type: 'impression', event_day: { $gte: cutoff } },
      dateBucket: { field: 'event_day', unit: 'day' }, limit: 40,
    });
    const dailySeries = (daily.rows || []).map((r) => ({ day: r.event_day || r.bucket, impressions: r.count }))
      .filter((r) => r.day).sort((a, b) => (a.day < b.day ? -1 : 1));

    const perAdTotals = await eventsEntity.aggregate({ query: scoped, groupBy: 'ad_id' });
    const perAdImpressions = await eventsEntity.aggregate({
      query: { ...scoped, event_type: 'impression' }, groupBy: 'ad_id',
    });
    const totalsMap = {};
    for (const row of perAdTotals.rows || []) totalsMap[row.ad_id] = row.count;
    const impMap = {};
    for (const row of perAdImpressions.rows || []) impMap[row.ad_id] = row.count;

    const ads = adList.map((ad) => ({
      ad_id: ad.ad_id,
      title: ad.title || '',
      status: ad.status,
      placement: ad.placement || 'standard',
      campaign_start_date: ad.campaign_start_date || null,
      campaign_end_date: ad.campaign_end_date || null,
      impressions: impMap[ad.id] || 0,
      total_interactions: totalsMap[ad.id] || 0,
    }));

    const verified = (sub.payments || []).filter((p) => p.verification === 'confirmed');
    const paid = verified.filter((p) => p.entry_type === 'payment').reduce((a, p) => a + p.amount, 0);
    const refunded = verified.filter((p) => p.entry_type === 'refund').reduce((a, p) => a + p.amount, 0);

    return Response.json({
      analytics: {
        totals_by_type: totalsByType,
        daily_impressions: dailySeries,
        ads,
        subscription: {
          tier: sub.tier,
          status: sub.status,
          effective_status: effective,
          price_amount: sub.price_amount,
          currency: sub.currency,
          billing_interval: sub.billing_interval,
          next_payment_amount: expectedPaymentAmount(sub),
          next_billing_datetime: sub.next_billing_datetime || null,
          price_effective_datetime: sub.price_effective_datetime || null,
          scheduled_tier: sub.scheduled_tier || null,
          verified_revenue: Math.round((paid - refunded) * 100) / 100,
          outstanding_upgrade_fee: sub.pending_upgrade_fee || 0,
        },
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function loadPlanSettingsSafe(base44) {
  try {
    const res = await base44.asServiceRole.entities.PartnerPlanSettings.filter({}, { limit: 1 });
    const items = res.items || res;
    return items[0] || {};
  } catch {
    return {};
  }
}