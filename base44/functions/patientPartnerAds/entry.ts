import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { loadPlanSettings, effectiveStatus } from '../../shared/partnerBilling.ts';

// Serves approved partner advertisements to the Patient Portal. A section is
// passed in ('pharmacy' or 'laboratory') and ONLY subscriptions of that type
// are returned — pharmacy ads appear exclusively in the patient Prescriptions
// tab and laboratory ads exclusively in the Labs tab. Overdue subscriptions
// past their grace period are excluded, and no pricing or billing data is ever
// returned here.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const section = body.section === 'laboratory' ? 'laboratory' : 'pharmacy';

    const settings = await loadPlanSettings(base44);
    const subs = await base44.asServiceRole.entities.PartnerSubscription.filter({
      partner_type: section,
      status: 'active',
    });

    const now = new Date();
    const ads = (subs.items || subs)
      .map((s) => ({ sub: s, effective: effectiveStatus(s, settings, now) }))
      .filter((x) => x.effective === 'active' || x.effective === 'overdue')
      .map((x) => ({
        partner_id: x.sub.partner_id,
        partner_name: x.sub.partner_name,
        partner_number: x.sub.partner_number,
        partner_logo_url: x.sub.partner_logo_url || '',
        partner_address: x.sub.partner_address || '',
        partner_phone: x.sub.partner_phone || '',
        partner_whatsapp: x.sub.partner_whatsapp || '',
        tier: x.sub.tier,
        ad_description: x.sub.ad_description || '',
        ad_cover_url: x.sub.ad_cover_url || '',
        ad_services: x.sub.ad_services || [],
        ad_contact_phone: x.sub.ad_contact_phone || '',
        ad_hours: x.sub.ad_hours || '',
      }))
      // Premium placements first; nothing else influences ordering.
      .sort((a, b) => (a.tier === 'premium' ? -1 : 1) - (b.tier === 'premium' ? -1 : 1));

    return Response.json({ ads });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}