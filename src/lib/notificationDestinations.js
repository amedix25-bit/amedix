// Single source of truth for where every notification leads and how urgent it
// is. Notification records are written by many backend functions over time, so
// older records may carry a target that no longer exists as a portal tab
// (e.g. "reminders", "medications", "mylabresults"). Every click handler runs
// the record through this module, which can only ever return a tab that the
// destination portal actually renders — that is what stops a notification from
// opening a blank page.

export const PATIENT_TABS = [
  "overview", "appointments", "messages", "directory", "health", "vaccinations",
  "doctorvisits", "documents", "labs", "imaging", "drugs", "profile", "access",
  "conditions", "allergies", "surgeries", "medicalcard",
];

export const DOCTOR_TABS = [
  "overview", "search", "emergency", "communication", "professional-profile",
  "hospitals", "notes", "labs", "imaging", "prescriptions", "encounters",
  "settings", "help",
];

export const RADIOLOGIST_TABS = ["overview", "worklist", "viewer", "colleagues", "find", "notifications"];
export const PHARMACY_TABS = ["dashboard", "prescriptions", "inventory", "patients", "pharmacists", "reports", "partner", "profile"];
export const LAB_TABS = ["dashboard", "requests", "patients", "pending", "completed", "staff", "partner", "profile"];

export const isKnownTab = (tabs, tab) => !!tab && tabs.includes(tab);

// Legacy / renamed targets → the tab that exists today.
const PATIENT_TARGET_MAP = {
  reminders: "drugs",
  medications: "drugs",
  prescriptions: "drugs",
  mylabresults: "labs",
  lab_results: "labs",
  lab_request: "labs",
  radiology: "access",
  appointments: "appointments",
  messages: "messages",
  imaging: "imaging",
  access: "access",
  documents: "documents",
  health: "health",
  overview: "overview",
};

// When a record has no usable target, the notification type still tells us
// which part of the patient record the event concerns.
const PATIENT_TYPE_TAB = {
  appointment: "appointments",
  rescheduled: "appointments",
  lab_request: "labs",
  lab_results: "labs",
  medication_update: "drugs",
  medication_reminder: "drugs",
  recall: "drugs",
  doctor_message: "messages",
  imaging_critical: "imaging",
  other: "overview",
};

export function resolvePatientTarget(n) {
  const byTarget = PATIENT_TARGET_MAP[String(n?.target || "")];
  if (isKnownTab(PATIENT_TABS, byTarget)) return byTarget;
  const byType = PATIENT_TYPE_TAB[String(n?.type || "")];
  return isKnownTab(PATIENT_TABS, byType) ? byType : "overview";
}

// Doctor destinations. Patient-bound events open Find Patient with the CIN
// prefilled (the record itself is then re-authorised server-side); document
// events open their own list. A destination is always a real doctor tab.
export function resolveDoctorDestination(n) {
  const type = String(n?.type || "");
  const target = String(n?.target || "");

  if (target === "referrals" || type === "referral_received") {
    return { tab: "communication", view: "referrals", label: "Open Referrals" };
  }
  if (type === "substitution_request") {
    return { tab: "prescriptions", label: "Review Substitution" };
  }
  if (type === "prescription_dispensed" || type === "prescription_rejected") {
    return { tab: "prescriptions", label: "Open Prescriptions" };
  }
  if (type === "recall" && !n?.patient_cin) {
    return { tab: "prescriptions", label: "Open Prescriptions" };
  }
  if (type === "critical_finding" && !n?.patient_cin) {
    return { tab: "imaging", label: "Open Imaging" };
  }
  if (n?.patient_cin) {
    return { tab: "search", cin: n.patient_cin, label: "Open Patient" };
  }
  if (type === "critical_finding" || type === "imaging_result_shared") {
    return { tab: "imaging", label: "Open Imaging" };
  }
  return { tab: "overview", label: "Open Overview" };
}

// Consistent categories across every portal, derived from the record's own
// type/target so existing records need no migration.
export const NOTIFICATION_CATEGORY = {
  urgent: { key: "urgent", label: "Urgent / Critical", tone: "critical", rank: 3 },
  action: { key: "action", label: "Action Required", tone: "warning", rank: 2 },
  request: { key: "request", label: "New Request", tone: "info", rank: 1 },
  appointment: { key: "appointment", label: "Appointment", tone: "info", rank: 1 },
  clinical: { key: "clinical", label: "Clinical Update", tone: "info", rank: 1 },
  medication: { key: "medication", label: "Prescription / Medication", tone: "warning", rank: 2 },
  laboratory: { key: "laboratory", label: "Laboratory", tone: "info", rank: 1 },
  radiology: { key: "radiology", label: "Radiology", tone: "info", rank: 1 },
  administrative: { key: "administrative", label: "Administrative", tone: "muted", rank: 0 },
  general: { key: "general", label: "General Information", tone: "muted", rank: 0 },
};

const TYPE_CATEGORY = {
  critical_finding: "urgent",
  imaging_critical: "urgent",
  recall: "urgent",
  substitution_request: "action",
  patient_access_granted: "action",
  patient_access_revoked: "action",
  medication_reminder: "action",
  lab_request: "request",
  referral_received: "request",
  appointment: "appointment",
  rescheduled: "appointment",
  lab_results: "laboratory",
  imaging_result_shared: "clinical",
  medication_adherence: "clinical",
  doctor_message: "general",
  prescription_dispensed: "medication",
  prescription_rejected: "medication",
  medication_update: "medication",
  other: "general",
};

export function notificationMeta(n) {
  const key = TYPE_CATEGORY[String(n?.type || "")] || "general";
  const category = NOTIFICATION_CATEGORY[key] || NOTIFICATION_CATEGORY.general;
  return { ...category, urgent: category.key === "urgent" };
}