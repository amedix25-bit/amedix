import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isItemDispensable } from "../../shared/pharmacyPrescription.ts";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Automatic medication availability check across affiliated pharmacies.
// Given a medication name (and optionally strength / active ingredient), it
// searches the inventory of every ACTIVE pharmacy and returns the pharmacies
// that currently hold stock, with their stock level, location and the latest
// inventory update. Doctors see this right after issuing a prescription, and
// patients use it to pick a pharmacy to authorize.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const medicationName = String(body?.medication_name || '').trim();
    const activeIngredient = String(body?.active_ingredient || '').trim();
    const strength = String(body?.strength || '').trim();
    if (!medicationName && !activeIngredient) {
      return Response.json({ error: 'A medication name or active ingredient is required.' }, { status: 400 });
    }

    // Inventory is readable by authenticated users, but matching across all
    // pharmacies and joining the active profiles runs through the service role
    // so the caller only ever receives the minimal listing fields.
    const results = new Map();
    const addMatches = (items) => {
      for (const item of items) {
        if (!item.quantity_in_stock || item.quantity_in_stock <= 0) continue;
        // Expired, quarantined or recalled stock is never offered to doctors
        // or patients.
        if (!isItemDispensable(item)) continue;
        const prev = results.get(item.pharmacy_id);
        if (!prev || item.quantity_in_stock > prev.quantity_in_stock) {
          results.set(item.pharmacy_id, item);
        }
      }
    };

    try {
      if (medicationName) {
        const byName = await base44.asServiceRole.entities.PharmacyInventory.filter(
          { medication_name: { $regex: `^${escapeRegex(medicationName)}$`, $options: 'i' } },
          { limit: 200 }
        );
        addMatches(byName.items || byName);
      }
      if (activeIngredient && activeIngredient.toLowerCase() !== medicationName.toLowerCase()) {
        const byIngredient = await base44.asServiceRole.entities.PharmacyInventory.filter(
          { active_ingredient: { $regex: `^${escapeRegex(activeIngredient)}$`, $options: 'i' } },
          { limit: 200 }
        );
        addMatches(byIngredient.items || byIngredient);
      }
    } catch (e) {
      console.log('AVAILABILITY-ERROR:', e && e.message);
      return Response.json({ error: 'Availability check failed. Please try again.' }, { status: 500 });
    }

    const matches = [];
    for (const [, item] of results) {
      // When a strength is prescribed, only stock of the same strength counts.
      if (strength && item.strength && String(item.strength).toLowerCase() !== strength.toLowerCase()) continue;
      matches.push(item);
    }
    if (matches.length === 0) {
      return Response.json({ pharmacies: [] });
    }

    const pharmacies = [];
    for (const item of matches.slice(0, 50)) {
      let profile = null;
      try {
        const profiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ id: item.pharmacy_id }, { limit: 1 });
        profile = (profiles.items || profiles)[0] || null;
      } catch (e) {
        profile = null;
      }
      if (!profile || profile.status !== 'active') continue;
      pharmacies.push({
        pharmacy_id: profile.id,
        pharmacy_name: profile.pharmacy_name,
        pharmacy_number: profile.pharmacy_number || '',
        address: profile.address || '',
        phone: profile.phone || '',
        logo_url: profile.logo_url || '',
        medication_name: item.medication_name,
        strength: item.strength || '',
        dosage_form: item.dosage_form || '',
        quantity_in_stock: item.quantity_in_stock,
        updated_datetime: item.updated_datetime || '',
      });
    }

    pharmacies.sort((a, b) => b.quantity_in_stock - a.quantity_in_stock);
    return Response.json({ pharmacies });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}