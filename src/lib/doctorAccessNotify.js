import { base44 } from "@/api/base44Client";

// Tells a doctor, in their notifications bell, that the patient has just
// granted them access. The notification carries the patient's CIN, so a click
// opens that patient in Find Patient, where the record is now readable.
export async function notifyDoctorAccessGranted(request) {
  if (!request?.doctor_id) return;
  try {
    const profiles = await base44.entities.DoctorProfile.filter({ id: request.doctor_id });
    const doctorUserId = profiles[0]?.user_id;
    if (!doctorUserId) return;

    const patientName = request.patient_name || "your patient";
    await base44.entities.DoctorNotification.create({
      doctor_user_id: doctorUserId,
      doctor_id: request.doctor_id,
      type: "patient_access_granted",
      title: "Access Granted",
      message: `You now have access to ${patientName}'s medical record.`,
      patient_id: request.patient_id,
      patient_name: request.patient_name,
      patient_cin: request.patient_cin,
      related_id: request.id,
      is_read: false,
      datetime: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
  }
}