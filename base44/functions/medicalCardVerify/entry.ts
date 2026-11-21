import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Public QR verification for an AMedix digital medical card.
//
// The only credential is the card's own 32-byte random token, so a scan can
// confirm the card's CURRENT status without an account and without ever
// exposing clinical data. Nothing here reads a diagnosis, an allergy, a
// medication or a document — and the token is never the CIN.

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

function effectiveStatus(card) {
  if (card.status === "revoked") return "revoked";
  if (card.expires_datetime && new Date(card.expires_datetime).getTime() < Date.now()) return "expired";
  return "active";
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "").trim().toLowerCase();
    if (!TOKEN_PATTERN.test(token)) {
      return Response.json({ found: false, reason: "invalid_token" }, { status: 400 });
    }

    const page = await base44.asServiceRole.entities.MedicalCard.filter(
      { verification_token: token },
      { sort: "-created_date", limit: 1 }
    );
    const card = page.items?.[0] || null;
    if (!card) return Response.json({ found: false, reason: "not_found" });

    // Record the scan for the patient's own card history. A failure here must
    // never stop a verification from being answered.
    const scannedAt = new Date().toISOString();
    const audit = Array.isArray(card.audit) ? card.audit : [];
    const lastScan = audit.filter((entry) => entry.action === "scanned").slice(-1)[0];
    const recent = lastScan && Date.now() - new Date(lastScan.datetime).getTime() < 3000;
    if (!recent) {
      await base44.asServiceRole.entities.MedicalCard.update(card.id, {
        verify_count: (card.verify_count || 0) + 1,
        last_verified_datetime: scannedAt,
        audit: [...audit.slice(-40), {
          datetime: scannedAt,
          action: "scanned",
          actor_name: "QR verification",
          actor_role: "system",
          detail: "Card scanned against the verification page",
        }],
      }).catch(() => null);
    }

    return Response.json({
      found: true,
      status: effectiveStatus(card),
      card_number: card.card_number,
      patient_name: card.patient_name,
      patient_name_ar: card.patient_name_ar || "",
      patient_cin: card.patient_cin,
      issued_datetime: card.issued_datetime || card.created_date,
      expires_datetime: card.expires_datetime || null,
      revoked_datetime: card.revoked_datetime || null,
      clinical_access: "requires_patient_authorization",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}