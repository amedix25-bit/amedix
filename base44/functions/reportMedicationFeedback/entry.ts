import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { missedDoseGuidance } from "../../shared/medicationSafety.ts";

// Patient feedback in the adherence system: side effects, difficulty
// following the plan, problems obtaining the medication, and reports that a
// clinician changed or stopped the treatment. Severe side effects and
// treatment changes/stops alert the prescribing doctor through the Doctor
// Portal notification bar.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const categories = ['side_effect', 'difficulty_following', 'problem_obtaining', 'treatment_changed', 'treatment_stopped'];
    const category = String(body?.category || '').trim();
    const medicationId = String(body?.medication_id || '').trim();
    if (!categories.includes(category) || !medicationId) {
      return Response.json({ error: 'Medication and a valid category are required.' }, { status: 400 });
    }
    const severities = ['mild', 'moderate', 'severe'];
    const severity = severities.includes(body?.severity) ? body.severity : '';

    let meds = [];
    try {
      meds = await base44.asServiceRole.entities.Medication.filter({ id: medicationId }, { limit: 1 });
    } catch (e) { meds = []; }
    const med = (meds.items || meds)[0];
    if (!med) return Response.json({ error: 'Medication record not found.' }, { status: 404 });
    if (med.patient_user_id !== user.id) {
      return Response.json({ error: 'You can only report on your own medications.' }, { status: 403 });
    }

    // Resolve the prescribing doctor through the linked prescription, when the
    // medication came from one — the doctor notified is the prescriber.
    let prescription = null;
    const prescriptionId = med.prescription_id || String(body?.prescription_id || '').trim();
    if (prescriptionId) {
      try {
        const rxPage = await base44.asServiceRole.entities.Prescription.filter({ id: prescriptionId }, { limit: 1 });
        prescription = (rxPage.items || rxPage)[0] || null;
      } catch (e) { prescription = null; }
    }

    let patientName = med.patient_name || '';
    if (!patientName && prescription) patientName = prescription.patient_name || '';

    const feedback = await base44.asServiceRole.entities.MedicationFeedback.create({
      patient_id: med.patient_id,
      patient_user_id: user.id,
      medication_id: medicationId,
      prescription_id: prescription ? prescription.id : '',
      medication_name: med.name,
      category,
      severity,
      details: String(body?.details || '').trim(),
      status: 'open',
      doctor_user_id: prescription ? prescription.doctor_user_id : '',
      doctor_id: prescription ? prescription.doctor_id : '',
      reported_datetime: new Date().toISOString(),
    });

    // Clinically important issues alert the prescriber: severe side effects,
    // and reports that the treatment was changed or stopped.
    let doctor_notified = false;
    const alertWorthy = severity === 'severe' || category === 'treatment_stopped' || category === 'treatment_changed';
    if (alertWorthy && prescription && prescription.doctor_user_id) {
      const labels = {
        side_effect: 'reported a SEVERE side effect',
        treatment_changed: 'reported that their treatment was changed',
        treatment_stopped: 'reported that their treatment was stopped',
      };
      await base44.asServiceRole.entities.DoctorNotification.create({
        doctor_user_id: prescription.doctor_user_id,
        doctor_id: prescription.doctor_id || '',
        type: 'medication_adherence',
        title: 'Medication Report from Patient',
        message: `${patientName || 'A patient'} ${labels[category]} while taking ${med.name}. Open the patient's Medication History to review the report.`,
        patient_id: med.patient_id,
        patient_name: patientName,
        patient_cin: med.patient_cin || prescription.patient_cin || '',
        related_id: feedback.id,
        target: 'find_patient',
        datetime: new Date().toISOString(),
        is_read: false,
      });
      doctor_notified = true;
    }

    // Guidance accompanies the report where it is clinically relevant.
    const guidance = category === 'side_effect' && severity !== 'severe'
      ? 'Thank you — your report is recorded in your medical history. If symptoms worsen, contact your doctor or seek urgent care.'
      : '';

    return Response.json({ feedback, doctor_notified, guidance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}