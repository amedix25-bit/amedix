import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Records one advertisement analytics event (impression, detail view,
// contact click, direction click) for the Patient Portal.
//
// Impression definition: an advertisement card rendered in its Patient Portal
// tab counts as at most ONE impression per advertisement, per signed-in app
// user, per calendar day. The same once-per-ad-per-user-per-day rule dedupes
// detail views, contact clicks and direction clicks.
//
// Privacy: events are stored with a ONE-WAY deduplication hash only — no
// patient identities, health information, diagnoses, prescriptions or results
// ever reach advertising analytics, and no event can be linked back to a
// person. Events are recorded only for PUBLISHED advertisements, so paused,
// rejected or expired ads accrue nothing.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const eventType = String(body.event_type || '');
    if (!['impression', 'detail_view', 'contact_click', 'direction_click'].includes(eventType)) {
      return Response.json({ error: 'Unknown event type' }, { status: 400 });
    }
    const adId = String(body.ad_id || '');
    if (!adId) return Response.json({ error: 'ad_id is required' }, { status: 400 });

    const s = base44.asServiceRole;
    const adsEntity = s.entities.PartnerAdvertisement;
    const ad = await adsEntity.get(adId).catch(() => null);
    if (!ad || ad.status !== 'published') {
      return Response.json({ recorded: false, reason: 'ad_not_published' });
    }

    const eventDay = new Date().toISOString().slice(0, 10);
    // One-way SHA-256 hash: the same viewer/event/ad/day collapses to one
    // event, and the stored key cannot be reversed into an identity.
    const dedupeSource = `${adId}|${eventType}|${eventDay}|${user.id}`;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dedupeSource));
    const dedupeKey = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');

    const eventsEntity = s.entities.PartnerAdEvent;
    const existing = await eventsEntity.filter({ dedupe_key: dedupeKey }, { limit: 1 });
    if ((existing.items || existing).length > 0) {
      return Response.json({ recorded: false, duplicate: true });
    }

    const event = await eventsEntity.create({
      event_id: `PAE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      ad_id: ad.id,
      subscription_id: ad.subscription_id || '',
      partner_type: ad.partner_type,
      partner_id: ad.partner_id,
      partner_user_id: ad.partner_user_id,
      event_type: eventType,
      event_day: eventDay,
      dedupe_key: dedupeKey,
      created_datetime: new Date().toISOString(),
    });
    return Response.json({ recorded: true, event_id: event.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}