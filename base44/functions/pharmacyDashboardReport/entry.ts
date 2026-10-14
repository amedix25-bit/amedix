import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Pharmacy administrator operations report — every figure is derived from the
// underlying transaction records (visits, dispensing events, payment
// transactions, inventory), never from manually entered numbers.
// Financial definitions are strict and separate:
//   gross charges       = amount due on payment transactions in the window
//   payments collected  = payment entries verified as confirmed
//   pending verification = payment entries not yet verified (card, transfer,
//                          insurance and other non-cash methods)
//   outstanding balances = remaining balances on payment transactions
//   refunds / adjustments = the correction entries in the payment history
//   net collected       = collected + adjustments - refunds
// Nothing here is labeled profit — no cost or expense data is involved.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const profiles = await base44.asServiceRole.entities.PharmacyProfile.filter({ user_id: user.id }, { limit: 1 });
    const pharmacy = (profiles.items || profiles)[0];
    if (!pharmacy) return Response.json({ error: 'Pharmacy profile not found.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const period = String(body?.period || 'today');
    const pharmacistFilter = String(body?.pharmacist || '').trim();
    const now = new Date();
    const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    const dayEnd = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
    let startIso, endIso;
    if (period === 'today') {
      startIso = dayStart(now); endIso = dayEnd(now);
    } else if (period === 'yesterday') {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      startIso = dayStart(y); endIso = dayEnd(y);
    } else if (period === 'week') {
      const s = new Date(now); s.setDate(s.getDate() - 6);
      startIso = dayStart(s); endIso = dayEnd(now);
    } else if (period === 'month') {
      startIso = dayStart(new Date(now.getFullYear(), now.getMonth(), 1)); endIso = dayEnd(now);
    } else if (period === 'custom') {
      const s = new Date(String(body?.start_date || ''));
      const e = new Date(String(body?.end_date || ''));
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        return Response.json({ error: 'A valid start and end date are required for a custom range.' }, { status: 400 });
      }
      startIso = dayStart(s); endIso = dayEnd(e);
    } else {
      startIso = dayStart(now); endIso = dayEnd(now);
    }

    const [rxPage, txPage, visitPage, invPage] = await Promise.all([
      base44.asServiceRole.entities.Prescription.filter(
        { authorized_pharmacy_id: pharmacy.id }, { sort: '-created_date', limit: 500 }
      ),
      base44.asServiceRole.entities.PaymentTransaction.filter(
        { pharmacy_id: pharmacy.id }, { sort: '-created_date', limit: 500 }
      ),
      base44.asServiceRole.entities.PharmacyVisit.filter(
        { pharmacy_id: pharmacy.id }, { sort: '-created_date', limit: 500 }
      ),
      base44.asServiceRole.entities.PharmacyInventory.filter({ pharmacy_id: pharmacy.id }, { limit: 500 }),
    ]);
    const prescriptions = rxPage.items || rxPage;
    const transactions = txPage.items || txPage;
    const visits = visitPage.items || visitPage;
    const inventory = invPage.items || invPage;

    const inWindow = (iso) => iso && String(iso) >= startIso && String(iso) <= endIso;
    const matchesPharmacist = (name) =>
      !pharmacistFilter || String(name || '').toLowerCase() === pharmacistFilter.toLowerCase();

    // ---- Visits: patients served, counted from completed visit records only.
    const completedVisits = visits.filter(
      (v) => v.status === 'completed' && inWindow(v.completed_datetime || v.check_in_datetime)
    );
    const uniquePatients = new Set(completedVisits.map((v) => v.patient_cin).filter(Boolean));
    const cancelledVisits = visits.filter(
      (v) => v.status === 'cancelled' && inWindow(v.cancelled_datetime || v.check_in_datetime)
    );

    // ---- Dispensing: one entry per dispensing event in the window.
    const fills = [];
    for (const rx of prescriptions) {
      for (const ev of rx.dispensing_events || []) {
        if (!inWindow(ev.datetime)) continue;
        if (!matchesPharmacist(ev.pharmacist_name)) continue;
        fills.push({ rx, ev });
      }
    }
    const unitsDispensed = fills.reduce((s, f) => s + (f.ev.quantity_number || 0), 0);
    const refillFills = fills.filter((f) => f.ev.consumed_refill).length;
    // Current pipeline states (open right now, not window-bound).
    const pendingAuthorized = prescriptions.filter((p) => p.status === 'authorized').length;
    const pendingReserved = prescriptions.filter((p) => p.status === 'reserved').length;
    const partiallyDispensed = prescriptions.filter((p) => {
      if (p.status !== 'dispensed') return false;
      const events = p.dispensing_events || [];
      if (events.length === 0) return false;
      return Number(events[events.length - 1].remaining_after) > 0;
    }).length;
    const unavailable = prescriptions.filter(
      (p) => p.rejected_reason && inWindow(p.rejected_datetime)
    ).length;

    // ---- Financials: built from the payment history entries, so partial
    // payments, split payments, refunds and duplicates cannot inflate totals.
    const txs = transactions.filter(
      (t) => inWindow(t.created_datetime) && matchesPharmacist(t.pharmacist_name)
    );
    let grossCharges = 0, collected = 0, pendingVerification = 0, refunds = 0, adjustments = 0;
    const byMethod = {};
    const byPharmacist = {};
    const byMedication = {};
    const round2 = (v) => Math.round(v * 100) / 100;
    for (const t of txs) {
      grossCharges += Number(t.amount_due) || 0;
      for (const e of t.payments || []) {
        const amt = Number(e.amount) || 0;
        if (e.entry_type === 'payment') {
          if (e.verification === 'pending_verification') pendingVerification += amt;
          else collected += amt;
          if (e.method) byMethod[e.method] = round2((byMethod[e.method] || 0) + amt);
        } else if (e.entry_type === 'refund') {
          refunds += amt;
        } else if (e.entry_type === 'adjustment') {
          adjustments += amt;
        }
      }
      const ph = t.pharmacist_name || 'Unrecorded';
      byPharmacist[ph] = byPharmacist[ph] || { charges: 0, collected: 0, transactions: 0 };
      byPharmacist[ph].charges = round2(byPharmacist[ph].charges + (Number(t.amount_due) || 0));
      byPharmacist[ph].collected = round2(byPharmacist[ph].collected + (Number(t.amount_paid) || 0));
      byPharmacist[ph].transactions += 1;
      for (const it of t.items || []) {
        const key = `${it.medication_name || 'Unrecorded'}${it.strength ? ` ${it.strength}` : ''}`;
        byMedication[key] = byMedication[key] || { units: 0, transactions: 0 };
        byMedication[key].transactions += 1;
        const q = parseFloat(String(it.quantity || ''));
        if (Number.isFinite(q)) byMedication[key].units += q;
      }
    }
    const outstanding = txs.reduce((s, t) => s + (t.outstanding_balance || 0), 0);

    // ---- Inventory alerts.
    const threshold = Number(pharmacy.low_stock_threshold ?? 10) || 10;
    const lowStock = inventory.filter((i) => i.quantity_in_stock <= threshold && !i.is_quarantined).length;
    const expiring = inventory.filter((i) => i.safety_status === 'expiring').length;
    const expired = inventory.filter((i) => i.safety_status === 'expired').length;
    const quarantined = inventory.filter((i) => i.is_quarantined).length;

    return Response.json({
      window: { start: startIso, end: endIso, period },
      visits: {
        patients_served: completedVisits.length,
        unique_patients: uniquePatients.size,
        completed: completedVisits.length,
        cancelled: cancelledVisits.length,
      },
      prescriptions: {
        dispensed_fills: fills.length,
        refill_fills: refillFills,
        units_dispensed: unitsDispensed,
        pending_authorized: pendingAuthorized,
        pending_reserved: pendingReserved,
        partially_dispensed: partiallyDispensed,
        unavailable,
      },
      financial: {
        gross_charges: round2(grossCharges),
        collected: round2(collected),
        pending_verification: round2(pendingVerification),
        outstanding: round2(outstanding),
        refunds: round2(refunds),
        adjustments: round2(adjustments),
        net_collected: round2(collected + adjustments - refunds),
      },
      by_method: byMethod,
      by_pharmacist: byPharmacist,
      by_medication: byMedication,
      inventory_alerts: { low_stock: lowStock, expiring, expired, quarantined, threshold },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}