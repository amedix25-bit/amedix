import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  verifyPharmacistSession, touchPharmacistActivity, pharmacistUnauthorized,
} from "../../shared/pharmacyStaffAuth.ts";

// Data for the pharmacist's workspace: the pharmacy they belong to and the
// prescriptions patients have authorized to it. Every call is verified
// against the pharmacist's individual session — a pharmacist only ever sees
// the records and functions of their assigned pharmacy.
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

    const page = await base44.asServiceRole.entities.Prescription.filter(
      { authorized_pharmacy_user_id: pharmacist.pharmacy_user_id },
      { sort: '-created_date', limit: 100 }
    );
    const prescriptions = (page.items || page).map((p) => ({
      id: p.id,
      prescription_id: p.prescription_id || '',
      medication_name: p.medication_name,
      active_ingredient: p.active_ingredient || '',
      strength: p.strength || '',
      dosage: p.dosage || '',
      route: p.route || '',
      frequency: p.frequency || '',
      duration: p.duration || '',
      quantity: p.quantity || '',
      refills_authorized: p.refills_authorized || 0,
      refills_used: p.refills_used || 0,
      special_instructions: p.special_instructions || '',
      patient_name: p.patient_name || '',
      patient_cin: p.patient_cin || '',
      doctor_name: p.doctor_name || '',
      date_prescribed: p.date_prescribed || '',
      status: p.status,
      reservation_code: p.reservation_code || '',
      dispensed_datetime: p.dispensed_datetime || '',
      dispensed_by_name: p.dispensed_by_name || '',
      dispensing_events: p.dispensing_events || [],
      pending_substitution: p.pending_substitution || null,
    }));

    return Response.json({
      pharmacy: {
        id: pharmacy.id,
        pharmacy_name: pharmacy.pharmacy_name,
        pharmacy_number: pharmacy.pharmacy_number,
        address: pharmacy.address || '',
        phone: pharmacy.phone || '',
        email: pharmacy.email || '',
        logo_url: pharmacy.logo_url || '',
        status: pharmacy.status || 'active',
      },
      pharmacist: {
        id: pharmacist.id,
        full_name: pharmacist.full_name,
        username: pharmacist.username || '',
        is_active: pharmacist.is_active !== false,
        last_active_datetime: pharmacist.last_active_datetime || '',
      },
      prescriptions,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}