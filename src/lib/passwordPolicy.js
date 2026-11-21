// Password policy — the one rule set the app applies everywhere a password is
// created. The platform enforces the same minimum server-side (measured:
// "Password must be at least 8 characters long"), so the app must check it
// before submitting rather than letting the user discover it afterwards.
export const MIN_PASSWORD_LENGTH = 8;

export function passwordPolicyError(password, confirmPassword) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
}