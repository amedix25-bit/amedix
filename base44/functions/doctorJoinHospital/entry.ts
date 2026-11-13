import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { auditEntry, isActivated, loadAuthorization, withAudit } from "../../shared/hospitalAuthorization.ts";

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
    if (hospital.hospital_code_status === "deactivated") {
      return Response.json(
        { error: "This hospital code has been deactivated by the hospital. Please ask the hospital administrator for an active code." },
        { status: 403 }
      );
    }

    // A Hospital Code only carries weight once the institution passed AMedix
    // administrative authorization. The check reads the server-owned
    // authorization record, so a self-assigned hospital_code cannot be used to
    // enrol doctors.
    const authorization = await loadAuthorization(base44, hospital.id);
    if (!isActivated(authorization)) {
      return Response.json(
        { error: "This hospital has not completed AMedix administrative authorization yet. Please ask the hospital administrator to contact AMedix administration." },
        { status: 403 }
      );
    }

    if (verifyOnly) {
      return Response.json({
        hospital_name: hospital.hospital_name,
        hospital_location: hospital.location || "",
        hospital_photo_url: hospital.photo_url || "",
      });
    }

    const department = String(body.department || "").trim() || doctor.specialization || "";

    const stamp = new Date().toISOString();
    const existing = await base44.asServiceRole.entities.HospitalDoctor.filter({
      hospital_id: hospital.id,
      doctor_id: doctor.id,
    });
    const assoc = existing[0] || null;
    if (assoc && assoc.status === "active") {
      return Response.json({ error: "You are already associated with this hospital." }, { status: 409 });
    }
    // The hospital decides whether a doctor it deactivated, rejected or removed
    // comes back — the code never overrides a hospital's own decision.
    if (assoc && ["deactivated", "rejected", "removed"].includes(assoc.status)) {
      return Response.json(
        {
          error: `Your affiliation with this hospital was ended by the hospital. Please ask the ${hospital.hospital_name} administrator to reactivate it.`,
        },
        { status: 403 }
      );
    }

    // FAST-TRACK AFFILIATION: a valid, active AMedix Hospital Code activates the
    // association immediately, with no hospital approval wait. The professional
    // verification of the doctor remains a separate AMedix administration step.
    const patch = {
      status: "active",
      specialization: department,
      doctor_name: doctor.full_name,
      doctor_photo_url: doctor.photo_url || "",
      joined_datetime: stamp,
      decided_datetime: stamp,
      decided_by_name: "AMedix Hospital Code",
      decision_note: "Activated automatically with the hospital's AMedix Hospital Code",
    };
    if (assoc) {
      await base44.asServiceRole.entities.HospitalDoctor.update(assoc.id, patch);
    } else {
      await base44.asServiceRole.entities.HospitalDoctor.create({
        ...patch,
        hospital_id: hospital.id,
        hospital_name: hospital.hospital_name,
        hospital_user_id: hospital.user_id,
        doctor_id: doctor.id,
        doctor_user_id: user.id,
      });
    }

    // The affiliation and its code activation are recorded in the hospital's
    // audit trail.
    try {
      await base44.asServiceRole.entities.HospitalAuthorization.update(authorization.id, {
        audit: withAudit(
          authorization,
          auditEntry({
            action: "doctor_affiliated",
            actionLabel: "Doctor affiliated with the hospital",
            actor: { user_id: user.id, name: doctor.full_name, role: "doctor" },
            detail: `Affiliation activated immediately with the hospital code (${department || "department not set"})`,
          })
        ),
      });
    } catch (err) {
      /* the affiliation record itself is authoritative */
    }

    return Response.json({
      status: "active",
      hospital_name: hospital.hospital_name,
      specialization: department,
      message: `You are now affiliated with ${hospital.hospital_name}. Your professional verification is completed separately by AMedix administration.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}