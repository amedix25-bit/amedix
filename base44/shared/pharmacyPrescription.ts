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

// Parses a strength like "20 mg", "500mg" or "500" into a comparable
// { value, unit } pair — the unit is empty when only a number was recorded.
export function parseStrength(value) {
  const m = String(value || '').toLowerCase().trim().match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ug|g|iu|ml|%|units?)?/);
  if (!m) return null;
  return { value: parseFloat(m[1]), unit: (m[2] || '').replace(/units?$/, 'unit') };
}

// Strengths match when the numbers are equal and the units are compatible —
// a unit recorded on one side only ("500" vs "500 mg") still matches, since
// pharmacies and doctors record the unit inconsistently.
export function strengthMatches(a, b) {
  const A = parseStrength(a);
  const B = parseStrength(b);
  if (!A && !B) return true;
  if (!A || !B) return false;
  if (A.value !== B.value) return false;
  if (!A.unit || !B.unit) return true;
  return A.unit === B.unit;
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

// Today's date in Africa/Tripoli (the app's clinical timezone).
export function todayStr() {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Tripoli', year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date());
}

// An inventory item (batch) is dispensable when it is not quarantined and not
// past its expiry date. Items recorded before batch tracking have no expiry
// date and remain dispensable.
export function isItemDispensable(item) {
  if (!item || item.is_quarantined) return false;
  if (item.expiry_date && item.expiry_date < todayStr()) return false;
  return true;
}

// Finds the pharmacy's inventory items matching the prescribed medication and
// strength (case-insensitive name match, strength compared when both set),
// sorted first-expiry-first-out so dispensing always consumes the batch that
// expires soonest.
export async function findInventoryItems(base44, pharmacy, prescription) {
  const page = await base44.asServiceRole.entities.PharmacyInventory.filter(
    {
      pharmacy_id: pharmacy.id,
      medication_name: { $regex: `^${escapeRegex(prescription.medication_name)}$`, $options: 'i' },
    },
    { limit: 50 }
  );
  const items = (page.items || page).filter(
    (i) => !prescription.strength || !i.strength || strengthMatches(prescription.strength, i.strength)
  );
  items.sort((a, b) => {
    if (a.expiry_date && b.expiry_date) return a.expiry_date.localeCompare(b.expiry_date);
    if (a.expiry_date) return -1;
    if (b.expiry_date) return 1;
    return 0;
  });
  return items;
}

// Finds the pharmacy's inventory item matching the prescribed medication and
// strength (case-insensitive name match, strength compared when both set).
export async function findInventoryItem(base44, pharmacy, prescription) {
  const items = await findInventoryItems(base44, pharmacy, prescription);
  return items[0] || null;
}

// Returns the stock still held by a reservation (the full authorized quantity
// minus what partial fills already dispensed) back to the pharmacy inventory.
// The stock goes back to the exact batch it was reserved from.
export async function restoreReservedStock(base44, pharmacy, prescription) {
  if (prescription.status !== 'reserved') return;
  const heldQty = remainingOf(prescription);
  if (heldQty <= 0) return;
  let item = null;
  if (prescription.reserved_inventory_id) {
    try {
      item = await base44.asServiceRole.entities.PharmacyInventory.get(prescription.reserved_inventory_id);
    } catch (e) { item = null; }
  }
  if (!item) item = await findInventoryItem(base44, pharmacy, prescription);
  if (item) {
    await base44.asServiceRole.entities.PharmacyInventory.update(item.id, {
      quantity_in_stock: item.quantity_in_stock + heldQty,
      updated_datetime: new Date().toISOString(),
    });
  }
}