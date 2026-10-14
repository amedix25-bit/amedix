import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  verifyPharmacistSession, touchPharmacistActivity, pharmacistUnauthorized,
} from "../../shared/pharmacyStaffAuth.ts";
import {
  normalizePaymentMethod, verificationForMethod, generatePaymentTxRef,
  computeTotals, newEntryId,
} from "../../shared/pharmacyPayments.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Payment management for the pharmacist workspace Payments section:
//   list    → the pharmacy's payment transactions (the financial ledger)
//   record  → record a payment for a prescription (idempotent, duplicates blocked)
//   confirm → verify a card / transfer / insurance payment
//   refund  → refund part or all of a payment (reason required)
//   adjust  → authorized financial adjustment (reason required)
// Payment status is kept strictly separate from dispensing status: payment may
// be recorded before dispensing, and dispensing may happen with the payment
// still pending. Every action is session-verified and scoped to the
// pharmacist's own pharmacy, and recorded in the clinical audit log.
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
    const now = new Date().toISOString();

    const audit = (act, label, patientName = '', patientCin = '') => logClinicalAudit(base44.asServiceRole, {
      actor_user_id: pharmacist.pharmacy_user_id,
      actor_name: pharmacist.full_name,
      actor_role: 'pharmacy',
      action: act,
      action_label: label,
      patient_name: patientName,
      patient_cin: patientCin,
    });

    if (action === 'list') {
      const page = await base44.asServiceRole.entities.PaymentTransaction.filter(
        { pharmacy_id: pharmacy.id },
        { sort: '-created_date', limit: 500 }
      );
      return Response.json({ transactions: page.items || page });
    }

    // Loads one transaction, verifying it belongs to this pharmacy.
    const loadTx = async (txId) => {
      if (!txId) return null;
      try {
        const tx = await base44.asServiceRole.entities.PaymentTransaction.get(String(txId));
        if (!tx || tx.pharmacy_id !== pharmacy.id) return null;
        return tx;
      } catch (e) { return null; }
    };

    // Saves new payment entries and recomputes the totals from the history.
    const saveTx = async (tx, payments) => {
      const totals = computeTotals({ ...tx, payments });
      await base44.asServiceRole.entities.PaymentTransaction.update(tx.id, {
        payments,
        amount_paid: totals.amount_paid,
        outstanding_balance: totals.outstanding_balance,
        payment_status: totals.payment_status,
        updated_datetime: now,
      });
      return { ...tx, payments, ...totals, updated_datetime: now };
    };

    // ---- Record a payment --------------------------------------------------
    if (action === 'record') {
      const ref = String(body?.prescription_ref || '').trim();
      const amount = Number(body?.amount);
      const method = normalizePaymentMethod(body?.method);
      const idemKey = String(body?.idempotency_key || '').trim();
      const dispensingDatetime = String(body?.dispensing_datetime || '').trim();
      if (!ref) return Response.json({ error: 'A prescription reference is required.' }, { status: 400 });
      if (!Number.isFinite(amount) || amount <= 0) {
        return Response.json({ error: 'A payment amount greater than zero is required.' }, { status: 400 });
      }
      if (!method) return Response.json({ error: 'Choose a valid payment method.' }, { status: 400 });
      if (!idemKey) return Response.json({ error: 'Missing payment reference.' }, { status: 400 });

      const rxPage = await base44.asServiceRole.entities.Prescription.filter(
        { prescription_id: ref, authorized_pharmacy_id: pharmacy.id },
        { limit: 1 }
      );
      const prescription = (rxPage.items || rxPage)[0];
      if (!prescription) {
        return Response.json({ error: 'Prescription not found or not authorized to your pharmacy.' }, { status: 404 });
      }

      let event = null;
      if (dispensingDatetime) {
        event = (prescription.dispensing_events || []).find((ev) => ev.datetime === dispensingDatetime) || null;
        if (!event) {
          return Response.json({ error: 'No dispensing transaction found at that date and time.' }, { status: 400 });
        }
      }

      // Duplicate prevention: the same idempotency key, or an identical
      // payment recorded against the same dispensing transaction in the last
      // minute, returns the existing record instead of creating a duplicate.
      const txPage = await base44.asServiceRole.entities.PaymentTransaction.filter(
        { pharmacy_id: pharmacy.id, prescription_ref: ref },
        { limit: 200 }
      );
      for (const tx of (txPage.items || txPage)) {
        for (const e of tx.payments || []) {
          if (e.idempotency_key && e.idempotency_key === idemKey) {
            return Response.json({ transaction: tx, duplicate: true });
          }
          if (
            e.entry_type === 'payment' && dispensingDatetime &&
            tx.dispensing_datetime === dispensingDatetime &&
            Math.abs((Number(e.amount) || 0) - amount) < 0.001 &&
            e.method === method &&
            new Date(now).getTime() - new Date(e.datetime).getTime() < 60000
          ) {
            return Response.json({ transaction: tx, duplicate: true });
          }
        }
      }

      const amountDue = Number.isFinite(Number(body?.amount_due)) && Number(body?.amount_due) > 0
        ? Number(body.amount_due)
        : (Number(event?.payment_amount) || amount);
      const entry = {
        entry_id: newEntryId(),
        entry_type: 'payment',
        datetime: now,
        amount,
        method,
        verification: verificationForMethod(method),
        pharmacist_name: pharmacist.full_name,
        note: String(body?.note || '').trim() ||
          (dispensingDatetime ? 'Payment recorded for a dispensed fill' : 'Payment recorded before dispensing'),
        idempotency_key: idemKey,
      };
      const created = await base44.asServiceRole.entities.PaymentTransaction.create({
        transaction_id: generatePaymentTxRef(),
        pharmacy_id: pharmacy.id,
        pharmacy_user_id: pharmacy.user_id,
        pharmacy_name: pharmacy.pharmacy_name || '',
        prescription_id: prescription.id,
        prescription_ref: ref,
        patient_id: prescription.patient_id || '',
        patient_cin: prescription.patient_cin || '',
        patient_name: prescription.patient_name || '',
        pharmacist_name: pharmacist.full_name,
        dispensing_datetime: dispensingDatetime,
        items: [{
          medication_name: prescription.medication_name || '',
          strength: prescription.strength || '',
          quantity: event?.quantity || '',
        }],
        amount_due: amountDue,
        amount_paid: amount,
        outstanding_balance: Math.max(0, amountDue - amount),
        payment_status: amount >= amountDue ? 'paid' : 'partial',
        payments: [entry],
        created_datetime: now,
        updated_datetime: now,
      });
      await audit('payment_recorded', `Recorded payment for ${ref} (${amount}, ${method})`, prescription.patient_name || '', prescription.patient_cin || '');
      return Response.json({ transaction: created });
    }

    // ---- Verify a pending non-cash payment ----------------------------------
    if (action === 'confirm') {
      const tx = await loadTx(body?.transaction_id);
      if (!tx) return Response.json({ error: 'Payment transaction not found.' }, { status: 404 });
      const entryId = String(body?.entry_id || '');
      const target = (tx.payments || []).find((e) => e.entry_id === entryId);
      if (!target || target.entry_type !== 'payment') {
        return Response.json({ error: 'Payment entry not found.' }, { status: 404 });
      }
      if (target.verification === 'confirmed') {
        return Response.json({ transaction: tx, duplicate: true });
      }
      const payments = (tx.payments || []).map((e) => (
        e.entry_id === entryId
          ? { ...e, verification: 'confirmed', note: [e.note, 'Verified by the pharmacist'].filter(Boolean).join(' — ') }
          : e
      ));
      const saved = await saveTx(tx, payments);
      await audit('payment_confirmed', `Verified payment on ${tx.transaction_id} (${tx.prescription_ref})`, tx.patient_name || '', tx.patient_cin || '');
      return Response.json({ transaction: saved });
    }

    // ---- Refund part or all of a payment ------------------------------------
    if (action === 'refund') {
      const tx = await loadTx(body?.transaction_id);
      if (!tx) return Response.json({ error: 'Payment transaction not found.' }, { status: 404 });
      const amount = Number(body?.amount);
      const reason = String(body?.reason || '').trim();
      if (!Number.isFinite(amount) || amount <= 0) {
        return Response.json({ error: 'A refund amount greater than zero is required.' }, { status: 400 });
      }
      if (!reason) return Response.json({ error: 'A reason is required for every refund.' }, { status: 400 });
      if (amount > (tx.amount_paid || 0) + 0.001) {
        return Response.json({ error: 'The refund cannot exceed the amount paid.' }, { status: 400 });
      }
      const entry = {
        entry_id: newEntryId(),
        entry_type: 'refund',
        datetime: now,
        amount,
        method: '',
        verification: 'confirmed',
        pharmacist_name: pharmacist.full_name,
        note: reason,
      };
      const saved = await saveTx(tx, [...(tx.payments || []), entry]);
      await audit('payment_refunded', `Refunded ${amount} on ${tx.transaction_id} (${tx.prescription_ref}) — ${reason}`, tx.patient_name || '', tx.patient_cin || '');
      return Response.json({ transaction: saved });
    }

    // ---- Authorized financial adjustment ------------------------------------
    if (action === 'adjust') {
      const tx = await loadTx(body?.transaction_id);
      if (!tx) return Response.json({ error: 'Payment transaction not found.' }, { status: 404 });
      const amount = Number(body?.amount);
      const reason = String(body?.reason || '').trim();
      if (!Number.isFinite(amount) || amount === 0) {
        return Response.json({ error: 'A non-zero adjustment amount is required.' }, { status: 400 });
      }
      if (!reason) return Response.json({ error: 'A reason is required for every adjustment.' }, { status: 400 });
      const entry = {
        entry_id: newEntryId(),
        entry_type: 'adjustment',
        datetime: now,
        amount,
        method: '',
        verification: 'confirmed',
        pharmacist_name: pharmacist.full_name,
        note: reason,
      };
      const saved = await saveTx(tx, [...(tx.payments || []), entry]);
      await audit('payment_adjusted', `Adjusted ${tx.transaction_id} (${tx.prescription_ref}) by ${amount} — ${reason}`, tx.patient_name || '', tx.patient_cin || '');
      return Response.json({ transaction: saved });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}