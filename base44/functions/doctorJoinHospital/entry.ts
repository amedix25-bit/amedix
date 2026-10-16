import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Doctor-side hospital join. A doctor can ONLY join a hospital with that
// hospital's unique AMedix Hospital Code — never by typing a hospital name.
// The code is validated here on the backend: the frontend cannot create or
// reactivate an association on its own (HospitalDoctor writes are
// service-role only). With verify_only the code is checked and the hospital
// is returned WITHOUT joining, so the doctor can confirm the hospital and
// their department before the association is created.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const verifyOnly = !!body.verify_only;
    if (!code) {
      return Response.json({ error: "Please enter the hospital's AMedix Hospital Code." }, { status: 400 });
    }

    const doctors = await base44.entities.DoctorProfile.filter({ user_id: user.id });
    if (doctors.length === 0) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }
    const doctor = doctors[0];

    const hospitals = await base44.asServiceRole.entities.HospitalProfile.filter({ hospital_code: code });
    if (hospitals.length === 0) {
      return Response.json({ error: "Invalid AMedix Hospital Code. Please check the code with the hospital." }, { status: 404 });
    }
    const hospital = hospitals[0];
    if (hospital.status === "suspended") {
      return Response.json({ error: "This hospital account is currently suspended." }, { status: 403 });
    }

    if (verifyOnly) {
      return Response.json({
        hospital_name: hospital.hospital_name,
        hospital_location: hospital.location || "",
        hospital_photo_url: hospital.photo_url || "",
      });
    }

    const department = String(body.department || "").trim() || doctor.specialization || "";

    const existing = await base44.asServiceRole.entities.HospitalDoctor.filter({
      hospital_id: hospital.id,
      doctor_id: doctor.id,
    });
    if (existing.length > 0) {
      const assoc = existing[0];
      if (assoc.status === "active") {
        return Response.json({ error: "You are already associated with this hospital." }, { status: 409 });
      }
      // A previously deactivated/removed association is re-established with the code.
      await base44.asServiceRole.entities.HospitalDoctor.update(assoc.id, {
        status: "active",
        specialization: department,
        doctor_name: doctor.full_name,
        doctor_photo_url: doctor.photo_url || "",
        joined_datetime: new Date().toISOString(),
      });
    } else {
      await base44.asServiceRole.entities.HospitalDoctor.create({
        hospital_id: hospital.id,
        hospital_name: hospital.hospital_name,
        hospital_user_id: hospital.user_id,
        doctor_id: doctor.id,
        doctor_user_id: user.id,
        doctor_name: doctor.full_name,
        doctor_photo_url: doctor.photo_url || "",
        specialization: department,
        status: "active",
        joined_datetime: new Date().toISOString(),
      });
    }

    // The first hospital the doctor joins becomes their current working
    // hospital; afterwards the doctor switches between hospitals themselves.
    if (!doctor.hospital) {
      await base44.entities.DoctorProfile.update(doctor.id, { hospital: hospital.hospital_name });
    }

    return Response.json({ status: "joined", hospital_name: hospital.hospital_name, specialization: department });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}