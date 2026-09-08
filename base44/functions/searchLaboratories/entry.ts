import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Lets a patient search registered laboratories by name to select one for a lab
// request. Laboratory profiles are RLS-protected, so the lookup runs through
// the service role but returns only the minimal public listing fields.
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
      .filter((l) => (l.lab_name || '').toLowerCase().includes(needle))
      .slice(0, 10)
      .map((l) => ({
        id: l.id,
        lab_name: l.lab_name,
        lab_number: l.lab_number,
        address: l.address,
      }));

    return Response.json({ laboratories });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}