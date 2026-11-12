// Shared radiology workflow definitions — the ONE workflow behind the
// Radiology Department Portal and the Radiologist Portal. Two interfaces,
// one status chain, no conflicting status systems.
//
// Full chain (new requests):
//   requested → under_review → accepted → scheduled → in_progress →
//   examination_completed → images_awaiting_transfer → ready_for_reporting →
//   reporting_in_progress → final_report → released
// with branch: under_review → clarification_required → (doctor responds) → under_review
// and terminal: cancelled (from any active stage).
// Legacy values kept valid for existing records:
//   performed ≡ examination_completed, interpretation ≡ reporting_in_progress.

export const STAGES = [
  "requested", "under_review", "clarification_required", "accepted",
  "scheduled", "in_progress", "examination_completed", "images_awaiting_transfer",
  "ready_for_reporting", "reporting_in_progress", "awaiting_signature",
  "final_report", "released", "cancelled",
];

// Stages at which a radiologist may write the report.
export const REPORTABLE_STAGES = [
  "ready_for_reporting", "performed", "examination_completed",
  "reporting_in_progress", "interpretation", "awaiting_signature",
];

export function imageCount(request: any): number {
  return (request?.image_file_urls || []).filter(Boolean).length;
}

// Why reporting is closed for this study — null when it is open. Shown to the
// radiologist so a locked workspace always says exactly what is missing.
export function reportingLockReason(request: any): string | null {
  const stage = canonicalStage(request?.workflow_status);
  if (["final_report", "released", "cancelled"].includes(stage)) return null;
  const images = imageCount(request);
  if (!REPORTABLE_STAGES.includes(stage)) {
    if (!images) {
      return "The examination has not been completed and no study images have been received. Reporting unlocks automatically once the examination is completed and the images are received and verified.";
    }
    return "The study images were received, but the examination is not yet verified as completed. Reporting unlocks automatically at that point.";
  }
  if (!images) {
    return "The examination is completed but no study images are attached to this request. Reporting stays locked until the images are received and verified — the department can import the study, or the facility can connect its PACS/DICOM source.";
  }
  return null;
}

export function imagesVerified(request: any): boolean {
  return REPORTABLE_STAGES.includes(canonicalStage(request?.workflow_status)) && imageCount(request) > 0;
}

// Automatic transition: examination completed + images received and verified
// ⇒ ready for reporting. No manual departmental unlock is needed.
export async function autoReadyForReporting(base44: any, request: any, actorName = "Radiology Department") {
  const stage = canonicalStage(request?.workflow_status);
  if (stage === "ready_for_reporting") return request;
  if (!["examination_completed", "performed", "images_awaiting_transfer"].includes(stage)) return request;
  if (imageCount(request) === 0) return request;
  const now = nowIso();
  const update: Record<string, any> = {
    workflow_status: "ready_for_reporting",
    images_received_datetime: request.images_received_datetime || now,
    ready_datetime: now,
    updated_datetime: now,
    status_history: historyEntry(
      request, "images_verified", String(request.workflow_status), "ready_for_reporting",
      actorName, "department", "Images received and verified — reporting unlocked automatically"
    ),
  };
  await base44.asServiceRole.entities.ImagingRequest.update(request.id, update);
  try {
    await logClinicalAudit(base44, {
      actor_user_id: "",
      actor_name: actorName,
      actor_role: "radiology_department",
      action: "imaging_images_verified",
      action_label: "verified the received images — study ready for reporting",
      patient_id: request.patient_id,
      patient_cin: request.patient_cin,
      patient_name: request.patient_name,
      encounter_id: request.encounter_id || "",
      document_id: request.request_id,
      hospital: request.routed_hospital || request.doctor_hospital || "",
    });
  } catch (e) { /* audit never blocks the transition */ }
  return { ...request, ...update };
}

export const LEGACY_STAGE_MAP = {
  performed: "examination_completed",
  interpretation: "reporting_in_progress",
};

// Canonical stage of a record — maps legacy values onto the current chain.
export function canonicalStage(status) {
  const s = String(status || "requested");
  return LEGACY_STAGE_MAP[s] || s;
}

export type Transition = {
  from: string[];
  to: string;
  field: string;
  label: string;
  actor: "department" | "radiologist" | "doctor";
  require_report?: boolean;
  require_assignment?: boolean;
};

