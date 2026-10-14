import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findInventoryItem, parseQty } from "../../shared/pharmacyPrescription.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const profiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: user.id });
    if (profiles.length === 0) return Response.json({ error: 'no profile', user: user.id }, { status: 403 });
    const pharmacy = profiles[0];
    const prescription = await base44.asServiceRole.entities.Prescription.get('6acfa2ab3db74c1329512b7c');
    const item = await findInventoryItem(base44, pharmacy, prescription);
    const page = await base44.asServiceRole.entities.PharmacyInventory.filter({ pharmacy_id: pharmacy.id }, { limit: 50 });
    return Response.json({
      user: user.id,
      pharmacy: { id: pharmacy.id, name: pharmacy.pharmacy_name },
      med: prescription.medication_name,
      strength: prescription.strength,
      itemFound: item ? { id: item.id, qty: item.quantity_in_stock } : null,
      rawInventoryCount: (page.items || page).length,
    });
  } catch (e) {
    return Response.json({ error: e.message, stack: String(e.stack).split('\n').slice(0, 5) }, { status: 500 });
  }
}