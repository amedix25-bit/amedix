// A single account AMedix administration has explicitly exempted from the
// document-verification gate, so she can create her account without uploading
// identification. Nobody else is affected: every other account still needs a
// document whose number matches.
const VERIFICATION_EXEMPT_EMAILS = ["yasmin.abdelsalam@limu.edu.ly"];

export function isVerificationExempt(email) {
  const value = String(email || "").trim().toLowerCase();
  return !!value && VERIFICATION_EXEMPT_EMAILS.includes(value);
}