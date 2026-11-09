// Shared server-side messaging rules: categories, actor resolution, audit and
// notification helpers. The same implementation is used by every messaging
// action, so access control and auditability never diverge.

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

export const CATEGORY_KEYS = MESSAGING_CATEGORIES.map((c) => c.key);

export const THREAD_STATUSES = ["pending", "in_progress", "resolved"];

export function cleanText(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max || 2000);
}

export function pageItems(result) {
  if (Array.isArray(result)) return result;
  return (result && result.items) || [];
}

export async function queryRows(base44, entity, query, options) {
  const res = await base44.asServiceRole.entities[entity].filter(query, options);
  return pageItems(res);
}

export function makeThreadRef() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `MSG-${stamp}-${suffix}`;
}

// Resolves the signed-in user to a messaging actor. A user can be a hospital
// administrator, a designated hospital staff member, or a doctor — never a
// mixture: the hospital affiliation is checked first so a stray doctor profile
// can never widen hospital access.
export async function resolveMessagingActor(base44, user) {
  const hospitals = await queryRows(base44, "HospitalProfile", { user_id: user.id }, { limit: 1 });
  if (hospitals.length > 0) {
    const hospital = hospitals[0];
    if (hospital.status === "suspended") return null;
    return {
      role: "hospital",
      userId: user.id,
      displayName: user.full_name || hospital.hospital_name,
      hospitalUserId: user.id,
      hospitalId: hospital.id,
      hospitalName: hospital.hospital_name,
      staffRole: "admin",
      department: "",
      isAdmin: true,
    };
  }

  // A designated staff member claims their invitation the first time they sign
  // in with the email the hospital administrator specified. Nothing is granted
  // by self-declaration: the record must already exist for that hospital.
  const email = String(user.email || "").toLowerCase();
  if (email) {
    const invited = await queryRows(base44, "HospitalMessagingStaff", { email, status: "invited" }, { limit: 1 });
    if (invited.length > 0) {
      const pending = invited[0];
      try {
        await base44.asServiceRole.entities.HospitalMessagingStaff.update(pending.id, {
          user_id: user.id,
          status: "active",
          last_active_datetime: new Date().toISOString(),
        });
      } catch (err) {
        return null;
      }
      return {
        role: "hospital",
        userId: user.id,
        displayName: pending.name || user.full_name || email,
        hospitalUserId: pending.hospital_user_id,
        hospitalId: pending.hospital_id,
        hospitalName: pending.hospital_name,
        staffRole: pending.role === "manager" ? "manager" : "staff",
        department: pending.department || "",
        isAdmin: false,
      };
    }
  }

  const staffRows = await queryRows(base44, "HospitalMessagingStaff", { user_id: user.id, status: "active" }, { limit: 1 });
  if (staffRows.length > 0) {
    const staff = staffRows[0];
    return {
      role: "hospital",
      userId: user.id,
      displayName: staff.name || user.full_name,
      hospitalUserId: staff.hospital_user_id,
      hospitalId: staff.hospital_id,
      hospitalName: staff.hospital_name,
      staffRole: staff.role === "manager" ? "manager" : "staff",
      department: staff.department || "",
      isAdmin: false,
    };
  }

  const doctors = await queryRows(base44, "DoctorProfile", { user_id: user.id }, { limit: 1 });
  if (doctors.length > 0) {
    const doctor = doctors[0];
    return {
      role: "doctor",
      userId: user.id,
      displayName: doctor.full_name,
      doctor,
      doctorId: doctor.id,
      specialty: doctor.specialization || "",
      verified: doctor.is_verified === true,
    };
  }

  // A patient account: read-only access to the one-way messages their treating
  // doctors sent. Resolved last so a professional account can never be widened
  // into a patient channel by owning a patient record.
  const patients = await queryRows(base44, "PatientProfile", { user_id: user.id }, { limit: 1 });
  if (patients.length > 0) {
    const patient = patients[0];
    return {
      role: "patient",
      userId: user.id,
      displayName: patient.full_name,
      patient,
      patientId: patient.id,
      patientCin: patient.cin || "",
    };
  }

  return null;
}

// The channel a conversation belongs to. Legacy conversations have no channel
// field and are doctor ↔ hospital conversations.
export function threadChannel(thread) {
  return (thread && thread.channel) || "hospital";
}

export function isVerifiedDoctor(doctor) {
  return !!doctor && doctor.is_verified === true;
}

// The care relationship that permits a doctor to message a patient: the patient
// must have explicitly granted this doctor access to their record. A revoked,
// suspended, declined or merely requested access never qualifies.
export async function findCareLink(base44, doctorId, patientId) {
  if (!doctorId || !patientId) return null;
  const rows = await queryRows(
    base44,
    "AccessRequest",
    { doctor_id: doctorId, patient_id: patientId, status: "approved" },
    { limit: 1 }
  );
  return rows[0] || null;
}

export const PATIENT_MESSAGE_TYPES = [
  { key: "follow_up", label: "Follow-up instructions" },
  { key: "appointment_reminder", label: "Appointment reminder" },
  { key: "medication_instructions", label: "Medication instructions" },
  { key: "preparation_instructions", label: "Test / imaging preparation" },
  { key: "post_consultation_care", label: "Post-consultation care" },
  { key: "educational_material", label: "Approved educational material" },
  { key: "general", label: "General message" },
];

