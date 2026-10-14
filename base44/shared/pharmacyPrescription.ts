// Shared pharmacy-prescription helpers: quantity parsing, dispensing totals,
// inventory lookup and reservation stock return — used by the pharmacy
// dispensing, rejection and doctor cancellation functions.

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parses a quantity string like "21 tablets" into the numeric units (21).
export function parseQty(value) {
  const n = parseFloat(String(value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function unitWord(qtyStr) {
  const m = String(qtyStr || '').replace(/[^0-9.]/g, ' ').trim().split(/\s+/)[1];
  return m || 'unit(s)';
}

// Total quantity already dispensed across previous fill events. Legacy
// prescriptions without events count as fully dispensed once they carry a
// dispensed status and a numeric authorized quantity.
export function totalDispensedOf(prescription) {
  const authorizedQty = parseQty(prescription.quantity);
  const priorEvents = prescription.dispensing_events || [];
  const fromEvents = priorEvents.reduce(
    (sum, ev) => sum + (parseQty(ev.quantity) || Number(ev.quantity_number) || 0),
    0
  );
  if (priorEvents.length === 0 && prescription.status === 'dispensed' && (prescription.dispensed_datetime || prescription.dispensed_quantity)) {
    return authorizedQty > 0 ? authorizedQty : 1;
  }
  return fromEvents;
}

export function remainingOf(prescription) {
  const authorizedQty = parseQty(prescription.quantity);
  if (authorizedQty <= 0) return 0;
  return Math.max(0, authorizedQty - totalDispensedOf(prescription));
}

// Finds the pharmacy's inventory item matching the prescribed medication and
// strength (case-insensitive name match, strength compared when both set).
export async function findInventoryItem(base44, pharmacy, prescription) {
  const page = await base44.asServiceRole.entities.PharmacyInventory.filter(
    {
      pharmacy_id: pharmacy.id,
      medication_name: { $regex: `^${escapeRegex(prescription.medication_name)}$`, $options: 'i' },
    },
    { limit: 50 }
  );
  const items = (page.items || page).filter(
    (i) => !prescription.strength || !i.strength || String(i.strength).toLowerCase() === String(prescription.strength).toLowerCase()
  );
  return items[0] || null;
}

// Returns the stock still held by a reservation (the full authorized quantity
// minus what partial fills already dispensed) back to the pharmacy inventory.
export async function restoreReservedStock(base44, pharmacy, prescription) {
  if (prescription.status !== 'reserved') return;
  const heldQty = remainingOf(prescription);
  if (heldQty <= 0) return;
  const item = await findInventoryItem(base44, pharmacy, prescription);
  if (item) {
    await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
      quantity_in_stock: item.quantity_in_stock + heldQty,
      updated_datetime: new Date().toISOString(),
    });
  }
}