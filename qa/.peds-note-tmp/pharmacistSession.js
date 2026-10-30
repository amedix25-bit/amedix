const KEY = "amx_pharmacist_session";

export function savePharmacistSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getPharmacistSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function clearPharmacistSession() {
  localStorage.removeItem(KEY);
}