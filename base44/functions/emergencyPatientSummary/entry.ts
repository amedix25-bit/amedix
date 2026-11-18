import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { evaluateEmergencyDoctor, accessLive, writeEmergencyAudit } from "../../shared/emergencyAccess.ts";
import { buildEmergencyPatientSummary } from "../../shared/emergencyPatientSummary.ts";

// The Emergency Patient Summary for ONE live, patient-bound emergency session.
// Every request is resolved server-side from the session record — the browser
// never names the patient, so a URL, a payload or a second tab can never point
// the summary at a different patient. Each opening is written to the immutable
// emergency audit log.
export default async function (req) {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("emergencyPatientSummary failed", error);
    return Response.json(
      { error: (error && (error as any).message) || "The emergency summary could not be assembled." },
      { status: 500 }
    );
  }
}

async function handleRequest(req: Request) {
  const base44 = createClientFromRequest(req);
  const sr = base44.asServiceRole;

  let user = null;
  try {
    user = await base44.auth.me();
  } catch (e) {
    user = null;
  }
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sessionId = String((body && body.session_id) || "").trim();
  if (!sessionId) return Response.json({ error: "An emergency session is required." }, { status: 400 });

  const rows = await sr.entities.EmergencySession.filter({ id: sessionId });
  const session = rows[0];
  if (!session || session.doctor_user_id !== user.id) {
    return Response.json({ error: "This emergency session could not be found for your account." }, { status: 403 });
  }

  if (!accessLive(session)) {
    return Response.json(
      { error: "This emergency access has expired or been revoked. Re-authorize to continue.", expired: true },
      { status: 403 }
    );
  }

  // Licence and account standing are re-checked on every read of the summary.
  const doctor = await evaluateEmergencyDoctor(base44, user.id);
  if (!doctor.ok) return Response.json({ error: doctor.reason }, { status: 403 });

  // The patient comes from the session — never from the request body.
  const patients = await sr.entities.PatientProfile.filter({ id: session.patient_id });
  const patient = patients[0];
  if (!patient) return Response.json({ error: "Patient not found." }, { status: 404 });

  const summary = await buildEmergencyPatientSummary(base44, patient, session);

  await writeEmergencyAudit(base44, {
    event_type: "access_granted",
    pathway: session.pathway,
    qr_kind: session.pathway === "hospital_er" ? "hospital_er" : "patient_emergency",
    qr_credential_id: session.qr_credential_id || "",
    qr_identifier: session.qr_credential_id || "",
    doctor_user_id: user.id,
    doctor_id: session.doctor_id,
    doctor_name: session.doctor_name,
    doctor_license: session.doctor_license,
    doctor_specialty: session.doctor_specialty,
    hospital_id: session.hospital_id,
    hospital_user_id: session.hospital_user_id,
    hospital_name: session.hospital_name,
    department: session.department,
    patient_id: patient.id,
    patient_cin: patient.cin || "",
    patient_name: patient.full_name || "",
    authorization_result: "granted",
    emergency_reason: session.emergency_reason,
    justification: session.justification,
    data_categories: session.data_categories || [],
    session_id: session.id,
    session_ref: session.session_ref,
    session_start: session.access_start,
    session_expires: session.access_expires,
    detail: `Emergency Patient Summary assembled and opened (${summary.sections.length} sections, PS-CA mapping).`,
  });

  return Response.json({
    session_id: session.id,
    session_ref: session.session_ref,
    access_start: session.access_start,
    access_expires: session.access_expires,
    summary,
  });
}