import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { secrets } from "base44:runtime";

// The patient's own AMedix digital medical card: issuance, status, revocation
// and reissue. Every action is bound to the signed-in patient — a card is only
// ever produced for the profile that belongs to the caller.
//
// The verification token is generated here, on the server, and is the only
// thing the card's QR code carries. It is never the CIN and never a clinical
// value.

const CARD_LIFETIME_YEARS = 5;

function nowIso() {
  return new Date().toISOString();
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function newCardNumber() {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `AMX-${new Date().getFullYear()}-${suffix}`;
}

function secretPresent(name) {
  try {
    return Boolean(secrets.get(name));
  } catch (error) {
    return false;
  }
}

// Apple Wallet is only advertised when the app actually holds a Pass Type
// certificate; until then the card offers the PDF, which needs no Apple account.
function walletConfigured() {
  return ["APPLE_PASS_TYPE_ID", "APPLE_TEAM_ID", "APPLE_PASS_CERT_PEM", "APPLE_PASS_KEY_PEM"].every(secretPresent);
}

function effectiveStatus(card) {
  if (card.status === "revoked") return "revoked";
  if (card.expires_datetime && new Date(card.expires_datetime).getTime() < Date.now()) return "expired";
  return "active";
}

function expiryFrom(iso) {
  const date = new Date(iso);
  date.setFullYear(date.getFullYear() + CARD_LIFETIME_YEARS);
  return date.toISOString();
}

function appOrigin(req) {
  const header = req.headers.get("X-Base44-App-Url");
  return (header || "https://amedixly.com").replace(/\/+$/, "");
}

function present(card, req) {
  const origin = appOrigin(req);
  return {
    id: card.id,
    card_number: card.card_number,
    status: effectiveStatus(card),
    issued_datetime: card.issued_datetime || card.created_date,
    expires_datetime: card.expires_datetime || null,
    revoked_datetime: card.revoked_datetime || null,
    revoked_reason: card.revoked_reason || "",
    patient_name: card.patient_name,
    patient_name_ar: card.patient_name_ar || "",
    patient_cin: card.patient_cin,
    verification_token: card.verification_token,
    verify_url: `${origin}/verify-card?token=${card.verification_token}`,
    reissue_count: card.reissue_count || 0,
    audit: Array.isArray(card.audit) ? card.audit.slice(-12) : [],
  };
}

async function latestCard(base44, patientId) {
  const page = await base44.asServiceRole.entities.MedicalCard.filter(
    { patient_id: patientId },
    { sort: "-created_date", limit: 1 }
  );
  return page.items?.[0] || null;
}

async function issue(base44, profile, replaced) {
  const issued = nowIso();
  const audit = [{
    datetime: issued,
    action: replaced ? "reissued" : "issued",
    actor_name: profile.full_name,
    actor_role: "patient",
    detail: replaced ? `Replaced card ${replaced.card_number}` : "Card issued from the patient portal",
  }];
  return base44.asServiceRole.entities.MedicalCard.create({
    patient_id: profile.id,
    patient_user_id: profile.user_id,
    patient_cin: profile.cin,
    patient_name: profile.full_name,
    patient_name_ar: profile.full_name_ar || "",
    card_number: newCardNumber(),
    verification_token: randomToken(),
    status: "active",
    issued_datetime: issued,
    expires_datetime: expiryFrom(issued),
    replaced_card_number: replaced?.card_number || "",
    reissue_count: replaced ? (replaced.reissue_count || 0) + 1 : 0,
    verify_count: 0,
    audit,
  });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "get");
    if (!["get", "issue", "revoke", "reissue"].includes(action)) {
      return Response.json({ error: "Unknown action" }, { status: 400 });
    }

    const profiles = await base44.entities.PatientProfile.filter({ user_id: user.id }, { limit: 1 });
    const profile = profiles.items?.[0] || null;
    if (!profile) return Response.json({ error: "patient_profile_missing" }, { status: 404 });

    let card = await latestCard(base44, profile.id);

    if (action === "revoke") {
      if (!card) return Response.json({ error: "card_missing" }, { status: 404 });
      if (card.status === "revoked") return Response.json({ card: present(card, req), walletConfigured: walletConfigured() });
      const at = nowIso();
      const reason = String(body.reason || "").slice(0, 200) || "Revoked by the patient";
      card = await base44.asServiceRole.entities.MedicalCard.update(card.id, {
        status: "revoked",
        revoked_datetime: at,
        revoked_reason: reason,
        revoked_by_name: profile.full_name,
        audit: [...(card.audit || []), {
          datetime: at,
          action: "revoked",
          actor_name: profile.full_name,
          actor_role: "patient",
          detail: reason,
        }],
      });
      return Response.json({ card: present(card, req), walletConfigured: walletConfigured() });
    }

    if (action === "reissue") {
      if (card && card.status !== "revoked") {
        const at = nowIso();
        card = await base44.asServiceRole.entities.MedicalCard.update(card.id, {
          status: "revoked",
          revoked_datetime: at,
          revoked_reason: "Replaced by a newly issued card",
          revoked_by_name: profile.full_name,
          audit: [...(card.audit || []), {
            datetime: at,
            action: "revoked",
            actor_name: profile.full_name,
            actor_role: "patient",
            detail: "Replaced by a newly issued card",
          }],
        });
      }
      const fresh = await issue(base44, profile, card);
      return Response.json({ card: present(fresh, req), walletConfigured: walletConfigured() });
    }

    // "get" and "issue" both end with a usable active card: the first visit
    // issues one, later visits return the same card unchanged.
    if (!card) {
      card = await issue(base44, profile, null);
    } else if (action === "issue" && effectiveStatus(card) !== "active") {
      card = await issue(base44, profile, card);
    }

    return Response.json({ card: present(card, req), walletConfigured: walletConfigured() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}