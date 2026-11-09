export const MESSAGING_CATEGORIES = [
  { key: "general_administration", label: "General Administration" },
  { key: "human_resources", label: "Human Resources" },
  { key: "scheduling_duty_rosters", label: "Scheduling & Duty Rosters" },
  { key: "finance_payments", label: "Finance & Payments" },
  { key: "medical_administration", label: "Medical Administration" },
  { key: "it_support", label: "IT Support" },
  { key: "equipment_supplies", label: "Equipment & Supplies" },
  { key: "complaints_suggestions", label: "Complaints & Suggestions" },
  { key: "general_inquiries", label: "General Inquiries" },
];

export const categoryLabel = (key) =>
  MESSAGING_CATEGORIES.find((c) => c.key === key)?.label || "General Inquiries";

// Doctor → patient message types. The patient sees what the message is for.
export const PATIENT_MESSAGE_TYPES = [
  { key: "follow_up", label: "Follow-up instructions" },
  { key: "appointment_reminder", label: "Appointment reminder" },
  { key: "medication_instructions", label: "Medication instructions" },
  { key: "preparation_instructions", label: "Test / imaging preparation" },
  { key: "post_consultation_care", label: "Post-consultation care" },
  { key: "educational_material", label: "Approved educational material" },
  { key: "general", label: "General message" },
];

export const patientMessageTypeLabel = (key) =>
  PATIENT_MESSAGE_TYPES.find((t) => t.key === key)?.label || "Message";

export const CHANNEL_META = {
  doctors: { key: "doctor", label: "Doctors" },
  hospitals: { key: "hospital", label: "Hospitals" },
  patients: { key: "patient", label: "Patients" },
};

// Unread count for the signed-in side of a conversation, as normalized by the
// messaging server (never derived from the browser).
export const threadUnread = (thread) => thread?.viewer_unread || 0;

export const THREAD_STATUS_META = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/30" },
  in_progress: { label: "In Progress", className: "bg-info/10 text-info border-info/30" },
  resolved: { label: "Resolved", className: "bg-success/10 text-success border-success/30" },
};

export function formatMessageTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function initials(name) {
  return String(name || "?")
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export function displayDoctor(name) {
  if (!name) return "Doctor";
  return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}