export const TRANSITIONS: Record<string, Transition> = {
  review: {
    from: ["requested"], to: "under_review", field: "under_review_datetime",
    label: "moved the request to departmental review", actor: "department",
  },
  request_clarification: {
    from: ["requested", "under_review"], to: "clarification_required", field: "clarification_datetime",
    label: "requested clarification from the referring doctor", actor: "department",
  },
  respond_clarification: {
    from: ["clarification_required"], to: "under_review", field: "clarification_response_datetime",
    label: "responded to the clarification request", actor: "doctor",
  },
  accept: {
    from: ["requested", "under_review", "clarification_required"], to: "accepted", field: "accepted_datetime",
    label: "accepted the imaging request", actor: "department",
  },
  schedule: {
    from: ["requested", "under_review", "accepted"], to: "scheduled", field: "scheduled_datetime",
    label: "scheduled the imaging examination", actor: "department",
  },
  start_examination: {
    from: ["scheduled"], to: "in_progress", field: "in_progress_datetime",
    label: "started the imaging examination", actor: "department",
  },
  complete_examination: {
    from: ["scheduled", "in_progress"], to: "images_awaiting_transfer", field: "performed_datetime",
    label: "marked the examination completed — images awaiting transfer", actor: "department",
  },
  images_received: {
    from: ["images_awaiting_transfer", "examination_completed", "performed"], to: "ready_for_reporting", field: "images_received_datetime",
    label: "recorded the images as received — ready for reporting", actor: "department",
  },
  start_reporting: {
    from: ["ready_for_reporting", "performed", "examination_completed", "reporting_in_progress"], to: "reporting_in_progress", field: "reporting_datetime",
    label: "started reporting", actor: "radiologist", require_assignment: true,
  },
  submit_for_signature: {
    from: ["reporting_in_progress", "interpretation", "ready_for_reporting", "performed", "examination_completed"],
    to: "awaiting_signature", field: "updated_datetime",
    label: "completed the interpretation — awaiting electronic signature",
    actor: "radiologist", require_report: true, require_assignment: true,
  },
  finalize_report: {
    from: ["awaiting_signature", "reporting_in_progress", "interpretation", "ready_for_reporting"], to: "final_report", field: "final_report_datetime",
    label: "signed and finalized the radiology report", actor: "radiologist", require_report: true, require_assignment: true,
  },
  release: {
    from: ["final_report"], to: "released", field: "released_datetime",
    label: "released the radiology report to the patient record", actor: "department",
  },
  cancel: {
    from: ["requested", "under_review", "clarification_required", "accepted", "scheduled", "in_progress", "images_awaiting_transfer", "ready_for_reporting", "reporting_in_progress"],
    to: "cancelled", field: "cancelled_datetime",
    label: "cancelled the imaging request", actor: "department", require_reason: true,
  } as Transition,
};

// Priority-based SLA the department monitors overdue studies against —
// hours from request until the study is ready for reporting.
export function slaHours(priority) {
  if (priority === "Emergency") return 2;
  if (priority === "Urgent") return 24;
  return 168; // Routine — 7 days
}

// A study is OVERDUE when its SLA has passed and it is not yet ready for
// reporting (or beyond) and not cancelled/released.
export function isOverdue(request) {
  const stage = canonicalStage(request.workflow_status);
  const post = ["ready_for_reporting", "reporting_in_progress", "final_report", "released", "cancelled"];
  if (post.includes(stage)) return false;
  if (!request.request_datetime) return false;
  const deadline = new Date(request.request_datetime).getTime() + slaHours(request.priority) * 3600 * 1000;
  return Date.now() > deadline;
}

// Append a status_history entry (mutates a plain copy and returns it).
export function historyEntry(request, action, from, to, byName, byRole, note) {
  const history = Array.isArray(request.status_history) ? [...request.status_history] : [];
  history.push({
    action, from: from || "", to, by_name: byName || "", by_role: byRole || "",
    datetime: new Date().toISOString(), note: note || "",
  });
  return history;
}

import { logClinicalAudit } from "./clinicalAudit.ts";

function nowIso() {
  return new Date().toISOString();
}

type Actor = {
  name: string;
  role: "department" | "radiologist" | "doctor";
  userId: string;
  payload?: Record<string, any>;
};

