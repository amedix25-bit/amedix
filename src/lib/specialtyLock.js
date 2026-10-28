// A doctor's specialty is chosen ONCE, at registration, because it decides
// which clinical documentation the Doctor Portal presents (General Surgery and
// the other surgical specialties get Surgical Records, Radiology routes to the
// Radiologist Portal, etc.). After that it is permanent — the only accounts
// listed here keep the ability to switch between specialties.
export const SPECIALTY_SWITCH_EMAILS = ["aelallegy@yahoo.com"];

export function canSwitchSpecialty(user) {
  const email = String(user?.email || "").trim().toLowerCase();
  return SPECIALTY_SWITCH_EMAILS.includes(email);
}