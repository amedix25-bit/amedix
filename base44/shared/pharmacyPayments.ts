// Payment ledger helpers for pharmacy dispensing transactions. The financial
// record is kept strictly separate from the dispensing record: a medication
// may be dispensed while payment remains pending, and payment may be recorded
// before the dispensing completes. Card, transfer, insurance and other
// non-cash payments are never marked confirmed until a pharmacist verifies
// them.

export const PAYMENT_METHODS = [
  'cash', 'card', 'bank_transfer', 'insurance', 'mobile_wallet', 'other',
];

// Methods that require explicit verification before they count as confirmed.
export const VERIFICATION_METHODS = ['card', 'bank_transfer', 'insurance', 'mobile_wallet', 'other'];

export function normalizePaymentMethod(value) {
  const v = String(value || '').toLowerCase().trim();
  return PAYMENT_METHODS.includes(v) ? v : '';
}

export function verificationForMethod(method) {
  return VERIFICATION_METHODS.includes(method) ? 'pending_verification' : 'confirmed';
}

export function generatePaymentTxRef() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  let rand = '';
  for (let i = 0; i < 4; i++) rand += alphabet[bytes[i] % alphabet.length];
  return `PT-${date}-${rand}`;
}

export function newEntryId() {
  return `pe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Recomputes the money fields from the transaction's payment history:
// payments and adjustments add up, refunds subtract. Never trusts stored
// totals — they are always derived from the entries.
export function computeTotals(tx) {
  const entries = tx.payments || [];
  let paid = 0;
  let refunded = 0;
  let adjusted = 0;
  for (const e of entries) {
    const amt = Number(e.amount) || 0;
    if (e.entry_type === 'payment') paid += amt;
    else if (e.entry_type === 'refund') refunded += amt;
    else if (e.entry_type === 'adjustment') adjusted += amt;
  }
  const amountDue = Number(tx.amount_due) || 0;
  const amountPaid = Math.max(0, paid + adjusted - refunded);
  const outstanding = Math.max(0, amountDue - amountPaid);
  let paymentStatus = 'unpaid';
  if (refunded > 0 && amountPaid === 0) paymentStatus = 'refunded';
  else if (outstanding === 0 && amountDue > 0) paymentStatus = 'paid';
  else if (amountPaid > 0) paymentStatus = 'partial';
  return {
    amount_paid: amountPaid,
    outstanding_balance: outstanding,
    payment_status: paymentStatus,
  };
}

// Creates the payment ledger entry for a dispensing transaction where a
// payment was captured at the counter. A failure never breaks the dispensing
// record — the payment stays visible on the dispensing event either way.
export async function recordDispensingPayment(base44, { pharmacy, prescription, pharmacistName, event, paymentAmount, paymentMethod }) {
  try {
    const amount = Number(paymentAmount) || 0;
    const method = normalizePaymentMethod(paymentMethod);
    if (amount <= 0 || !method) return null;
    const now = event?.datetime || new Date().toISOString();
    return await base44.entities.PaymentTransaction.create({
      transaction_id: generatePaymentTxRef(),
      pharmacy_id: pharmacy.id,
      pharmacy_user_id: pharmacy.user_id,
      pharmacy_name: pharmacy.pharmacy_name || '',
      prescription_id: prescription.id,
      prescription_ref: prescription.prescription_id || '',
      patient_id: prescription.patient_id || '',
      patient_cin: prescription.patient_cin || '',
      patient_name: prescription.patient_name || '',
      pharmacist_name: pharmacistName || '',
      dispensing_datetime: now,
      items: [{
        medication_name: prescription.medication_name || '',
        strength: prescription.strength || '',
        quantity: event?.quantity || '',
      }],
      amount_due: amount,
      amount_paid: amount,
      outstanding_balance: 0,
      payment_status: 'paid',
      payments: [{
        entry_id: newEntryId(),
        entry_type: 'payment',
        datetime: now,
        amount,
        method,
        verification: verificationForMethod(method),
        pharmacist_name: pharmacistName || '',
        note: 'Recorded at dispensing',
      }],
      created_datetime: now,
      updated_datetime: now,
    });
  } catch (e) {
    console.error('Payment ledger entry failed:', e);
    return null;
  }
}