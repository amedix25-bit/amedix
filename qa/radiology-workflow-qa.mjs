// Radiology workflow chain checks. These run the REAL shared workflow module
// against in-memory fixtures — no database, no network, no live patient
// records. They assert every transition of the chain
//   submitted → accepted → scheduled → examination in progress →
//   examination completed → images received and verified → ready for reporting →
//   reporting in progress → awaiting signature → signed and completed
// and that reporting stays locked with a clear reason whenever the examination
// is not completed or the images are not received and verified.
import {
  applyTransition, autoReadyForReporting, canonicalStage, reportingLockReason,
  setAssignment, TRANSITIONS,
} from "../base44/shared/radiologyWorkflow.ts";

let pass = 0;
const fails = [];
const check = (cond, msg) => (cond ? (pass += 1) : fails.push(msg));

// ----- A service-role stub that records writes instead of persisting them -----
function makeBase44(record) {
  const writes = [];
  return {
    writes,
    asServiceRole: {
      entities: {
        ImagingRequest: {
          filter: async () => [{ ...record }],
          update: async (id, data) => {
            writes.push(data);
            Object.assign(record, data);
            return { ...record };
          },
        },
        RadiologistNotification: { create: async () => ({}) },
        DoctorNotification: { create: async () => ({}) },
        PatientNotification: { create: async () => ({}) },
        ClinicalAuditLog: { create: async () => ({}) },
        AccountAuditLog: { create: async () => ({}) },
      },
    },
  };
}

const base = {
  id: "test-request",
  request_id: "IR-TEST-0001",
  patient_id: "test-patient",
  patient_name: "Test Patient",
  patient_cin: "TST-000-001",
  doctor_user_id: "doctor-user",
  doctor_name: "Dr Test",
  routed_hospital: "Test Hospital",
  routed_hospital_user_id: "hospital-user",
  workflow_status: "requested",
  image_file_urls: [],
  status_history: [],
  assignment_history: [],
};

const dept = { name: "Test Radiology Department", role: "department", userId: "dept-user" };
const rad = { name: "Dr Radiologist", role: "radiologist", userId: "rad-user" };

async function step(record, action, actor, payload = {}) {
  const base44 = makeBase44(record);
  await applyTransition(base44, record, action, { ...actor, payload });
  return record;
}

