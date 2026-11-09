import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { auditEntry, isActivated, loadAuthorization, withAudit } from "../../shared/hospitalAuthorization.ts";

// Generates the hospital's unique AMedix Hospital Code — the ONLY way a doctor
// can join the hospital. Created server-side with cryptographic randomness,
// checked for uniqueness across every hospital profile, and stored on the
// hospital's own record after verifying the caller is the hospital
// administrator. Unambiguous alphabet (no 0/O or 1/I).
//
// HARD GATE: no Hospital Code can be created until AMedix administration has
// approved the institution and the hospital activated its issued authorization
// code. The gate reads the authorization record (server-write-only), so neither
// UI state nor a direct API call can bypass it.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return "AMX-" + [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const profiles = await base44.entities.HospitalProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: "Hospital profile not found." }, { status: 403 });
    }
    const profile = profiles[0];

    if (profile.status === "suspended") {
      return Response.json({ error: "This hospital account is currently suspended." }, { status: 403 });
    }

    const authorization = await loadAuthorization(base44, profile.id);
    if (!isActivated(authorization)) {
      const reason =
        !authorization
          ? "This hospital has no AMedix authorization record."
          : authorization.status === "rejected"
          ? "This hospital's registration was not approved by AMedix administration."
          : authorization.status !== "approved"
          ? "This hospital is pending AMedix administrative approval."
          : "Enter your issued AMedix authorization code to activate this hospital.";
      return Response.json(
        { error: `An AMedix Hospital Code cannot be created yet. ${reason}`, authorization_status: authorization?.status || "missing" },
        { status: 403 }
      );
    }

    // A hospital keeps its code — return the existing one instead of issuing a new one.
    if (profile.hospital_code) {
      return Response.json({ hospital_code: profile.hospital_code });
    }

    let code = makeCode();
    let existing = await base44.asServiceRole.entities.HospitalProfile.filter({ hospital_code: code });
    while (existing.length > 0) {
      code = makeCode();
      existing = await base44.asServiceRole.entities.HospitalProfile.filter({ hospital_code: code });
    }

    await base44.asServiceRole.entities.HospitalProfile.update(profile.id, { hospital_code: code });

    await base44.asServiceRole.entities.HospitalAuthorization.update(authorization.id, {
      hospital_code_issued: true,
      audit: withAudit(
        authorization,
        auditEntry({
          action: "hospital_code_created",
          actionLabel: "AMedix Hospital Code created by the hospital",
          actor: { user_id: user.id, name: user.full_name || profile.hospital_name, role: "hospital" },
          detail: "Permanent institutional identifier — distributable to affiliated doctors",
        })
      ),
    });

    return Response.json({ hospital_code: code });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}