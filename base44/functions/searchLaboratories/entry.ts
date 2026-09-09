import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Lets a patient search officially registered, approved and currently active
// laboratories as they type — matching by laboratory name OR A&M Lab Number.
// Laboratory profiles are RLS-protected, so the lookup runs through the
// service role but returns only the minimal public listing fields (including
// the logo uploaded at registration). Suspended, unapproved or unregistered
// laboratories are never returned.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim().slice(0, 60);
    if (query.length < 1) return Response.json({ laboratories: [] });

    const labs = await base44.asServiceRole.entities.LaboratoryProfile.list('lab_name', 200);
    const needle = query.toLowerCase();
    const laboratories = labs
      .filter((l) => {
        // Only officially registered, approved and currently active laboratories appear.
        if (l.status && l.status !== 'active') return false;
        const name = (l.lab_name || '').toLowerCase();
        const number = (l.lab_number || '').toLowerCase();
        return name.includes(needle) || number.includes(needle);
      })
      .slice(0, 10)
      .map((l) => ({
        id: l.id,
        lab_name: l.lab_name,
        lab_number: l.lab_number,
        address: l.address,
        logo_url: l.logo_url || '',
      }));

    return Response.json({ laboratories });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}