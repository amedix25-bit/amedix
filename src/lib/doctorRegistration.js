import { base44 } from "@/api/base44Client";

// Client side of the resumable doctor registration. All state decisions are
// made by the backend (doctorRegistration) — these helpers only carry the
// doctor's own input there and hand the answer back.

const call = async (payload) => {
  const res = await base44.functions.invoke("doctorRegistration", payload);
  return res.data || {};
};

export const EMPTY_DOCTOR_FORM = {
  first_name: "",
  middle_name: "",
  last_name: "",
  specialization: "",
  license_number: "",
  hospital: "",
  phone: "",
};

// State of a registration for an email, asked from the registration page
// before the person is signed in. Returns a state code only.
export async function lookupDoctorRegistration(email) {
  const data = await call({ action: "lookup", email });
  if (data.error) throw new Error(data.error);
  return data;
}

// Restores this account's saved steps: saved details plus any verification
// already completed. Read-only — it never creates a draft.
export const resumeDoctorRegistration = () => call({ action: "resume" });

export const saveDoctorDraft = (payload) => call({ action: "save", ...payload });

export const submitDoctorRegistration = (payload) => call({ action: "submit", ...payload });