// Apply one workflow transition: validates the stage, writes the timestamp,
// appends the status history, records the audit trail and sends the
// notifications. Used by BOTH the department and the radiologist functions.
export async function applyTransition(base44: any, request: any, action: string, actor: Actor) {
  const t = TRANSITIONS[action];
  if (!t) throw new Error("Unknown workflow action.");
  const current = canonicalStage(request.workflow_status);
  if (!t.from.includes(current) && !t.from.includes(String(request.workflow_status))) {
    throw new Error(`This request is at the "${current}" stage — that action is not available now.`);
  }
  const now = nowIso();
  const payload = actor.payload || {};
  const update: Record<string, any> = { workflow_status: t.to, updated_datetime: now };

  if (action === "schedule") {
    const scheduledFor = String(payload.scheduled_for || "").trim();
    update.scheduled_datetime = scheduledFor || now;
  } else if (action === "request_clarification") {
    const clarification = String(payload.clarification || "").trim();
    if (!clarification) throw new Error("Write the clarification you are asking the referring doctor for.");
    update.clarification_request = clarification;
    update.clarification_datetime = now;
  } else if (action === "respond_clarification") {
    const response = String(payload.clarification || payload.reason || "").trim();
    if (!response) throw new Error("Write your response to the department's clarification.");
    update.clarification_response = response;
    update.clarification_response_datetime = now;
  } else if (action === "images_received") {
    const urls = Array.isArray(payload.image_file_urls) ? payload.image_file_urls.filter(Boolean) : [];
    if (urls.length) {
      update.image_file_urls = [...(request.image_file_urls || []), ...urls];
      if (String(payload.image_notes || "").trim()) update.image_notes = String(payload.image_notes).trim();
    }
    update.images_received_datetime = now;
    update.ready_datetime = now;
  } else if (action === "cancel") {
    const reason = String(payload.reason || "").trim();
    if (!reason) throw new Error("A documented cancellation reason is required.");
    update.cancel_reason = reason;
    update.cancelled_by_name = actor.name;
    update.cancelled_datetime = now;
  } else if (action === "submit_for_signature") {
    const submittedReport = String(payload.report || "").trim();
    if (submittedReport) update.report = submittedReport;
    // The awaiting-signature time is carried by the status history entry.
  } else if (action === "finalize_report") {
    const submittedReport = String(payload.report || "").trim();
    if (submittedReport) update.report = submittedReport;
    if (String(payload.report_pdf_url || "").trim()) update.report_file_url = String(payload.report_pdf_url).trim();
    if (!request.report && !request.report_file_url && !submittedReport && !update.report_file_url) {
      throw new Error("Submit the radiology report before finalizing it.");
    }
    update.final_report_datetime = now;
  } else {
    update[t.field] = now;
  }

  update.status_history = historyEntry(
    request, action, String(request.workflow_status), t.to, actor.name, actor.role,
    String(payload.note || payload.reason || payload.clarification || "")
  );

  await base44.asServiceRole.entities.ImagingRequest.update(request.id, update);

  try {
    await logClinicalAudit(base44, {
      actor_user_id: actor.userId,
      actor_name: actor.name,
      actor_role: actor.role === "department" ? "radiology_department" : actor.role,
      action: `imaging_${action}`,
      action_label: t.label,
      patient_id: request.patient_id,
      patient_cin: request.patient_cin,
      patient_name: request.patient_name,
      encounter_id: request.encounter_id || "",
      document_id: request.request_id,
      hospital: request.routed_hospital || request.doctor_hospital || "",
    });
  } catch (e) {
    // Audit logging must never block the clinical transition.
  }

  const notifyDoctor = async (type: string, title: string, message: string) => {
    if (!request.doctor_user_id) return;
    try {
      await base44.asServiceRole.entities.DoctorNotification.create({
        doctor_user_id: request.doctor_user_id,
        doctor_id: request.doctor_id,
        type,
        title,
        message,
        patient_id: request.patient_id,
        patient_name: request.patient_name,
        patient_cin: request.patient_cin,
        imaging_request_id: request.id,
        request_ref: request.request_id,
        scan_type: request.scan_type,
        examination: request.examination,
        target: "find_patient",
        datetime: now,
        is_read: false,
      });
    } catch (e) { /* non-blocking */ }
  };
  const notifyPatient = async (type: string, title: string, message: string) => {
    try {
      await base44.asServiceRole.entities.PatientNotification.create({
        patient_id: request.patient_id,
        type,
        title,
        message,
        target: "imaging",
        related_id: request.id,
        event_date: now.slice(0, 10),
      });
    } catch (e) { /* non-blocking */ }
  };

  if (action === "request_clarification") {
    await notifyDoctor("imaging_clarification", "Clarification Required on Imaging Request",
      `The radiology department at ${request.routed_hospital || "the facility"} requested clarification on ${request.request_id}: ${update.clarification_request}`);
  }
  if (action === "cancel") {
    await notifyDoctor("imaging_cancelled", "Imaging Request Cancelled",
      `${request.request_id} (${request.scan_type} — ${request.examination}) was cancelled by the radiology department. Reason: ${update.cancel_reason}`);
  }
  if (action === "finalize_report") {
    await notifyDoctor("imaging_report_finalized", "Radiology Report Finalized",
      `The final report for ${request.request_id} (${request.scan_type} — ${request.examination}) for ${request.patient_name} is finalized.`);
    await notifyPatient("imaging_report_finalized", "Your Imaging Report Is Ready",
      "The final report for your imaging is finalized and will be released to your record.");
  }
  if (action === "release") {
    await notifyPatient("imaging_report_released", "Imaging Report Released",
      "Your final imaging report was released to your patient record.");
  }

  return { ...request, ...update };
}

