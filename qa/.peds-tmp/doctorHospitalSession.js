// Doctor Portal hospital session storage. A session is opened only after the
// doctor successfully verifies the AMedix Hospital Code of the hospital they
// are working at (backend-verified association). Kept in sessionStorage so a
// new browser session — every fresh login to the Doctor Portal — asks for the
// code again.
const SESSION_KEY = "amedix_doctor_hospital_session";

export function getDoctorHospitalSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function setDoctorHospitalSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    /* storage unavailable — the gate simply re-prompts */
  }
}

export function clearDoctorHospitalSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (err) {
    /* ignore */
  }
}