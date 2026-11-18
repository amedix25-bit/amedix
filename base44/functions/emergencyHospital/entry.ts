import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  HOSPITAL_QR_ROTATION_SECONDS,
  EMERGENCY_DEPARTMENT,
  signQrToken,
  hospitalWindow,
  writeEmergencyAudit,
  attemptAlertDelivery,
  pageRows,
} from "../../shared/emergencyAccess.ts";

// AMedix hospital Emergency Department QR — the facility's own side.
// The hospital displays a rotating, signed ER QR, receives an immediate alert
// for every scan, reviews the activity, and can revoke its QR or an active
// session. NOTHING here approves, delays or gates a doctor's emergency
// authorization: alerts are monitoring and accountability only.
export default async function (req) {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("emergencyHospital failed", error);
    return Response.json(
      { error: (error && (error as any).message) || "The emergency hospital service could not complete the request." },
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

  const profiles = await sr.entities.HospitalProfile.filter({ user_id: user.id });
  const hospital = profiles[0];
  if (!hospital) {
    return Response.json({ error: "Only a hospital administrator account can manage the Emergency QR." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String((body && body.action) || "");

  const activeCredential = async () => {
    const rows = pageRows(
      await sr.entities.EmergencyQrToken.filter(
        { token_kind: "hospital_er", hospital_id: hospital.id, status: "active" },
        { limit: 5 }
      )
    );
    return rows[0] || null;
  };

  const mintToken = async (credential: any) => {
    const window = hospitalWindow();
    const token = await signQrToken({
      k: "h",
      c: credential.id,
      h: hospital.id,
      w: window.index,
      e: window.ends,
    });
    return { token, expires: new Date(window.ends).toISOString(), window: window.index };
  };

  // ── The hospital portal's Emergency QR Activity view ──────────────────────
  if (action === "activity") {
    const credential = await activeCredential();
    const qr = credential ? await mintToken(credential) : null;

    const [alerts, sessions, audit] = await Promise.all([
      sr.entities.EmergencyAlert
        .filter({ hospital_id: hospital.id }, { sort: "-scanned_datetime", limit: 40 })
        .then(pageRows)
        .catch(() => []),
      sr.entities.EmergencySession
        .filter({ hospital_id: hospital.id, status: "active" }, { sort: "-session_start", limit: 40 })
        .then(pageRows)
        .catch(() => []),
      sr.entities.EmergencyAuditLog
        .filter({ hospital_id: hospital.id }, { sort: "-datetime", limit: 60 })
        .then(pageRows)
        .catch(() => []),
    ]);

    const now = Date.now();
    const live = sessions.filter((s: any) => new Date(s.session_expires || 0).getTime() > now);

    return Response.json({
      hospital_name: hospital.hospital_name || "",
      department: EMERGENCY_DEPARTMENT,
      rotation_seconds: HOSPITAL_QR_ROTATION_SECONDS,
      credential: credential
        ? {
            id: credential.id,
            status: credential.status,
            issued_datetime: credential.issued_datetime || "",
            use_count: credential.use_count || 0,
          }
        : null,
      qr,
      alerts: alerts || [],
      active_sessions: live,
      audit: audit || [],
    });
  }

  // ── Rotating QR token (called by the portal as it refreshes the display) ──
  if (action === "rotate_qr") {
    let credential = await activeCredential();
    if (!credential) {
      credential = await sr.entities.EmergencyQrToken.create({
        token_kind: "hospital_er",
        status: "active",
        hospital_id: hospital.id,
        hospital_user_id: hospital.user_id || user.id,
        hospital_name: hospital.hospital_name || "",
        department: EMERGENCY_DEPARTMENT,
        rotation_seconds: HOSPITAL_QR_ROTATION_SECONDS,
        issued_datetime: new Date().toISOString(),
        issued_by_name: user.full_name || "Hospital administrator",
        use_count: 0,
      });
    }
    const qr = await mintToken(credential);
    return Response.json({ credential_id: credential.id, rotation_seconds: HOSPITAL_QR_ROTATION_SECONDS, qr });
  }

  // ── Revoke the hospital ER QR ─────────────────────────────────────────────
  if (action === "revoke_qr") {
    const credential = await activeCredential();
    if (!credential) return Response.json({ error: "There is no active Emergency QR to revoke." }, { status: 400 });
    const reason = String(body.reason || "").trim() || "Revoked by the hospital.";
    const now = new Date().toISOString();
    await sr.entities.EmergencyQrToken.update(credential.id, {
      status: "revoked",
      revoked_datetime: now,
      revoked_by_name: user.full_name || "Hospital administrator",
      revoke_reason: reason,
    });
    await writeEmergencyAudit(base44, {
      event_type: "qr_revoked",
      pathway: "hospital_er",
      qr_kind: "hospital_er",
      qr_credential_id: credential.id,
      qr_identifier: credential.id,
      hospital_id: hospital.id,
      hospital_user_id: hospital.user_id || "",
      hospital_name: hospital.hospital_name || "",
      department: EMERGENCY_DEPARTMENT,
      authorization_result: "revoked",
      denial_reason: reason,
      detail: `Hospital Emergency Department QR revoked by ${user.full_name || "the hospital administrator"}.`,
    });
    return Response.json({ revoked: true });
  }

  // ── Revoke one active emergency session ───────────────────────────────────
  if (action === "revoke_session") {
    const rows = await sr.entities.EmergencySession.filter({ id: String(body.session_id || "") });
    const session = rows[0];
    if (!session || session.hospital_id !== hospital.id) {
      return Response.json({ error: "That emergency session does not belong to this hospital." }, { status: 403 });
    }
    const reason = String(body.reason || "").trim() || "Revoked by the hospital.";
    const now = new Date().toISOString();
    await sr.entities.EmergencySession.update(session.id, {
      status: "revoked",
      access_status: session.access_status === "granted" ? "revoked" : session.access_status,
      ended_datetime: now,
      ended_reason: reason,
      revoked_by_name: user.full_name || "Hospital administrator",
    });
    try {
      const alerts = pageRows(await sr.entities.EmergencyAlert.filter({ session_id: session.id }, { limit: 5 }));
      if (alerts[0]) {
        await sr.entities.EmergencyAlert.update(alerts[0].id, { authorization_status: "revoked" });
      }
    } catch (e) {
      /* monitoring record only */
    }
    await writeEmergencyAudit(base44, {
      event_type: "session_revoked",
      pathway: session.pathway,
      doctor_user_id: session.doctor_user_id,
      doctor_name: session.doctor_name,
      doctor_license: session.doctor_license,
      hospital_id: hospital.id,
      hospital_user_id: hospital.user_id || "",
      hospital_name: hospital.hospital_name || "",
      department: EMERGENCY_DEPARTMENT,
      patient_id: session.patient_id,
      session_id: session.id,
      session_ref: session.session_ref,
      authorization_result: "revoked",
      denial_reason: reason,
      detail: `Emergency session revoked by ${user.full_name || "the hospital administrator"}.`,
    });
    return Response.json({ revoked: true });
  }

  // ── Retry a failed hospital alert ─────────────────────────────────────────
  if (action === "retry_alert") {
    const rows = await sr.entities.EmergencyAlert.filter({ id: String(body.alert_id || "") });
    const alert = rows[0];
    if (!alert || alert.hospital_user_id !== (hospital.user_id || "")) {
      return Response.json({ error: "That alert does not belong to this hospital." }, { status: 403 });
    }
    const result = await attemptAlertDelivery(base44, alert);
    await writeEmergencyAudit(base44, {
      event_type: "notification_retried",
      pathway: "hospital_er",
      hospital_id: hospital.id,
      hospital_user_id: hospital.user_id || "",
      hospital_name: hospital.hospital_name || "",
      session_id: alert.session_id,
      session_ref: alert.session_ref,
      notification_status: result.ok ? "delivered" : "failed",
      authorization_result: result.ok ? "delivered" : "failed",
      detail: result.ok ? "Alert delivery retried successfully." : `Alert delivery retry failed (${result.error}).`,
    });
    return Response.json({
      delivery_status: result.ok ? "delivered" : "failed",
      error: result.error || "",
    });
  }

  return Response.json({ error: "Unsupported action." }, { status: 400 });
}