// ===== 1. The whole chain, transition by transition =====
{
  const r = { ...base };
  check(canonicalStage(r.workflow_status) === "requested", "starts at Submitted");

  // Reported lock before the examination exists.
  const lockAtStart = reportingLockReason(r);
  check(!!lockAtStart && /examination has not been completed/i.test(lockAtStart),
    "reporting is locked while only submitted, with an explanation");

  await step(r, "accept", dept);
  check(r.workflow_status === "accepted" && !!r.accepted_datetime, "Submitted → Accepted");

  await step(r, "schedule", dept, { scheduled_for: new Date().toISOString() });
  check(r.workflow_status === "scheduled" && !!r.scheduled_datetime, "Accepted → Scheduled");

  await step(r, "start_examination", dept);
  check(r.workflow_status === "in_progress" && !!r.in_progress_datetime, "Scheduled → Examination in Progress");

  await step(r, "complete_examination", dept);
  check(r.workflow_status === "images_awaiting_transfer" && !!r.performed_datetime,
    "Examination in Progress → Examination Completed");

  // Examination completed but no images: still locked, still says what is missing.
  const base44NoImages = makeBase44(r);
  const notAdvanced = await autoReadyForReporting(base44NoImages, r);
  check(notAdvanced.workflow_status === "images_awaiting_transfer",
    "no automatic unlock without images");
  const lockNoImages = reportingLockReason(r);
  check(!!lockNoImages && /no study images/i.test(lockNoImages),
    "locked with a clear 'images missing' explanation");

  // Images received and verified → automatic Ready for Reporting.
  r.image_file_urls = ["mp/private/test/study-1.dcm"];
  const base44Images = makeBase44(r);
  await autoReadyForReporting(base44Images, r);
  check(r.workflow_status === "ready_for_reporting", "images verified → automatically Ready for Reporting");
  check(!!r.ready_datetime, "ready-for-reporting timestamp recorded");
  check(r.status_history.some((h) => h.action === "images_verified"), "images verification recorded in the audit trail");
  check(reportingLockReason(r) === null, "reporting unlocked once ready for reporting");

  // First radiologist claims → Reporting in Progress, assignment recorded.
  const base44Claim = makeBase44(r);
  await setAssignment(base44Claim, r, {
    action: "claimed", radiologist_user_id: "rad-user", radiologist_name: "Dr Radiologist",
    by_name: "Dr Radiologist", reason: "Claimed from the worklist",
  });
  check(r.assigned_radiologist_user_id === "rad-user", "claim assigns the reporting radiologist");
  check(r.workflow_status === "reporting_in_progress", "Ready for Reporting → Reporting in Progress on claim");
  check(Array.isArray(r.status_history) && r.status_history.some((h) => h.action === "claim_study"),
    "claim recorded in the status history");

  // A second claim is refused.
  let conflict = "";
  try {
    const base44Second = makeBase44(r);
    await setAssignment(base44Second, { ...r, assigned_radiologist_user_id: null }, {
      action: "claimed", radiologist_user_id: "other-rad", radiologist_name: "Dr Other",
    });
  } catch (e) {
    conflict = e.message;
  }
  check(/already assigned|just claimed/i.test(conflict), "a second radiologist cannot claim the same study");

  // Interpretation submitted → Awaiting Signature, then signed → Signed and Completed.
  await step(r, "submit_for_signature", rad, { report: "Findings: normal.\nImpression: normal study." });
  check(r.workflow_status === "awaiting_signature" &&
    r.status_history.some((h) => h.action === "submit_for_signature" && !!h.datetime),
    "Reporting in Progress → Awaiting Signature, with a timestamp");

  await step(r, "finalize_report", rad, { report: "Findings: normal.\nImpression: normal study." });
  check(r.workflow_status === "final_report" && !!r.final_report_datetime,
    "Awaiting Signature → Signed and Completed");

  await step(r, "release", dept);
  check(r.workflow_status === "released" && !!r.released_datetime, "Signed and Completed → Released");

  // Every transition left history behind.
  const actions = r.status_history.map((h) => h.action);
  for (const a of ["accept", "schedule", "start_examination", "complete_examination", "submit_for_signature", "finalize_report", "release"]) {
    check(actions.includes(a), `audit trail records "${a}"`);
  }
}

// ===== 2. Locked stages refuse the reporting transitions =====
{
  const r = { ...base };
  let refused = "";
  try {
    await step(r, "start_reporting", rad);
  } catch (e) { refused = e.message; }
  check(/not available now/i.test(refused), "reporting cannot start from Submitted");

  let refusedSign = "";
  try {
    await step({ ...base, workflow_status: "accepted" }, "submit_for_signature", rad, { report: "x" });
  } catch (e) { refusedSign = e.message; }
  check(/not available now/i.test(refusedSign), "awaiting-signature transition refused before reporting");

  let refusedFinalize = "";
  try {
    await step({ ...base, workflow_status: "ready_for_reporting" }, "finalize_report", rad, {});
  } catch (e) { refusedFinalize = e.message; }
  check(/Submit the radiology report/i.test(refusedFinalize), "an empty report cannot be signed");
}

// ===== 3. The declared chain matches the requested one =====
{
  check(TRANSITIONS.accept.to === "accepted", "accept → accepted");
  check(TRANSITIONS.schedule.to === "scheduled", "schedule → scheduled");
  check(TRANSITIONS.start_examination.to === "in_progress", "start_examination → in progress");
  check(TRANSITIONS.complete_examination.to === "images_awaiting_transfer", "complete_examination → examination completed");
  check(TRANSITIONS.submit_for_signature.to === "awaiting_signature", "submit_for_signature → awaiting signature");
  check(TRANSITIONS.finalize_report.to === "final_report", "finalize_report → signed and completed");
  check(TRANSITIONS.finalize_report.from.includes("awaiting_signature"), "signing is allowed from awaiting signature");
  check(TRANSITIONS.finalize_report.require_assignment === true, "only the assigned radiologist may sign");
  check(TRANSITIONS.submit_for_signature.require_assignment === true, "only the assigned radiologist may submit for signature");
}

if (fails.length) {
  console.error(`✗ ${fails.length} radiology workflow checks failed:`);
  fails.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
console.log(`✓ ${pass} radiology workflow checks passed.`);