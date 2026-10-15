import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  verifyPharmacistSession, touchPharmacistActivity, pharmacistUnauthorized,
} from "../../shared/pharmacyStaffAuth.ts";
import { generateClinicalRef, logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Pharmacy visits — a record of a patient's attendance at the pharmacy.
// A visit is created ONLY by an explicit staff check-in: searching for a CIN,
// opening a prescription or dispensing never creates or completes a visit.
// Each patient has at most one active visit per pharmacy, so repeated clicks,
// refreshes or resubmissions return the same visit instead of duplicates.
//   list      → the pharmacy's visits
//   active    → the active visit for one patient (by CIN)
//   check_in  → start a visit (duplicate-proof)
//   set_status → checked_in → in_progress
//   complete  → end the visit; its linked prescriptions and payments are
//               collected automatically from the visit's time window
//   cancel    → cancel the visit (reason required)
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

    const loadVisit = async (visitId) => {
      if (!visitId) return null;
      try {
        const v = await base44.asServiceRole.entities.PharmacyVisit.get(String(visitId));
        if (!v || v.pharmacy_id !== pharmacy.id) return null;
        return v;
      } catch (e) { return null; }
    };

    if (action === 'list') {
      const page = await base44.asServiceRole.entities.PharmacyVisit.filter(
        { pharmacy_id: pharmacy.id },
        { sort: '-created_date', limit: 300 }
      );
      return Response.json({ visits: page.items || page });
    }

    if (action === 'list_by_patient') {
      const cin = String(body?.cin || '').trim();
      if (!cin) return Response.json({ error: 'A patient CIN is required.' }, { status: 400 });
      const page = await base44.asServiceRole.entities.PharmacyVisit.filter(
        { pharmacy_id: pharmacy.id, patient_cin: cin },
        { sort: '-created_date', limit: 50 }
      );
      return Response.json({ visits: page.items || page });
    }

    if (action === 'active') {
      const cin = String(body?.cin || '').trim();
      if (!cin) return Response.json({ error: 'A patient CIN is required.' }, { status: 400 });
      const page = await base44.asServiceRole.entities.PharmacyVisit.filter(
        { pharmacy_id: pharmacy.id, patient_cin: cin, status: { $in: ['checked_in', 'in_progress'] } },
        { limit: 1 }
      );
      return Response.json({ visit: (page.items || page)[0] || null });
    }

    if (action === 'check_in') {
      const cin = String(body?.cin || '').trim();
      const patientName = String(body?.patient_name || '').trim();
      const patientId = String(body?.patient_id || '').trim();
      if (!cin) return Response.json({ error: 'A patient CIN is required.' }, { status: 400 });

      // Duplicate prevention: an already-active visit for this patient at this
      // pharmacy is returned instead of creating a new one.
      const activePage = await base44.asServiceRole.entities.PharmacyVisit.filter(
        { pharmacy_id: pharmacy.id, patient_cin: cin, status: { $in: ['checked_in', 'in_progress'] } },
        { limit: 1 }
      );
      const active = (activePage.items || activePage)[0];
      if (active) return Response.json({ visit: active, duplicate: true });

      // Double-click guard: a check-in for the same patient within the last
      // minute is treated as a repeat submission.
      const recentPage = await base44.asServiceRole.entities.PharmacyVisit.filter(
        { pharmacy_id: pharmacy.id, patient_cin: cin },
        { sort: '-created_date', limit: 1 }
      );
      const recent = (recentPage.items || recentPage)[0];
      if (recent && new Date(now).getTime() - new Date(recent.check_in_datetime || recent.created_date).getTime() < 60000) {
        return Response.json({ visit: recent, duplicate: true });
      }

      const visit = await base44.asServiceRole.entities.PharmacyVisit.create({
        visit_id: generateClinicalRef('PV'),
        pharmacy_id: pharmacy.id,
        pharmacy_user_id: pharmacy.user_id,
        pharmacy_name: pharmacy.pharmacy_name || '',
        patient_id: patientId,
        patient_cin: cin,
        patient_name: patientName,
        status: 'checked_in',
        check_in_datetime: now,
        responsible_pharmacist_id: pharmacist.id,
        responsible_pharmacist_name: pharmacist.full_name,
        prescription_refs: [],
        payment_transaction_ids: [],
        dispensing_count: 0,
        payment_total: 0,
      });
      await logClinicalAudit(base44.asServiceRole, {
        actor_user_id: pharmacist.pharmacy_user_id,
        actor_name: pharmacist.full_name,
        actor_role: 'pharmacy',
        action: 'pharmacy_check_in',
        action_label: `Checked patient in at ${pharmacy.pharmacy_name || 'the pharmacy'} (${visit.visit_id})`,
        patient_name: patientName,
        patient_cin: cin,
      });
      return Response.json({ visit });
    }

    if (action === 'set_status') {
      const visit = await loadVisit(body?.visit_id);
      if (!visit) return Response.json({ error: 'Visit not found.' }, { status: 404 });
      if (visit.status !== 'checked_in') {
        return Response.json({ error: 'Only a checked-in visit can be marked in progress.' }, { status: 400 });
      }
      await base44.asServiceRole.entities.PharmacyVisit.update(visit.id, { status: 'in_progress' });
      return Response.json({ visit: { ...visit, status: 'in_progress' } });
    }

    if (action === 'complete') {
      const visit = await loadVisit(body?.visit_id);
      if (!visit) return Response.json({ error: 'Visit not found.' }, { status: 404 });
      if (visit.status !== 'checked_in' && visit.status !== 'in_progress') {
        return Response.json({ error: 'This visit is already closed.' }, { status: 400 });
      }
      // Link what happened during the visit: prescriptions dispensed and
      // payments recorded between check-in and now. Dispensing events are
      // stamped on the prescription; payment transactions carry their own
      // creation time.
      const rxPage = await base44.asServiceRole.entities.Prescription.filter(
        { authorized_pharmacy_id: pharmacy.id },
        { sort: '-created_date', limit: 300 }
      );
      const prescriptionRefs = new Set();
      let dispensingCount = 0;
      for (const rx of (rxPage.items || rxPage)) {
        for (const ev of rx.dispensing_events || []) {
          if ((ev.datetime || '') >= visit.check_in_datetime) {
            prescriptionRefs.add(rx.prescription_id || '');
            dispensingCount += 1;
          }
        }
      }
      const payPage = await base44.asServiceRole.entities.PaymentTransaction.filter(
        { pharmacy_id: pharmacy.id, created_datetime: { $gte: visit.check_in_datetime, $lte: now } },
        { limit: 300 }
      );
      const txs = payPage.items || payPage;
      const paymentTotal = txs.reduce((s, t) => s + (t.amount_paid || 0), 0);
      const update = {
        status: 'completed',
        completed_datetime: now,
        prescription_refs: [...prescriptionRefs].filter(Boolean),
        payment_transaction_ids: txs.map((t) => t.id),
        dispensing_count: dispensingCount,
        payment_total: paymentTotal,
      };
      await base44.asServiceRole.entities.PharmacyVisit.update(visit.id, update);
      await logClinicalAudit(base44.asServiceRole, {
        actor_user_id: pharmacist.pharmacy_user_id,
        actor_name: pharmacist.full_name,
        actor_role: 'pharmacy',
        action: 'pharmacy_visit_completed',
        action_label: `Completed visit ${visit.visit_id} (${dispensingCount} dispensing transaction${dispensingCount === 1 ? '' : 's'})`,
        patient_name: visit.patient_name || '',
        patient_cin: visit.patient_cin || '',
      });
      return Response.json({ visit: { ...visit, ...update } });
    }

    if (action === 'cancel') {
      const visit = await loadVisit(body?.visit_id);
      if (!visit) return Response.json({ error: 'Visit not found.' }, { status: 404 });
      if (visit.status !== 'checked_in' && visit.status !== 'in_progress') {
        return Response.json({ error: 'This visit is already closed.' }, { status: 400 });
      }
      const reason = String(body?.reason || '').trim();
      if (!reason) return Response.json({ error: 'A reason is required to cancel a visit.' }, { status: 400 });
      await base44.asServiceRole.entities.PharmacyVisit.update(visit.id, {
        status: 'cancelled',
        cancelled_datetime: now,
        cancelled_reason: reason,
      });
      await logClinicalAudit(base44.asServiceRole, {
        actor_user_id: pharmacist.pharmacy_user_id,
        actor_name: pharmacist.full_name,
        actor_role: 'pharmacy',
        action: 'pharmacy_visit_cancelled',
        action_label: `Cancelled visit ${visit.visit_id} — ${reason}`,
        patient_name: visit.patient_name || '',
        patient_cin: visit.patient_cin || '',
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}