export const PATIENT_MESSAGE_TYPE_KEYS = PATIENT_MESSAGE_TYPES.map((t) => t.key);

// One-way messages from a doctor to a patient keep a single, continuous history
// per doctor–patient pair, so a patient always reads the full instruction trail.
export async function findPatientThread(base44, doctorUserId, patientId) {
  if (!doctorUserId || !patientId) return null;
  const rows = await queryRows(
    base44,
    "MessageThread",
    { channel: "patient", doctor_user_id: doctorUserId, patient_id: patientId },
    { limit: 1 }
  );
  return rows[0] || null;
}

// The private doctor ↔ doctor conversation between two verified doctors, in
// either direction. Starting a conversation twice never creates a duplicate.
export async function findDoctorPairThread(base44, userA, userB) {
  if (!userA || !userB) return null;
  const forward = await queryRows(
    base44,
    "MessageThread",
    { channel: "doctor", doctor_user_id: userA, peer_doctor_user_id: userB },
    { limit: 1 }
  );
  if (forward[0]) return forward[0];
  const reverse = await queryRows(
    base44,
    "MessageThread",
    { channel: "doctor", doctor_user_id: userB, peer_doctor_user_id: userA },
    { limit: 1 }
  );
  return reverse[0] || null;
}

// Active hospital–doctor association. Messaging between a doctor and a
// hospital exists only while that association is active.
export async function findActiveAffiliation(base44, hospitalUserId, doctorId) {
  if (!hospitalUserId || !doctorId) return null;
  const rows = await queryRows(
    base44,
    "HospitalDoctor",
    { hospital_user_id: hospitalUserId, doctor_id: doctorId, status: "active" },
    { limit: 1 }
  );
  return rows[0] || null;
}

export function participantsFor(doctorUserId, hospitalUserId, assignedStaffUserId) {
  const list = [doctorUserId, hospitalUserId, assignedStaffUserId].filter(Boolean);
  return [...new Set(list)];
}

export async function logMessageAudit(base44, params) {
  const thread = params.thread || {};
  const now = new Date().toISOString();
  try {
    await base44.asServiceRole.entities.MessageAuditEvent.create({
      thread_id: thread.id,
      thread_ref: thread.thread_ref,
      hospital_user_id: thread.hospital_user_id,
      hospital_name: thread.hospital_name,
      doctor_user_id: thread.doctor_user_id,
      actor_user_id: params.actorUserId || "",
      actor_name: params.actorName || "System",
      actor_role: params.actorRole || "system",
      action: params.action,
      action_label: params.actionLabel || params.action,
      detail: params.detail || "",
      datetime: now,
    });
  } catch (err) {
    // Audit writes must never break the messaging action, but they are always
    // attempted for every event.
  }
}

// Notification with duplicate prevention: the same event never notifies the
// same recipient twice.
export async function notifyRecipient(base44, params) {
  if (!params.recipientUserId) return;
  if (params.recipientUserId === params.actorUserId) return;
  const now = new Date().toISOString();
  const dedupeKey = `${params.threadId}:${params.recipientUserId}:${params.dedupeKey}`;
  try {
    const existing = await queryRows(base44, "MessageNotification", { dedupe_key: dedupeKey }, { limit: 1 });
    if (existing.length > 0) return;
    await base44.asServiceRole.entities.MessageNotification.create({
      recipient_user_id: params.recipientUserId,
      recipient_role: params.recipientRole,
      thread_id: params.threadId,
      hospital_user_id: params.hospitalUserId,
      hospital_name: params.hospitalName,
      doctor_user_id: params.doctorUserId,
      kind: params.kind,
      title: params.title,
      message: params.message,
      actor_name: params.actorName || "",
      category: params.category || "",
      is_read: false,
      dedupe_key: dedupeKey,
      datetime: now,
    });
  } catch (err) {
    // Notification delivery is best-effort; the message itself is persisted.
  }
}

// Every hospital person who should hear about a doctor's message: the
// administrator plus the active designated staff of that hospital.
export async function hospitalNotificationRecipients(base44, hospitalUserId) {
  const recipients = [{ userId: hospitalUserId, role: "hospital" }];
  try {
    const staff = await queryRows(base44, "HospitalMessagingStaff", { hospital_user_id: hospitalUserId, status: "active" }, { limit: 50 });
    staff.forEach((s) => {
      if (s.user_id) recipients.push({ userId: s.user_id, role: "hospital" });
    });
  } catch (err) {
    // fall back to the administrator only
  }
  const seen = new Set();
  return recipients.filter((r) => {
    if (!r.userId || seen.has(r.userId)) return false;
    seen.add(r.userId);
    return true;
  }).slice(0, 20);
}

export function previewOf(body, attachments) {
  const text = cleanText(body, 400);
  if (text) return text.slice(0, 140);
  if (attachments && attachments.length > 0) return "Attachment";
  return "";
}

export function sanitizeAttachments(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((a) => a && typeof a.file_uri === "string" && a.file_uri.startsWith("private/"))
    .slice(0, 5)
    .map((a) => ({
      file_uri: a.file_uri,
      file_name: cleanText(a.file_name, 200) || "Attachment",
      mime_type: cleanText(a.mime_type, 120),
      size: Number(a.size) || 0,
      uploaded_datetime: new Date().toISOString(),
    }));
}