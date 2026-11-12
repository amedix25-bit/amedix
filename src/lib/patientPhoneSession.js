// The phone-signed-in patient's session token. Kept in sessionStorage so it
// ends with the browser tab, and never mixed with the Base44 account token that
// doctors, hospitals and other portals use.
const KEY = "amedix.patient.phone.session";

export function savePatientPhoneSession(token) {
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    // Private browsing can block storage; the in-memory flow still completes.
  }
}

export function readPatientPhoneSession() {
  try {
    return sessionStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

export function clearPatientPhoneSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}