import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";
import { logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Lab request creation with the mandatory check-in gate. The backend
// independently verifies that an active check-in exists for this patient at
// the doctor's hospital BEFORE the request is created.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.patient_id || !payload.doctor_id) {
      return Response.json({ error: "Patient and doctor are required." }, { status: 400 });
    }

    let doctors = [];
    try {
      doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ id: String(payload.doctor_id) });
    } catch (e) { doctors = []; }
    if (doctors.length === 0 || doctors[0].user_id !== user.id) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }
    const doctor = doctors[0];

    const checkin = await findActiveCheckIn(base44, payload.patient_id, doctor.hospital);
    if (!checkin) return gateBlocked();

    // Idempotency: an identical request_id already persisted (replayed/retried
    // submission) is rejected instead of creating a duplicate order.
    if (payload.request_id) {
      try {
        // This function's SDK uses positional filter arguments and returns an array.
        const dupes = await base44.asServiceRole.entities.LabRequest.filter({ request_id: String(payload.request_id) }, "-created_date", 1);
        if (dupes.length > 0) {
          return Response.json({ error: "Duplicate submission — this request was already saved.", duplicate: true }, { status: 409 });
        }
      } catch (e) { console.log("DUPCHECK-ERROR:", e && e.message); }
    }

    // ===== Mandatory professional signature =====
    // A laboratory request is never issued unsigned. The signature must be a
    // record owned by the signed-in doctor; every signer field below is
    // written here, so values sent by the browser are never trusted.
    const signatureId = String(payload.signature_record_id || "").trim();
    if (!signatureId) {
      return Response.json({
        error: "A professional signature is required before this laboratory request can be issued.",
        signature_required: true,
      }, { status: 400 });
    }

    // A signature id identifies one record. The old filter overload treated the
    // options object as a sort value, then discarded the array response as if
    // it were a cursor page, so every valid signature was rejected.
    const signature = await base44.asServiceRole.entities.DoctorSignature.get(signatureId)
      .catch((e) => e.status === 404 ? null : Promise.reject(e));

    if (!signature) {
      return Response.json({ error: "The signature could not be verified. Please sign the request again." }, { status: 403 });
    }
    // A signature image alone never grants signing authority: the record must
    // belong to the authenticated doctor and be their active signature.
    if (signature.user_id !== user.id || signature.status !== "active" || !signature.signature_file_uri) {
      return Response.json({ error: "This signature does not belong to the signed-in doctor." }, { status: 403 });
    }
    if (signature.doctor_id && String(signature.doctor_id) !== String(doctor.id)) {
      return Response.json({ error: "This signature does not belong to the signed-in doctor." }, { status: 403 });
    }

    const signedAt = new Date().toISOString();
    const signatureVersion = Number(signature.version) || 1;
    const signatureSource = ["saved_profile", "drawn_now", "uploaded_now"].indexOf(payload.signature_source) >= 0
      ? payload.signature_source
      : "saved_profile";
    const signatureReference = `SIG-V${signatureVersion}-${String(payload.request_id || signature.id).slice(-4).toUpperCase()}`;

    // Written with the service role — doctors cannot create lab requests
    // directly through the client API (Row Level Security blocks it).
    const lab_request = await base44.asServiceRole.entities.LabRequest.create({
      ...payload,
      signature_status: "signed",
      signature_record_id: signature.id,
      signature_version: signatureVersion,
      signature_reference: signatureReference,
      signature_source: signatureSource,
      signed_by_user_id: user.id,
      signed_by_name: doctor.full_name || signature.doctor_name || "",
      signed_by_license: doctor.license_number || "",
      signed_datetime: signedAt,
      signature_audit: [{
        datetime: signedAt,
        action: "signed",
        action_label: "Professional signature applied",
        actor_user_id: user.id,
        actor_name: doctor.full_name || "",
        detail: `${signatureReference} · ${signatureSource}`,
      }],
    });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: "doctor",
      action: "signed_laboratory_request",
      action_label: "applied their professional signature to a laboratory request",
      patient_id: String(payload.patient_id),
      patient_user_id: "",
      patient_cin: payload.patient_cin || "",
      patient_name: payload.patient_name || "",
      document_id: lab_request.id,
      hospital: doctor.hospital || "",
    });

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: "doctor",
      action: "requested_laboratory_study",
      action_label: "requested a laboratory study",
      patient_id: String(payload.patient_id),
      patient_cin: payload.patient_cin || "",
      patient_name: payload.patient_name || "",
      hospital: doctor.hospital || "",
    });

    return Response.json({ lab_request, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}