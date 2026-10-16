import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// The signed-in doctor's own clinical notes, across all their patients.
// Server-side: the doctor identity is resolved from the signed-in user, never
// from the request payload, so a doctor can only ever list their own notes.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id });
    const doctor = doctors[0] || null;
    if (!doctor) return Response.json({ error: "Doctor profile not found." }, { status: 403 });

    const notes = await base44.asServiceRole.entities.ClinicalNote.filter(
      { doctor_id: doctor.id },
      "-date",
      300
    );
    return Response.json({ notes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}