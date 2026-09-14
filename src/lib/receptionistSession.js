const KEY = "amh_hospital_receptionist_session";

export function saveReceptionistSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getReceptionistSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function clearReceptionistSession() {
  localStorage.removeItem(KEY);
}