// Internal study assignment — assign / reassign / claim / unassign, always
// recorded with who, when and why. Prevents silent concurrent reporting:
// a study can only ever be assigned to one radiologist at a time.
export async function setAssignment(base44: any, request: any, assignment: Record<string, any>) {
  // Concurrency guard — the claim check ran moments ago on a possibly stale
  // read. Re-read the study immediately before writing: of two radiologists
  // claiming the same study simultaneously, only the one that still finds it
  // unassigned succeeds; the other receives a 409.
  if (assignment.action === "claimed") {
    const fresh = await base44.asServiceRole.entities.ImagingRequest.filter({ id: request.id });
    const current = fresh[0];
    if (current && current.assigned_radiologist_user_id) {
      const err: any = new Error(
        current.assigned_radiologist_user_id === assignment.radiologist_user_id
          ? "This study is already assigned to you."
          : "This study was just claimed by another radiologist."
      );
      err.statusCode = 409;
      throw err;
    }
  }
  const now = nowIso();
  const history = Array.isArray(request.assignment_history) ? [...request.assignment_history] : [];
  history.push({
    action: assignment.action,
    radiologist_user_id: assignment.radiologist_user_id || "",
    radiologist_name: assignment.radiologist_name || "",
    by_name: assignment.by_name || "",
    reason: assignment.reason || "",
    datetime: now,
  });
  const update: Record<string, any> = { assignment_history: history, updated_datetime: now };
  if (assignment.action === "unassigned") {
    update.assigned_radiologist_user_id = null;
    update.assigned_radiologist_name = null;
    update.assigned_datetime = null;
  } else {
    update.assigned_radiologist_user_id = assignment.radiologist_user_id;
    update.assigned_radiologist_name = assignment.radiologist_name;
    update.assigned_datetime = now;
    // The radiologist who claims the study becomes its reporting radiologist —
    // the study moves to Reporting in Progress automatically.
    if (assignment.action === "claimed" &&
        ["ready_for_reporting", "performed", "examination_completed"].includes(canonicalStage(request.workflow_status))) {
      update.workflow_status = "reporting_in_progress";
      update.reporting_datetime = now;
      update.status_history = historyEntry(
        request, "claim_study", String(request.workflow_status), "reporting_in_progress",
        assignment.radiologist_name, "radiologist", assignment.reason || "Claimed the study for reporting"
      );
    }
  }
  await base44.asServiceRole.entities.ImagingRequest.update(request.id, update);
  try {
    await base44.asServiceRole.entities.RadiologistNotification.create({
      radiologist_user_id: assignment.radiologist_user_id,
      type: "radiology_record",
      title: assignment.action === "claimed" ? "Study Claimed" : "Study Assigned to You",
      message: `${request.request_id} (${request.scan_type} — ${request.examination}) for ${request.patient_name}${assignment.action === "claimed" ? " — you claimed this study" : " — assigned to you"}.`,
      patient_id: request.patient_id,
      patient_name: request.patient_name,
      target: "my_patients",
      related_id: request.id,
      datetime: now,
      is_read: false,
    });
  } catch (e) { /* non-blocking */ }
  return { ...request, ...update };
}