import { base44 } from "@/api/base44Client";

// Client side of registration recovery. The backend decides which state an
// email address is in and answers with a state code only — never a name, a
// role or anything the person entered. These helpers only carry the question
// and hand the answer back.

// new | unverified | incomplete | pending_verification | active | rejected |
// blocked | rate_limited | unknown
export async function lookupRegistrationState(email) {
  const res = await base44.functions.invoke("registrationState", { email });
  return res?.data || { state: "unknown" };
}

// Records one funnel step of the platform email code (request / resend /
// verified / rejected) so first-attempt delivery can be measured. Fire and
// forget: it must never delay or break the registration itself.
export function logRegistrationStep(kind, email, detail = "") {
  base44.functions
    .invoke("registrationEvent", { kind, email, detail })
    .catch(() => null);
}

export async function resumePatientRegistration() {
  const res = await base44.functions.invoke("patientRegistration", { action: "resume" });
  return res?.data || { state: "none", step: 0, saved: null };
}

export async function savePatientRegistration(payload) {
  const res = await base44.functions.invoke("patientRegistration", { action: "save", ...payload });
  return res?.data || {};
}

export async function completePatientRegistration() {
  const res = await base44.functions.invoke("patientRegistration", { action: "complete" });
  return res?.data || {};
}