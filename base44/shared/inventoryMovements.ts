// Records one inventory movement. Every stock change at a pharmacy — receipts,
// adjustments, dispensing deductions, reservations, returns, quarantines,
// disposals and removals — keeps a permanent history row with the before/after
// quantities, the reason, the timestamp and the responsible user. Movements
// are never edited or deleted, so stock changes can always be investigated and
// reconciled. Recording never blocks the stock operation itself.
export async function recordStockMovement(base44, m) {
  try {
    await base44.asServiceRole.entities.PharmacyInventoryMovement.create({
      pharmacy_id: m.pharmacy_id || '',
      pharmacy_user_id: m.pharmacy_user_id || '',
      inventory_id: m.inventory_id || '',
      medication_name: m.medication_name || '',
      strength: m.strength || '',
      batch_number: m.batch_number || '',
      expiry_date: m.expiry_date || '',
      movement_type: m.movement_type,
      quantity_before: m.quantity_before ?? null,
      quantity_change: m.quantity_change ?? null,
      quantity_after: m.quantity_after ?? null,
      reason: m.reason || '',
      reference: m.reference || '',
      performed_by_user_id: m.performed_by_user_id || '',
      performed_by_name: m.performed_by_name || '',
      performed_by_role: m.performed_by_role || '',
      datetime: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to record inventory movement:', err);
  }
}