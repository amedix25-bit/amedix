import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const invOpts = await sr.entities.PharmacyInventory.filter({ pharmacy_id: '6acfa2ac2f0c28928ae8f7ec' }, { limit: 50 });
    const profOpts = await sr.entities.PharmacyProfile.filter({ user_id: '6a9ea250809f9bb40f0d02c1' }, { limit: 50 });
    return Response.json({
      inv_opts: (invOpts.items || invOpts).length,
      prof_opts: (profOpts.items || profOpts).length,
    });
  } catch (e) {
    return Response.json({ error: e.message, stack: String(e.stack).split('\n').slice(0, 5) }, { status: 500 });
  }
}