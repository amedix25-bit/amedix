import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Resolves a scanned AMedix patient QR code to the ONE patient it belongs to.
//
// Two code kinds are accepted, and nothing else:
//   • a medical-card link carrying the card's 32-byte verification token
//     (…/verify-card?token=<64 hex>) — the code printed on the AMedix card;
//   • a bare Clinical Identification Number, the legacy patient QR payload.
//
// This endpoint identifies the patient only. It never reads or returns a
// diagnosis, an allergy, a medication or a document, and it never grants
// access: clinical data still requires the patient's own authorization, which
// the existing access-request flow enforces after this lookup. Every attempt,
// successful or not, is written to the clinical audit log.

const CIN_PATTERN = /[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}/;
const TOKEN_PATTERN = /[a-f0-9]{64}/i;

const MESSAGES = {
  invalid_code:
    "This is not a valid AMedix patient QR code. Ask the patient to open their AMedix Medical Card and show its QR code, then scan again.",
  card_not_found:
    "This card could not be verified. It may have been replaced by a newer AMedix Medical Card.",
  card_revoked:
    "This medical card has been revoked, so it can no longer be used to identify the patient.",
  card_expired:
    "This medical card has expired. Ask the patient to open their current AMedix Medical Card.",
  patient_not_found: "No patient record matches this QR code.",
  not_staff: "Only a verified doctor or radiologist can scan patient cards.",
  empty: "No QR code was read. Hold the card steady inside the frame and try again.",
};

function effectiveStatus(card) {
  if (card.status === "revoked") return "revoked";
  if (card.expires_datetime && new Date(card.expires_datetime).getTime() < Date.now()) return "expired";
  return "active";
}

function scannedCin(value) {
  const match = String(value || "").trim().toUpperCase().match(CIN_PATTERN);
  return match ? match[0] : "";
}

function scannedToken(value) {
  const raw = String(value || "").trim();
  const fromQuery = raw.match(/[?&]token=([A-Za-z0-9_-]+)/);
  if (fromQuery) {
    const candidate = fromQuery[1].toLowerCase();
    return TOKEN_PATTERN.test(candidate) ? candidate : "";
  }
  return TOKEN_PATTERN.test(raw) ? raw.toLowerCase() : "";
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ ok: false, reason: "unauthorized", message: "Please sign in again." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const value = String(body.value || "").slice(0, 500).trim();
    if (!value) return Response.json({ ok: false, reason: "empty", message: MESSAGES.empty }, { status: 400 });

    // Only clinical staff may resolve a card to a patient.
    const [doctorPage, radiologistPage] = await Promise.all([
      base44.asServiceRole.entities.DoctorProfile.filter({ user_id: user.id }, { limit: 1 }).catch(() => ({ items: [] })),
      base44.asServiceRole.entities.RadiologistProfile.filter({ user_id: user.id }, { limit: 1 }).catch(() => ({ items: [] })),
    ]);
    const doctor = doctorPage.items?.[0] || null;
    const radiologist = radiologistPage.items?.[0] || null;
    const isAdmin = user.role === "admin";
    if (!doctor && !radiologist && !isAdmin) {
      return Response.json({ ok: false, reason: "not_staff", message: MESSAGES.not_staff }, { status: 403 });
    }

    const actor = {
      actor_user_id: user.id,
      actor_name: doctor?.full_name || radiologist?.full_name || user.full_name || user.email || "Staff",
      actor_role: doctor ? "doctor" : radiologist ? "radiologist" : "admin",
      datetime: new Date().toISOString(),
    };

    const audit = async (action, actionLabel, patient) => {
      await base44.asServiceRole.entities.ClinicalAuditLog.create({
        ...actor,
        action,
        action_label: actionLabel,
        patient_id: patient?.id || "",
        patient_user_id: patient?.user_id || "",
        patient_cin: patient?.cin || "",
        patient_name: patient?.full_name || "",
      }).catch(() => null);
    };

    const fail = async (reason, status = 200, patient = null) => {
      await audit(`qr_scan_failed_${reason}`, `QR scan failed (${reason})`, patient);
      return Response.json({ ok: false, reason, message: MESSAGES[reason] || MESSAGES.invalid_code }, { status });
    };

    const token = scannedToken(value);

    if (token) {
      const cards = await base44.asServiceRole.entities.MedicalCard.filter(
        { verification_token: token },
        { sort: "-created_date", limit: 1 }
      );
      const card = cards.items?.[0] || null;
      if (!card) return await fail("card_not_found");

      const status = effectiveStatus(card);
      if (status === "revoked") return await fail("card_revoked");
      if (status === "expired") return await fail("card_expired");

      const profiles = await base44.asServiceRole.entities.PatientProfile.filter({ cin: card.patient_cin }, { limit: 1 });
      const patient = profiles.items?.[0] || null;
      if (!patient) return await fail("patient_not_found");

      const scannedAt = actor.datetime;
      const cardAudit = Array.isArray(card.audit) ? card.audit : [];
      await base44.asServiceRole.entities.MedicalCard.update(card.id, {
        verify_count: (card.verify_count || 0) + 1,
        last_verified_datetime: scannedAt,
        audit: [...cardAudit.slice(-40), {
          datetime: scannedAt,
          action: "scanned",
          actor_name: actor.actor_name,
          actor_role: actor.actor_role,
          detail: "Card scanned in the Doctor Portal",
        }],
      }).catch(() => null);

      await audit("qr_scan_success", "scanned the patient's medical card", patient);

      return Response.json({
        ok: true,
        source: "card",
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        patient_name_ar: patient.full_name_ar || "",
        card_number: card.card_number,
        card_status: status,
      });
    }

    const cin = scannedCin(value);
    if (cin) {
      const profiles = await base44.asServiceRole.entities.PatientProfile.filter({ cin }, { limit: 1 });
      const patient = profiles.items?.[0] || null;
      if (!patient) return await fail("patient_not_found");
      await audit("qr_scan_success", "scanned the patient's QR code", patient);
      return Response.json({
        ok: true,
        source: "cin",
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        patient_name_ar: patient.full_name_ar || "",
        card_number: "",
        card_status: "",
      });
    }

    return await fail("invalid_code");
  } catch (error) {
    return Response.json({ ok: false, reason: "error", message: "The QR code could not be verified. Please try again." }, { status: 500 });
  }
}