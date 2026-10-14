import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const listed = await sr.entities.PharmacyInventory.filter({ medication_name: 'DebugTest' }, { limit: 10 });
    const byId = await sr.entities.PharmacyInventory.get('6acfa330d3be20091e033073').catch((e) => ({ err: e.message }));
    const listedUser = await sr.entities.PharmacyInventory.filter({ pharmacy_user_id: '6a9ea250809f9bb40f0d02c1' }, { limit: 10 });
    return Response.json({
      byNameCount: (listed.items || listed).length,
      byId: byId.err ? { err: byId.err } : { id: byId.id, name: byId.medication_name },
      byUserCount: (listedUser.items || listedUser).length,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}