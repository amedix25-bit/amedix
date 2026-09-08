const KEY = "amh_lab_technician_session";

export function saveLabSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getLabSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function clearLabSession() {
  localStorage.removeItem(KEY);
}