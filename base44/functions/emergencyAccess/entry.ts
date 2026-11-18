import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  HOSPITAL_SESSION_MINUTES,
  PATIENT_ACCESS_MINUTES,
  PATIENT_QR_VALID_DAYS,
  EMERGENCY_DEPARTMENT,
  EMERGENCY_REASONS,
  signQrToken,
  readQrToken,
  signScanTicket,
  readScanTicket,
  tokenFingerprint,
  addMinutes,
  newEmergencySessionRef,
  emergencySpecialtyOf,
  evaluateEmergencyDoctor,
  writeEmergencyAudit,
  createEmergencyAlert,
  attemptAlertDelivery,
  scanRateState,
  distinctPatientPattern,
  sessionLive,
  accessLive,
  buildEmergencyBundle,
  notifyPatientOfEmergencyAccess,
  pageRows,
} from "../../shared/emergencyAccess.ts";

// AMedix Emergency QR access — the doctor's side of BOTH pathways.
// Everything is decided here, server-side: the QR credential, the doctor's
// account standing and verified licence, the specialty gate (Pathway A only),
// the session's expiry and its binding to ONE exact patient. The browser only
// carries a signed token or a signed scan ticket — never an authorization.
export default async function (req) {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("emergencyAccess failed", error);
    return Response.json(
      { error: (error && (error as any).message) || "The emergency service could not complete the request." },
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

  const body = await req.json().catch(() => ({}));
  const action = String((body && body.action) || "");

  // ── Patient issuing their own Emergency QR ────────────────────────────────
  if (action === "issue_patient_qr") {
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const patients = await sr.entities.PatientProfile.filter({ user_id: user.id });
    const patient = patients[0];
    if (!patient) return Response.json({ error: "Patient profile not found." }, { status: 404 });

    const rows = pageRows(
      await sr.entities.EmergencyQrToken.filter(
        { token_kind: "patient_emergency", patient_id: patient.id, status: "active" },
        { limit: 5 }
      )
    );
    const live = rows.find(
      (c) => !c.expires_datetime || new Date(c.expires_datetime).getTime() > Date.now()
    );
    let credential = live;
    let freshlyIssued = false;
    if (!credential) {
      freshlyIssued = true;
      credential = await sr.entities.EmergencyQrToken.create({
        token_kind: "patient_emergency",
        status: "active",
        patient_id: patient.id,
        patient_user_id: patient.user_id || user.id,
        patient_cin: patient.cin || "",
        patient_name: patient.full_name || "",
        department: EMERGENCY_DEPARTMENT,
        issued_datetime: new Date().toISOString(),
        issued_by_name: "AMedix Patient Portal",
        expires_datetime: new Date(Date.now() + PATIENT_QR_VALID_DAYS * 86400000).toISOString(),
        use_count: 0,
      });
    }

    const expires = credential.expires_datetime || new Date(Date.now() + PATIENT_QR_VALID_DAYS * 86400000).toISOString();
    const token = await signQrToken({
      k: "p",
      c: credential.id,
      p: patient.id,
      e: new Date(expires).getTime(),
    });

    // One audit entry when a credential is genuinely created — not every time
    // the patient simply opens their health card.
    if (freshlyIssued) {
      await writeEmergencyAudit(base44, {
        event_type: "patient_qr_issued",
        pathway: "patient_qr",
        qr_kind: "patient_emergency",
        qr_credential_id: credential.id,
        qr_identifier: credential.id,
        patient_id: patient.id,
        patient_user_id: patient.user_id || user.id,
        patient_cin: patient.cin || "",
        patient_name: patient.full_name || "",
        authorization_result: "granted",
        detail: "Patient Emergency QR credential issued for the health card.",
      });
    }

    return Response.json({ token, expires, cin: patient.cin || "" });
  }

  // Every remaining action is a doctor action.
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // ── Pathway A: scanning the patient's Emergency QR ────────────────────────
  if (action === "patient_qr_scan") {
    const rate = await scanRateState(base44, user.id);
    if (rate.limited) {
      await writeEmergencyAudit(base44, {
        event_type: "rate_limited",
        pathway: "patient_qr",
        doctor_user_id: user.id,
        authorization_result: "denied",
        denial_reason: "Too many emergency QR scans in a short window.",
        detail: `${rate.scans} scans within the rate-limit window.`,
      });
      return Response.json(
        { error: "Too many emergency QR scans in a short time. Wait a moment and scan again." },
        { status: 429 }
      );
    }

    // The Patient Portal shows ONE QR code. It carries the patient's CIN, and
    // any verified doctor may scan it to identify the patient and then choose
    // the emergency or the appointment pathway. A signed emergency credential
    // (printed cards) is still accepted and resolves to the same patient.
    const rawValue = String(body.token || body.cin || "").trim();
    const cinValue = /^[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$/.test(rawValue.toUpperCase())
      ? rawValue.toUpperCase()
      : "";

    let credential: any = null;
    let patient: any = null;

    if (cinValue) {
      const rows = await sr.entities.PatientProfile.filter({ cin: cinValue });
      patient = rows[0] || null;
      if (!patient) {
        await writeEmergencyAudit(base44, {
          event_type: "patient_qr_scan",
          pathway: "patient_qr",
          doctor_user_id: user.id,
          authorization_result: "denied",
          denial_reason: "The scanned patient QR did not match an AMedix patient record.",
        });
        return Response.json({ error: "This AMedix patient QR could not be matched to a patient record." }, { status: 404 });
      }
    } else {
      const payload = await readQrToken(body.token);
      if (!payload || payload.k !== "p" || !payload.c) {
        await writeEmergencyAudit(base44, {
          event_type: "patient_qr_scan",
          pathway: "patient_qr",
          doctor_user_id: user.id,
          authorization_result: "denied",
          denial_reason: "The QR code is not a valid patient QR.",
        });
        return Response.json(
          { error: "This is not a valid AMedix patient QR, or it has expired. Ask the patient to show their AMedix health card again." },
          { status: 400 }
        );
      }

      const creds = await sr.entities.EmergencyQrToken.filter({ id: payload.c });
      credential = creds[0];
      if (!credential || credential.token_kind !== "patient_emergency" || credential.status !== "active") {
        await writeEmergencyAudit(base44, {
          event_type: "patient_qr_scan",
          pathway: "patient_qr",
          qr_credential_id: payload.c,
          doctor_user_id: user.id,
          authorization_result: "denied",
          denial_reason: "The patient Emergency QR is revoked or no longer active.",
        });
        return Response.json({ error: "This Emergency QR is no longer active (revoked or replaced)." }, { status: 403 });
      }
      if (credential.expires_datetime && new Date(credential.expires_datetime).getTime() < Date.now()) {
        await writeEmergencyAudit(base44, {
          event_type: "patient_qr_scan",
          pathway: "patient_qr",
          qr_credential_id: credential.id,
          doctor_user_id: user.id,
          authorization_result: "denied",
          denial_reason: "The patient Emergency QR has expired.",
        });
        return Response.json({ error: "This Emergency QR has expired. Ask the patient to refresh it." }, { status: 403 });
      }

      const patients = await sr.entities.PatientProfile.filter({ id: credential.patient_id });
      patient = patients[0];
      if (!patient) {
        return Response.json({ error: "The patient record behind this QR could not be resolved." }, { status: 404 });
      }
      // Binding check: the credential must still belong to this exact account.
      if (credential.patient_user_id && patient.user_id && credential.patient_user_id !== patient.user_id) {
        await writeEmergencyAudit(base44, {
          event_type: "patient_qr_scan",
          pathway: "patient_qr",
          qr_credential_id: credential.id,
          doctor_user_id: user.id,
          patient_id: patient.id,
          authorization_result: "denied",
          denial_reason: "The QR credential is not bound to this patient account.",
        });
        return Response.json({ error: "This Emergency QR could not be verified." }, { status: 403 });
      }
    }

    const doctor = await evaluateEmergencyDoctor(base44, user.id);
    if (!doctor.ok) {
      await writeEmergencyAudit(base44, {
        event_type: "patient_qr_scan",
        pathway: "patient_qr",
        qr_credential_id: credential ? credential.id : "",
        qr_kind: "patient_emergency",
        doctor_user_id: user.id,
        patient_id: patient.id,
        patient_cin: patient.cin || "",
        authorization_result: "denied",
        denial_reason: doctor.reason,
      });
      return Response.json({ error: doctor.reason, denial_reason: doctor.reason }, { status: 403 });
    }

    // A live hospital ER authorization removes the specialty restriction for
    // that encounter — the hospital pathway already established eligibility.
    let parentSession = null;
    if (body.session_id) {
      const rows = await sr.entities.EmergencySession.filter({ id: String(body.session_id) });
      const candidate = rows[0];
      if (
        candidate &&
        candidate.doctor_user_id === user.id &&
        candidate.pathway === "hospital_er" &&
        sessionLive(candidate)
      ) {
        parentSession = candidate;
      }
    }

    // Scanning identifies the patient for ANY verified doctor, but emergency
    // access stays restricted to Emergency Medicine and Trauma Surgery doctors,
    // and to any doctor inside a live hospital ER authorization. Every other
    // doctor is offered the ordinary appointment pathway instead.
    const emergencyEligible = !!parentSession || !!doctor.emergencySpecialty;

    const ticket = await signScanTicket({
      d: user.id,
      p: patient.id,
      s: parentSession ? parentSession.id : "",
      e: Date.now() + 5 * 60000,
    });

    await writeEmergencyAudit(base44, {
      event_type: "patient_qr_scan",
      pathway: parentSession ? "hospital_er" : "patient_qr",
      qr_kind: "patient_emergency",
      qr_credential_id: credential ? credential.id : "",
      qr_identifier: credential ? credential.id : cinValue,
      qr_token_fingerprint: credential ? await tokenFingerprint(body.token) : "",
      doctor_user_id: user.id,
      doctor_id: doctor.doctor.id,
      doctor_name: doctor.doctor.full_name || "",
      doctor_license: doctor.licence,
      doctor_specialty: doctor.primarySpecialty,
      hospital_id: parentSession ? parentSession.hospital_id : "",
      hospital_user_id: parentSession ? parentSession.hospital_user_id : "",
      hospital_name: parentSession ? parentSession.hospital_name : "",
      department: EMERGENCY_DEPARTMENT,
      patient_id: patient.id,
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
      session_id: parentSession ? parentSession.id : "",
      session_ref: parentSession ? parentSession.session_ref : "",
      authorization_result: "granted",
      detail: emergencyEligible
        ? parentSession
          ? "Patient QR scanned under a live hospital ER authorization."
          : "Patient QR scanned by an eligible emergency specialty doctor."
        : "Patient QR scanned for identification only; emergency access not available to this specialty.",
    });

    return Response.json({
      scan_ticket: ticket,
      pathway: parentSession ? "hospital_er" : "patient_qr",
      emergency_eligible: emergencyEligible,
      patient: {
        name: patient.full_name || "",
        cin: patient.cin || "",
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "",
      },
      options: emergencyEligible
        ? [
            { key: "emergency", label: "EMERGENCY ACCESS" },
            { key: "regular", label: "REGULAR APPOINTMENT" },
          ]
        : [{ key: "regular", label: "REGULAR APPOINTMENT" }],
    });
  }

  // ── Pathway B: scanning the hospital Emergency Department QR ──────────────
  if (action === "hospital_qr_scan") {
    const rate = await scanRateState(base44, user.id);
    if (rate.limited) {
      await writeEmergencyAudit(base44, {
        event_type: "rate_limited",
        pathway: "hospital_er",
        doctor_user_id: user.id,
        authorization_result: "denied",
        denial_reason: "Too many emergency QR scans in a short window.",
        suspicious: true,
      });
      return Response.json({ error: "Too many emergency QR scans in a short time. Wait a moment and scan again." }, { status: 429 });
    }

    const payload = await readQrToken(body.token);
    if (!payload || payload.k !== "h" || !payload.c) {
      await writeEmergencyAudit(base44, {
        event_type: "hospital_qr_scan",
        pathway: "hospital_er",
        doctor_user_id: user.id,
        authorization_result: "denied",
        denial_reason: "The QR code is not a valid, current hospital Emergency Department QR.",
      });
      return Response.json(
        { error: "This is not a valid hospital Emergency Department QR, or its rotation window has expired. Scan the code currently shown in the department." },
        { status: 400 }
      );
    }

    const creds = await sr.entities.EmergencyQrToken.filter({ id: payload.c });
    const credential = creds[0];
    if (!credential || credential.token_kind !== "hospital_er" || credential.status !== "active") {
      await writeEmergencyAudit(base44, {
        event_type: "hospital_qr_scan",
        pathway: "hospital_er",
        qr_credential_id: payload.c,
        doctor_user_id: user.id,
        authorization_result: "denied",
        denial_reason: "The hospital Emergency Department QR is revoked or inactive.",
      });
      return Response.json({ error: "This hospital Emergency Department QR is revoked or inactive." }, { status: 403 });
    }
    if (String(payload.h || "") !== String(credential.hospital_id || "")) {
      await writeEmergencyAudit(base44, {
        event_type: "hospital_qr_scan",
        pathway: "hospital_er",
        qr_credential_id: credential.id,
        doctor_user_id: user.id,
        authorization_result: "denied",
        denial_reason: "The QR token does not match its hospital credential.",
        suspicious: true,
      });
      return Response.json({ error: "This hospital QR could not be verified." }, { status: 403 });
    }

    const hospitals = await sr.entities.HospitalProfile.filter({ id: credential.hospital_id });
    const hospital = hospitals[0];
    if (!hospital || hospital.status === "suspended") {
      await writeEmergencyAudit(base44, {
        event_type: "hospital_qr_scan",
        pathway: "hospital_er",
        qr_credential_id: credential.id,
        hospital_id: credential.hospital_id,
        doctor_user_id: user.id,
        authorization_result: "denied",
        denial_reason: "The hospital account is not active.",
      });
      return Response.json({ error: "This hospital's emergency pathway is not active." }, { status: 403 });
    }

    const doctor = await evaluateEmergencyDoctor(base44, user.id);
    if (!doctor.ok) {
      await writeEmergencyAudit(base44, {
        event_type: "hospital_qr_scan",
        pathway: "hospital_er",
        qr_credential_id: credential.id,
        hospital_id: hospital.id,
        hospital_user_id: hospital.user_id || "",
        hospital_name: hospital.hospital_name || "",
        doctor_user_id: user.id,
        authorization_result: "denied",
        denial_reason: doctor.reason,
      });
      return Response.json({ error: doctor.reason, denial_reason: doctor.reason }, { status: 403 });
    }

    const now = new Date();
    const session = await sr.entities.EmergencySession.create({
      session_ref: newEmergencySessionRef(),
      pathway: "hospital_er",
      status: "active",
      doctor_user_id: user.id,
      doctor_id: doctor.doctor.id,
      doctor_name: doctor.doctor.full_name || "",
      doctor_email: (doctor.user && doctor.user.email) || "",
      doctor_license: doctor.licence,
      doctor_specialty: doctor.primarySpecialty,
      doctor_specialties: doctor.specialties,
      hospital_id: hospital.id,
      hospital_user_id: hospital.user_id || "",
      hospital_name: hospital.hospital_name || "",
      department: EMERGENCY_DEPARTMENT,
      qr_credential_id: credential.id,
      qr_token_fingerprint: await tokenFingerprint(body.token),
      qr_token_window: String(payload.w || ""),
      authorization_result: "granted",
      session_start: now.toISOString(),
      session_expires: addMinutes(HOSPITAL_SESSION_MINUTES, now.getTime()),
      parent_session_id: "",
      patient_id: "",
      access_status: "none",
      immediate_confirmed: false,
      data_categories: [],
      patient_notification_status: "not_required",
      suspicious_flags: [],
    });

    // IMMEDIATE hospital notification — monitoring only, never an approval gate.
    const alert = await createEmergencyAlert(base44, {
      hospital_id: hospital.id,
      hospital_user_id: hospital.user_id || "",
      hospital_name: hospital.hospital_name || "",
      session_id: session.id,
      session_ref: session.session_ref,
      doctor_user_id: user.id,
      doctor_id: doctor.doctor.id,
      doctor_name: doctor.doctor.full_name || "",
      doctor_license: doctor.licence,
      doctor_specialty: doctor.primarySpecialty,
      scanned_datetime: now.toISOString(),
      session_expires: session.session_expires,
    });

    await writeEmergencyAudit(base44, {
      event_type: "hospital_qr_scan",
      pathway: "hospital_er",
      qr_kind: "hospital_er",
      qr_credential_id: credential.id,
      qr_identifier: `${credential.id}:${payload.w || ""}`,
      qr_token_fingerprint: await tokenFingerprint(body.token),
      doctor_user_id: user.id,
      doctor_id: doctor.doctor.id,
      doctor_name: doctor.doctor.full_name || "",
      doctor_license: doctor.licence,
      doctor_specialty: doctor.primarySpecialty,
      hospital_id: hospital.id,
      hospital_user_id: hospital.user_id || "",
      hospital_name: hospital.hospital_name || "",
      department: EMERGENCY_DEPARTMENT,
      session_id: session.id,
      session_ref: session.session_ref,
      session_start: session.session_start,
      session_expires: session.session_expires,
      authorization_result: "granted",
      notification_status: alert.delivery_status,
      detail:
        alert.delivery_status === "delivered"
          ? "Temporary hospital emergency authorization granted; hospital portal alerted."
          : `Temporary hospital emergency authorization granted; hospital alert delivery FAILED (${alert.error || "unknown"}).`,
    });

    try {
      await sr.entities.EmergencyQrToken.update(credential.id, {
        last_used_datetime: now.toISOString(),
        use_count: Number(credential.use_count || 0) + 1,
      });
    } catch (e) {
      /* usage metering only */
    }

    return Response.json({
      session_id: session.id,
      session_ref: session.session_ref,
      hospital_name: hospital.hospital_name || "",
      department: EMERGENCY_DEPARTMENT,
      session_expires: session.session_expires,
      notification_status: alert.delivery_status,
      message: "Emergency authorization granted. You may now initiate patient-specific emergency access.",
    });
  }

  // ── Patient-specific emergency access (both pathways) ─────────────────────
  if (action === "initiate_access") {
    const ticket = await readScanTicket(body.scan_ticket);
    if (!ticket || ticket.d !== user.id) {
      return Response.json(
        { error: "The patient QR validation has expired. Scan the patient's Emergency QR again." },
        { status: 403 }
      );
    }

    const reason = String(body.reason || "").trim();
    const justification = String(body.justification || "").trim();
    // The doctor's own confirmation of who they are treating, typed or dictated
    // at the bedside. Recorded as-is; it never replaces the record's name.
    const confirmedPatientName = String(body.patient_name || "").trim().slice(0, 120);
    if (!reason || !EMERGENCY_REASONS.includes(reason)) {
      return Response.json({ error: "Select a valid emergency reason." }, { status: 400 });
    }
    if (justification.length < 3) {
      return Response.json({ error: "Give a brief clinical justification (at least 3 characters)." }, { status: 400 });
    }
    if (body.confirmed !== true) {
      return Response.json({ error: "Confirm that this request is for immediate emergency care." }, { status: 400 });
    }

    // Licence and account standing are re-checked at the moment of access.
    const doctor = await evaluateEmergencyDoctor(base44, user.id);
    if (!doctor.ok) {
      return Response.json({ error: doctor.reason, denial_reason: doctor.reason }, { status: 403 });
    }

    const patients = await sr.entities.PatientProfile.filter({ id: ticket.p });
    const patient = patients[0];
    if (!patient) return Response.json({ error: "Patient not found." }, { status: 404 });

    let parent = null;
    if (ticket.s) {
      const rows = await sr.entities.EmergencySession.filter({ id: ticket.s });
      parent = rows[0];
      if (!parent || parent.doctor_user_id !== user.id || parent.pathway !== "hospital_er" || !sessionLive(parent)) {
        return Response.json(
          {
            error:
              "Your hospital emergency authorization has expired or does not belong to you. Scan the hospital Emergency Department QR again.",
          },
          { status: 403 }
        );
      }
    }
    if (!parent && !doctor.emergencySpecialty) {
      return Response.json(
        {
          error:
            "Emergency access is limited to Emergency Medicine and Trauma Surgery doctors, or to a doctor inside a live hospital Emergency Department authorization. Use the regular appointment pathway, or scan the hospital Emergency Department QR first.",
        },
        { status: 403 }
      );
    }

    const now = Date.now();
    const accessExpiry = parent
      ? Math.min(now + PATIENT_ACCESS_MINUTES * 60000, new Date(parent.session_expires).getTime())
      : now + PATIENT_ACCESS_MINUTES * 60000;

    const session = await sr.entities.EmergencySession.create({
      session_ref: newEmergencySessionRef(),
      pathway: parent ? "hospital_er" : "patient_qr",
      status: "active",
      doctor_user_id: user.id,
      doctor_id: doctor.doctor.id,
      doctor_name: doctor.doctor.full_name || "",
      doctor_email: (doctor.user && doctor.user.email) || "",
      doctor_license: doctor.licence,
      doctor_specialty: doctor.primarySpecialty,
      doctor_specialties: doctor.specialties,
      hospital_id: parent ? parent.hospital_id : "",
      hospital_user_id: parent ? parent.hospital_user_id : "",
      hospital_name: parent ? parent.hospital_name : "",
      department: EMERGENCY_DEPARTMENT,
      qr_credential_id: parent ? parent.qr_credential_id : "",
      qr_token_fingerprint: parent ? parent.qr_token_fingerprint : "",
      authorization_result: "granted",
      session_start: new Date(now).toISOString(),
      session_expires: new Date(accessExpiry).toISOString(),
      parent_session_id: parent ? parent.id : "",
      patient_id: patient.id,
      patient_user_id: patient.user_id || "",
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
      confirmed_patient_name: confirmedPatientName,
      access_status: "granted",
      access_start: new Date(now).toISOString(),
      access_expires: new Date(accessExpiry).toISOString(),
      emergency_reason: reason,
      justification,
      immediate_confirmed: true,
      patient_notification_status: "pending",
      suspicious_flags: [],
    });

    const bundle = await buildEmergencyBundle(base44, patient);

    const pattern = await distinctPatientPattern(base44, user.id, patient.id);
    const suspicious = pattern.flagged ? ["Repeated emergency access to different patients within one hour."] : [];

    const when = new Date(now);
    const whenLabel = `${when.toISOString().slice(0, 10)} ${when.toISOString().slice(11, 16)} UTC`;
    const notice = await notifyPatientOfEmergencyAccess(base44, {
      patient_id: patient.id,
      patient_user_id: patient.user_id || "",
      doctor_name: doctor.doctor.full_name || "A verified doctor",
      doctor_specialty: doctor.primarySpecialty,
      hospital_name: parent ? parent.hospital_name : "",
      when_label: whenLabel,
      reason,
    });

    try {
      await sr.entities.EmergencySession.update(session.id, {
        data_categories: bundle.categories,
        patient_notification_status: notice.status,
        patient_notification_error: notice.error || "",
        suspicious_flags: suspicious,
      });
    } catch (e) {
      /* the audit record below still carries the outcome */
    }

    if (parent) {
      try {
        const alerts = pageRows(await sr.entities.EmergencyAlert.filter({ session_id: parent.id }, { limit: 5 }));
        const alert = alerts[0];
        if (alert) {
          await sr.entities.EmergencyAlert.update(alert.id, {
            patient_access_initiated: true,
            patient_access_datetime: new Date(now).toISOString(),
            patient_access_count: Number(alert.patient_access_count || 0) + 1,
          });
        }
      } catch (e) {
        /* the hospital alert is monitoring only */
      }
    }

    await writeEmergencyAudit(base44, {
      event_type: "access_granted",
      pathway: parent ? "hospital_er" : "patient_qr",
      qr_kind: parent ? "hospital_er" : "patient_emergency",
      qr_credential_id: session.qr_credential_id || "",
      qr_identifier: session.qr_credential_id || "",
      doctor_user_id: user.id,
      doctor_id: doctor.doctor.id,
      doctor_name: doctor.doctor.full_name || "",
      doctor_license: doctor.licence,
      doctor_specialty: doctor.primarySpecialty,
      hospital_id: session.hospital_id,
      hospital_user_id: session.hospital_user_id,
      hospital_name: session.hospital_name,
      department: EMERGENCY_DEPARTMENT,
      patient_id: patient.id,
      patient_cin: patient.cin || "",
      patient_name: patient.full_name || "",
      authorization_result: "granted",
      emergency_reason: reason,
      justification,
      data_categories: bundle.categories,
      session_id: session.id,
      session_ref: session.session_ref,
      session_start: session.session_start,
      session_expires: session.session_expires,
      notification_status: notice.status,
      suspicious: pattern.flagged,
      detail: "Patient-specific emergency access granted for the minimum necessary information.",
    });

    if (pattern.flagged) {
      await writeEmergencyAudit(base44, {
        event_type: "suspicious_activity",
        pathway: parent ? "hospital_er" : "patient_qr",
        doctor_user_id: user.id,
        doctor_name: doctor.doctor.full_name || "",
        doctor_license: doctor.licence,
        hospital_id: session.hospital_id,
        hospital_user_id: session.hospital_user_id,
        hospital_name: session.hospital_name,
        patient_id: patient.id,
        session_id: session.id,
        session_ref: session.session_ref,
        authorization_result: "granted",
        suspicious: true,
        detail: `Emergency access to ${pattern.distinctPatients} different patients within one hour. Flagged for review; care was not delayed.`,
      });
    }

    if (notice.status === "failed") {
      await writeEmergencyAudit(base44, {
        event_type: "notification_failed",
        pathway: session.pathway,
        doctor_user_id: user.id,
        patient_id: patient.id,
        session_id: session.id,
        session_ref: session.session_ref,
        notification_status: "failed",
        denial_reason: "",
        detail: notice.error || "Patient notification could not be delivered.",
      });
    }

    return Response.json({
      session_id: session.id,
      session_ref: session.session_ref,
      access_start: session.access_start,
      access_expires: session.access_expires,
      session_expires: session.session_expires,
      notification_status: notice.status,
      suspicious_flags: suspicious,
      bundle,
    });
  }

  // ── Re-reading the record inside an authorized session ────────────────────
  if (action === "session_bundle" || action === "end_session") {
    const rows = await sr.entities.EmergencySession.filter({ id: String(body.session_id || "") });
    const session = rows[0];
    if (!session || session.doctor_user_id !== user.id) {
      return Response.json({ error: "This emergency session could not be found for your account." }, { status: 403 });
    }

    if (action === "end_session") {
      const ended = new Date().toISOString();
      try {
        await sr.entities.EmergencySession.update(session.id, {
          status: "revoked",
          access_status: "revoked",
          ended_datetime: ended,
          ended_reason: "Ended by the doctor.",
        });
      } catch (e) {
        /* audit still records the intent */
      }
      await writeEmergencyAudit(base44, {
        event_type: "session_ended",
        pathway: session.pathway,
        doctor_user_id: user.id,
        doctor_name: session.doctor_name,
        hospital_user_id: session.hospital_user_id,
        hospital_name: session.hospital_name,
        patient_id: session.patient_id,
        session_id: session.id,
        session_ref: session.session_ref,
        authorization_result: "ended",
        detail: "The doctor ended the emergency access session.",
      });
      return Response.json({ ended: true });
    }

    if (!accessLive(session)) {
      if (session.status === "active") {
        try {
          await sr.entities.EmergencySession.update(session.id, {
            status: "expired",
            access_status: session.access_status === "granted" ? "expired" : session.access_status,
            ended_datetime: new Date().toISOString(),
            ended_reason: "Expired.",
          });
        } catch (e) {
          /* expiry is still enforced by the check above */
        }
      }
      return Response.json({ error: "This emergency access has expired or been revoked. Re-authorize to continue.", expired: true }, { status: 403 });
    }

    const doctor = await evaluateEmergencyDoctor(base44, user.id);
    if (!doctor.ok) return Response.json({ error: doctor.reason }, { status: 403 });

    const patients = await sr.entities.PatientProfile.filter({ id: session.patient_id });
    const patient = patients[0];
    if (!patient) return Response.json({ error: "Patient not found." }, { status: 404 });

    const bundle = await buildEmergencyBundle(base44, patient);
    return Response.json({
      session_id: session.id,
      session_ref: session.session_ref,
      access_start: session.access_start,
      access_expires: session.access_expires,
      session_expires: session.session_expires,
      bundle,
    });
  }

  return Response.json({ error: "Unsupported action." }, { status: 400 });
}