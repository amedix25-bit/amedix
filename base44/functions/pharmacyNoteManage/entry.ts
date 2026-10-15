import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  verifyPharmacistSession, touchPharmacistActivity, pharmacistUnauthorized,
} from "../../shared/pharmacyStaffAuth.ts";
import { generateClinicalRef, logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Pharmacy clinical notes — counter notes a pharmacist records about a patient
// interaction (counseling given, adverse reactions reported, interventions).
// Session-verified like every other pharmacist action; notes never leave the
// recording pharmacy.
//   list   → the pharmacy's notes for one patient (by CIN)
//   create → record a new note
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

    if (action === 'list') {
      const cin = String(body?.cin || '').trim();
      if (!cin) return Response.json({ error: 'A patient CIN is required.' }, { status: 400 });
      const page = await base44.asServiceRole.entities.PharmacyClinicalNote.filter(
        { pharmacy_id: pharmacy.id, patient_cin: cin },
        { sort: '-created_date', limit: 100 }
      );
      return Response.json({ notes: page.items || page });
    }

    if (action === 'create') {
      const cin = String(body?.cin || '').trim();
      const content = String(body?.content || '').trim();
      const category = String(body?.category || 'other');
      if (!cin) return Response.json({ error: 'A patient CIN is required.' }, { status: 400 });
      if (!content) return Response.json({ error: 'The note text is required.' }, { status: 400 });
      if (!['counseling', 'adverse_reaction', 'intervention', 'other'].includes(category)) {
        return Response.json({ error: 'Unknown note category.' }, { status: 400 });
      }
      const note = await base44.asServiceRole.entities.PharmacyClinicalNote.create({
        note_id: generateClinicalRef('PN'),
        pharmacy_id: pharmacy.id,
        pharmacy_user_id: pharmacy.user_id,
        pharmacy_name: pharmacy.pharmacy_name || '',
        patient_id: String(body?.patient_id || ''),
        patient_cin: cin,
        patient_name: String(body?.patient_name || ''),
        visit_id: String(body?.visit_id || ''),
        category,
        content,
        pharmacist_id: pharmacist.id,
        pharmacist_name: pharmacist.full_name,
        created_datetime: now,
      });
      await logClinicalAudit(base44.asServiceRole, {
        actor_user_id: pharmacist.pharmacy_user_id,
        actor_name: pharmacist.full_name,
        actor_role: 'pharmacy',
        action: 'pharmacy_note_created',
        action_label: `Recorded a ${category.replace('_', ' ')} clinical note about the patient`,
        patient_id: note.patient_id || '',
        patient_cin: cin,
        patient_name: note.patient_name || '',
        document_id: note.id,
      });
      return Response.json({ note });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}