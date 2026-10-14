import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  verifyPharmacistSession, touchPharmacistActivity, pharmacistUnauthorized,
} from "../../shared/pharmacyStaffAuth.ts";

// Inventory management for an individual pharmacist's workspace. Every action
// is verified against the pharmacist's session and scoped to the pharmacy they
// belong to — a pharmacist can never touch another pharmacy's stock.
//   list    → the pharmacy's inventory
//   create  → add a medication (name, batch, expiry, quantity validated)
//   set_stock → set the stock level of an item
//   remove  → delete an item
//   dispose → mark a quarantined batch as disposed
const DOSAGE_FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'other'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const pharmacist = await verifyPharmacistSession(base44, body?.pharmacist_id, body?.pharmacist_session_token);
    if (!pharmacist) return pharmacistUnauthorized();
    await touchPharmacistActivity(base44, pharmacist.id);

    const pharmacyProfiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ id: pharmacist.pharmacy_id });
    if (pharmacyProfiles.length === 0) {
      return Response.json({ error: 'Pharmacy profile not found.' }, { status: 403 });
    }
    const pharmacy = pharmacyProfiles[0];
    const action = String(body?.action || 'list');
    const today = new Date().toISOString().slice(0, 10);

    if (action === 'list') {
      const page = await base44.asServiceRole.entities.PharmacyInventory.filter(
        { pharmacy_id: pharmacy.id },
        { sort: '-created_date', limit: 500 }
      );
      return Response.json({ items: page.items || page });
    }

    if (action === 'create') {
      const medication_name = String(body?.medication_name || '').trim();
      const qty = Number(body?.quantity_in_stock);
      if (!medication_name) return Response.json({ error: 'Medication name is required.' }, { status: 400 });
      if (!Number.isFinite(qty) || qty < 0) return Response.json({ error: 'Enter a valid stock quantity.' }, { status: 400 });
      const expiry = String(body?.expiry_date || '').trim();
      if (expiry && expiry < today) {
        return Response.json({ error: 'The expiry date is in the past — expired stock cannot be added.' }, { status: 400 });
      }
      const item = await base44.asServiceRole.entities.PharmacyInventory.create({
        pharmacy_id: pharmacy.id,
        pharmacy_user_id: pharmacist.pharmacy_user_id,
        medication_name,
        active_ingredient: String(body?.active_ingredient || '').trim(),
        strength: String(body?.strength || '').trim(),
        dosage_form: DOSAGE_FORMS.includes(body?.dosage_form) ? body.dosage_form : 'other',
        batch_number: String(body?.batch_number || '').trim(),
        expiry_date: expiry,
        quantity_in_stock: qty,
        updated_datetime: new Date().toISOString(),
      });
      return Response.json({ item });
    }

    // The remaining actions operate on one item — it must belong to this pharmacy.
    let item = null;
    try {
      const recs = await base44.asServiceRole.entities.PharmacyInventory.filter({ id: String(body?.inventory_id || '') });
      item = recs.length ? recs[0] : null;
    } catch (e) { item = null; }
    if (!item || item.pharmacy_id !== pharmacy.id) {
      return Response.json({ error: 'Inventory item not found.' }, { status: 404 });
    }

    if (action === 'set_stock') {
      if (item.is_quarantined) return Response.json({ error: 'Quarantined stock cannot be adjusted.' }, { status: 400 });
      const qty = Number(body?.quantity_in_stock);
      if (!Number.isFinite(qty) || qty < 0) return Response.json({ error: 'Enter a valid stock quantity.' }, { status: 400 });
      await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
        quantity_in_stock: qty,
        updated_datetime: new Date().toISOString(),
      });
      return Response.json({ ok: true });
    }

    if (action === 'remove') {
      await base44.asServiceRole.entities.PharmacyInventory.delete(item.id);
      return Response.json({ ok: true });
    }

    if (action === 'dispose') {
      if (!item.is_quarantined) return Response.json({ error: 'Only quarantined stock can be disposed.' }, { status: 400 });
      if (item.quarantine_action === 'disposed') {
        return Response.json({ error: 'This stock was already marked as disposed.' }, { status: 400 });
      }
      await base44.asServiceRole.entities.PharmacyInventory.update(item.id, { quarantine_action: 'disposed' });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}