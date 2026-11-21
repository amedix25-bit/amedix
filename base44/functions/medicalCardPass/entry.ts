import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { secrets } from "base44:runtime";

// Apple Wallet pass (.pkpass) for the patient's AMedix digital medical card.
//
// A genuine pass is a signed ZIP: pass.json plus images, signed with the
// app's Apple Pass Type certificate. That certificate belongs to the AMedix
// Apple Developer account and is read from app secrets here — it never
// reaches the browser. Until the secrets are set this endpoint answers
// wallet_not_configured instead of handing out a pass Apple would reject.

const REQUIRED_SECRETS = [
  "APPLE_PASS_TYPE_ID",
  "APPLE_TEAM_ID",
  "APPLE_PASS_CERT_PEM",
  "APPLE_PASS_KEY_PEM",
];

const LOGO_URL =
  "https://base44.app/api/apps/6a9ea24b809f9bb40f0d02bf/files/mp/public/6a9ea24b809f9bb40f0d02bf/d5620c0e4_amedix-glossy-blue-transparent.png";

const NAVY = "rgb(23,50,77)";
const WHITE = "rgb(255,255,255)";
const MIST = "rgb(199,214,230)";

function readSecret(name) {
  try {
    return String(secrets.get(name) || "");
  } catch (error) {
    return "";
  }
}

function missingSecrets() {
  return REQUIRED_SECRETS.filter((name) => !readSecret(name));
}

function effectiveStatus(card) {
  if (card.status === "revoked") return "revoked";
  if (card.expires_datetime && new Date(card.expires_datetime).getTime() < Date.now()) return "expired";
  return "active";
}

function day(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function appOrigin(req) {
  const header = req.headers.get("X-Base44-App-Url");
  return (header || "https://amedixly.com").replace(/\/+$/, "");
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const profiles = await base44.entities.PatientProfile.filter({ user_id: user.id }, { limit: 1 });
    const profile = profiles.items?.[0] || null;
    if (!profile) return Response.json({ error: "patient_profile_missing" }, { status: 404 });

    const page = await base44.asServiceRole.entities.MedicalCard.filter(
      { patient_id: profile.id },
      { sort: "-created_date", limit: 1 }
    );
    const card = page.items?.[0] || null;
    if (!card) return Response.json({ error: "card_missing" }, { status: 404 });
    if (effectiveStatus(card) !== "active") {
      return Response.json({ error: "card_not_active", status: effectiveStatus(card) }, { status: 409 });
    }

    const missing = missingSecrets();
    if (missing.length) {
      return Response.json({
        error: "wallet_not_configured",
        missing,
        detail: "The Apple Pass Type certificate has not been configured for this app yet.",
      }, { status: 503 });
    }

    // Imported inside the handler: an unavailable package must answer 503, not
    // crash the function at boot.
    let PKPass;
    try {
      const mod = await import("npm:passkit-generator@3.1.11");
      PKPass = mod.PKPass;
    } catch (error) {
      return Response.json({
        error: "wallet_not_configured",
        detail: "Pass generation library is not available in this deployment.",
      }, { status: 503 });
    }

    const verifyUrl = `${appOrigin(req)}/verify-card?token=${card.verification_token}`;
    const status = effectiveStatus(card);

    const passProps = {
      formatVersion: 1,
      passTypeIdentifier: readSecret("APPLE_PASS_TYPE_ID"),
      serialNumber: card.card_number,
      teamIdentifier: readSecret("APPLE_TEAM_ID"),
      organizationName: "AMedix",
      description: "AMedix digital medical card",
      logoText: "AMedix",
      foregroundColor: WHITE,
      backgroundColor: NAVY,
      labelColor: MIST,
      sharingProhibited: false,
      generic: {
        headerFields: [{ key: "status", label: "STATUS", value: status.toUpperCase() }],
        primaryFields: [{ key: "patient", label: "PATIENT", value: card.patient_name }],
        secondaryFields: [
          { key: "patientId", label: "PATIENT ID", value: card.patient_cin },
          { key: "card", label: "CARD", value: card.card_number },
        ],
        auxiliaryFields: [
          { key: "issued", label: "ISSUED", value: day(card.issued_datetime) },
          { key: "expires", label: "VALID UNTIL", value: day(card.expires_datetime) },
        ],
        backFields: [
          {
            key: "verification",
            label: "Verification",
            value: "Scan this card's QR code, or open the verification link, to confirm it is currently valid. The code carries no clinical information.",
          },
          { key: "verifyUrl", label: "Verify", value: verifyUrl },
          { key: "patientAr", label: "الاسم", value: card.patient_name_ar || card.patient_name },
          {
            key: "notice",
            label: "Notice",
            value: "This is an AMedix digital medical identification card. It is not an Apple-issued identity document and not an Apple Health Medical ID.",
          },
        ],
      },
      barcode: {
        format: "PKBarcodeFormatQR",
        message: verifyUrl,
        messageEncoding: "iso-8859-1",
        altText: "Verify AMedix card",
      },
      barcodes: [{
        format: "PKBarcodeFormatQR",
        message: verifyUrl,
        messageEncoding: "iso-8859-1",
        altText: "Verify AMedix card",
      }],
    };

    let pass;
    try {
      pass = new PKPass(
        {
          wwdr: readSecret("APPLE_WWDR_CERT_PEM"),
          signerCert: readSecret("APPLE_PASS_CERT_PEM"),
          signerKey: readSecret("APPLE_PASS_KEY_PEM"),
          signerKeyPassphrase: readSecret("APPLE_PASS_KEY_PASSPHRASE") || undefined,
        },
        passProps
      );
    } catch (error) {
      return Response.json({ error: "wallet_not_configured", detail: error.message }, { status: 503 });
    }

    // Apple requires an icon; the official mark is used unchanged so it is never
    // redrawn, cropped or stretched.
    try {
      const logoRes = await fetch(LOGO_URL, { signal: AbortSignal.timeout(8000) });
      if (logoRes.ok) {
        const buffer = Buffer.from(await logoRes.arrayBuffer());
        pass.addBuffer("logo.png", buffer);
        pass.addBuffer("icon.png", buffer);
      }
    } catch (error) {
      return Response.json({ error: "wallet_not_configured", detail: "The AMedix logo could not be loaded." }, { status: 503 });
    }

    const buffer = await pass.getAsBuffer();
    return Response.json({
      filename: `AMedix-${card.card_number}.pkpass`,
      pass_base64: Buffer.from(buffer).toString("base64"),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}