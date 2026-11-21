// Privacy-preserving push content and deep links.
//
// A lock-screen preview is visible to anyone holding the phone, so a push body
// NEVER carries a diagnosis, a medication name, a laboratory result, a patient
// name or any other clinical detail. It states only that there is something to
// look at and which part of the account it concerns. The detail lives behind
// authentication, inside the portal.
//
// The route is built here (server-side) from the notification record's own
// type/target, so a push can only ever open a portal tab that the portal really
// renders. The client still re-checks authentication and permissions.

const PATIENT_TAB = {
  medication: "drugs",
  medication_reminder: "drugs",
  medication_update: "drugs",
  recall: "drugs",
  lab_request: "labs",
  lab_results: "labs",
  imaging_critical: "imaging",
  appointment: "appointments",
  rescheduled: "appointments",
  doctor_message: "messages",
  access: "access",
};

const COPY = {
  medication: {
    title: "Medication reminder",
    body: "You have a medication reminder. Open AMedix to view it.",
    tag: "amedix-medication",
  },
  laboratory: {
    title: "Laboratory update",
    body: "There is an update on your laboratory requests. Open AMedix to view it.",
    tag: "amedix-laboratory",
  },
  imaging: {
    title: "Imaging update",
    body: "There is an update on your imaging. Open AMedix to view it.",
    tag: "amedix-imaging",
  },
  appointment: {
    title: "Appointment update",
    body: "Your appointment details have changed. Open AMedix to view them.",
    tag: "amedix-appointment",
  },
  message: {
    title: "New secure message",
    body: "You have a new message in AMedix.",
    tag: "amedix-message",
  },
  access: {
    title: "Access update",
    body: "There is a change to who can view your record. Open AMedix to review it.",
    tag: "amedix-access",
  },
  urgent: {
    title: "AMedix: attention needed",
    body: "A clinical update needs your attention. Open AMedix to view it.",
    tag: "amedix-urgent",
  },
  general: {
    title: "AMedix",
    body: "You have a new notification. Open AMedix to view it.",
    tag: "amedix-general",
  },
};

// Which generic copy a notification type maps to. Deliberately coarse: the
// finer the label, the more it leaks.
export function pushCategory(type, target) {
  const t = String(type || "");
  const g = String(target || "");
  if (t === "medication_reminder" || t === "medication_update" || t === "medication_adherence" || t === "recall") return "medication";
  if (t === "lab_request" || t === "lab_results") return "laboratory";
  if (t === "imaging_critical" || t === "imaging_result_shared" || t === "critical_finding") return "urgent";
  if (t === "appointment" || t === "rescheduled") return "appointment";
  if (t === "doctor_message") return "message";
  if (t === "patient_access_granted" || t === "patient_access_revoked" || g === "access") return "access";
  if (t === "substitution_request") return "medication";
  if (t === "prescription_dispensed" || t === "prescription_rejected") return "medication";
  return "general";
}

export function pushCopy(category) {
  return COPY[category] || COPY.general;
}

// Patient deep link: the portal tab, plus the record reference when the
// notification carries one. The portal decides what it is allowed to show.
export function patientPushUrl(notification) {
  const type = String(notification?.type || "");
  const tab = PATIENT_TAB[type] || "overview";
  const params = new URLSearchParams({ tab });
  const related = notification?.related_id || notification?.medication_id;
  if (related && tab === "drugs") params.set("focus", String(related));
  return `/patient?${params.toString()}`;
}

// Doctor deep link: patient-bound events open Find Patient with the CIN
// prefilled; the record itself is re-authorised server-side by the portal.
export function doctorPushUrl(notification) {
  const type = String(notification?.type || "");
  const cin = notification?.patient_cin;
  if (cin) {
    const params = new URLSearchParams({ tab: "search", cin: String(cin) });
    return `/doctor?${params.toString()}`;
  }
  if (type === "critical_finding" || type === "imaging_result_shared") return "/doctor?tab=imaging";
  if (type === "substitution_request" || type === "prescription_dispensed" || type === "prescription_rejected") {
    return "/doctor?tab=prescriptions";
  }
  if (type === "referral_received") return "/doctor?tab=communication";
  return "/doctor?tab=overview";
}

export const PORTAL_ROUTES = {
  patient: "/patient",
  doctor: "/doctor",
  laboratory: "/lab-portal?tab=requests",
  pharmacy: "/pharmacy-portal?tab=prescriptions",
  hospital: "/hospital-portal",
  radiology: "/radiologist?tab=worklist",
  admin: "/admin",
};