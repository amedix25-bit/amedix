import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  verifyPharmacistSession, touchPharmacistActivity, pharmacistUnauthorized,
} from "../../shared/pharmacyStaffAuth.ts";
import { recordStockMovement } from "../../shared/inventoryMovements.ts";

// Inventory management for an individual pharmacist's workspace. Every action
// is verified against the pharmacist's session and scoped to the pharmacy they
// belong to — a pharmacist can never touch another pharmacy's stock. Every
// stock movement (receipt, adjustment, removal, disposal) is recorded in the
// inventory movement history with its reason, timestamp and responsible user.
//   list      → the pharmacy's inventory
//   movements → the movement history (optionally for one inventory item)
//   create    → add a medication (name, batch, expiry, quantity validated)
//   set_stock → set the stock level of an item (reason required, recorded)
//   remove    → delete an item (reason required, recorded)
//   dispose   → mark a quarantined batch as disposed
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

    const actor = {
      pharmacy_id: pharmacy.id,
      pharmacy_user_id: pharmacy.user_id,
      performed_by_user_id: pharmacist.pharmacy_user_id,
      performed_by_name: pharmacist.full_name,
      performed_by_role: 'pharmacist',
    };

    if (action === 'list') {
      const page = await base44.asServiceRole.entities.PharmacyInventory.filter(
        { pharmacy_id: pharmacy.id },
        { sort: '-created_date', limit: 500 }
      );
      return Response.json({ items: page.items || page });
    }

    if (action === 'movements') {
      const query = body?.inventory_id
        ? { pharmacy_id: pharmacy.id, inventory_id: String(body.inventory_id) }
        : { pharmacy_id: pharmacy.id };
      const page = await base44.asServiceRole.entities.PharmacyInventoryMovement.filter(
        query, { sort: '-created_date', limit: 100 }
      );
      return Response.json({ movements: page.items || page });
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
        supplier: String(body?.supplier || '').trim(),
        quantity_in_stock: qty,
        updated_datetime: new Date().toISOString(),
      });
      await recordStockMovement(base44, {
        ...actor,
        inventory_id: item.id,
        medication_name: item.medication_name,
        strength: item.strength || '',
        batch_number: item.batch_number || '',
        expiry_date: item.expiry_date || '',
        movement_type: 'receipt',
        quantity_before: 0,
        quantity_change: qty,
        quantity_after: qty,
        reason: `Stock received${item.supplier ? ` from ${item.supplier}` : ''}${item.batch_number ? ` (batch ${item.batch_number})` : ''}`,
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

    const itemContext = {
      inventory_id: item.id,
      medication_name: item.medication_name,
      strength: item.strength || '',
      batch_number: item.batch_number || '',
      expiry_date: item.expiry_date || '',
    };

    if (action === 'set_stock') {
      if (item.is_quarantined) return Response.json({ error: 'Quarantined stock cannot be adjusted. Dispose of it instead.' }, { status: 400 });
      const qty = Number(body?.quantity_in_stock);
      if (!Number.isFinite(qty) || qty < 0) return Response.json({ error: 'Enter a valid stock quantity.' }, { status: 400 });
      const reason = String(body?.reason || '').trim();
      if (!reason) return Response.json({ error: 'Enter a reason for the stock adjustment — it is kept in the movement history.' }, { status: 400 });
      await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
        quantity_in_stock: qty,
        updated_datetime: new Date().toISOString(),
      });
      await recordStockMovement(base44, {
        ...actor,
        ...itemContext,
        movement_type: 'adjustment',
        quantity_before: item.quantity_in_stock ?? null,
        quantity_change: qty - (item.quantity_in_stock || 0),
        quantity_after: qty,
        reason,
      });
      return Response.json({ ok: true });
    }

    if (action === 'remove') {
      const reason = String(body?.reason || '').trim();
      if (!reason) return Response.json({ error: 'Enter a reason for removing this medication — it is kept in the movement history.' }, { status: 400 });
      await base44.asServiceRole.entities.PharmacyInventory.delete(item.id);
      await recordStockMovement(base44, {
        ...actor,
        ...itemContext,
        movement_type: 'removal',
        quantity_before: item.quantity_in_stock ?? null,
        quantity_change: -(item.quantity_in_stock || 0),
        quantity_after: 0,
        reason,
      });
      return Response.json({ ok: true });
    }

    if (action === 'dispose') {
      if (!item.is_quarantined) return Response.json({ error: 'Only quarantined stock can be disposed.' }, { status: 400 });
      if (item.quarantine_action === 'disposed') {
        return Response.json({ error: 'This stock was already marked as disposed.' }, { status: 400 });
      }
      await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
        quantity_in_stock: 0,
        quarantine_action: 'disposed',
        updated_datetime: new Date().toISOString(),
      });
      await recordStockMovement(base44, {
        ...actor,
        ...itemContext,
        movement_type: 'disposal',
        quantity_before: item.quantity_in_stock ?? null,
        quantity_change: -(item.quantity_in_stock || 0),
        quantity_after: 0,
        reason: item.quarantine_reason || 'Quarantined stock disposed',
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}