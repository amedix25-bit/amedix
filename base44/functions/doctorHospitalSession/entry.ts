import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { normalizeHospitalName } from "../../shared/hospitalAuth.ts";

// Doctor Portal hospital session. Access to the hospital-specific Doctor
// Portal requires the AMedix Hospital Code of the hospital the doctor is
// working at: the code is validated here AND the doctor must hold an ACTIVE
// association with that hospital. Only then is the portal session opened for
// that hospital and the doctor's working hospital set server-side. The
// hospital_name path is for switching between the doctor's own
// already-verified associations inside the portal.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id });
    if (doctors.length === 0) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }
    const doctor = doctors[0];

    // List mode — the doctor's own hospitals for the Overview switcher. Only
    // hospitals with an ACTIVE verified association are ever returned, each
    // with its official logo. A hospital the doctor is not authorized at can
    // never appear here.
    if (body && body.list) {
      const assocs = await base44.asServiceRole.entities.HospitalDoctor.filter({ doctor_id: doctor.id });
      const hospitals = await base44.asServiceRole.entities.HospitalProfile.list();
      const byId = new Map(hospitals.map((h) => [h.id, h]));
      const list = assocs
        .filter((a) => a.status === "active")
        .map((a) => {
          const h = byId.get(a.hospital_id);
          if (!h) return null;
          return {
            hospital_id: h.id,
            hospital_name: h.hospital_name,
            hospital_location: h.location || "",
            hospital_photo_url: h.photo_url || "",
          };
        })
        .filter(Boolean);
      return Response.json({ hospitals: list });
    }

    const code = String((body && body.code) || "").trim().toUpperCase();
    const hospitalName = String((body && body.hospital_name) || "").trim();
    if (!code && !hospitalName) {
      return Response.json({ error: "Enter the hospital's AMedix Hospital Code." }, { status: 400 });
    }

    let hospital = null;
    if (code) {
      const byCode = await base44.asServiceRole.entities.HospitalProfile.filter({ hospital_code: code });
      hospital = byCode[0] || null;
      if (!hospital) {
        return Response.json({ error: "Invalid AMedix Hospital Code. Please check the code with the hospital." }, { status: 404 });
      }
    } else {
      const all = await base44.asServiceRole.entities.HospitalProfile.list();
      hospital = all.find((h) => normalizeHospitalName(h.hospital_name) === normalizeHospitalName(hospitalName)) || null;
      if (!hospital) {
        return Response.json({ error: "Hospital not found." }, { status: 404 });
      }
    }
    if (hospital.status === "suspended") {
      return Response.json({ error: "This hospital account is currently suspended." }, { status: 403 });
    }

    const assocs = await base44.asServiceRole.entities.HospitalDoctor.filter({
      hospital_id: hospital.id,
      doctor_id: doctor.id,
    });
    const active = assocs.filter((a) => a.status === "active");
    if (active.length === 0) {
      return Response.json(
        {
          error: "You are not authorized to work at this hospital. The hospital administrator must associate your account first.",
          code: "not_associated",
          hospital_name: hospital.hospital_name,
          hospital_location: hospital.location || "",
        },
        { status: 403 }
      );
    }

    await base44.asServiceRole.entities.DoctorProfile.update(doctor.id, { hospital: hospital.hospital_name });

    return Response.json({
      hospital_id: hospital.id,
      hospital_name: hospital.hospital_name,
      hospital_location: hospital.location || "",
      hospital_photo_url: hospital.photo_url || "",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}