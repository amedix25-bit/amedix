// AMedix — patient isolation (cross-patient access) regression test.
//
// Run: npx esbuild qa/patient-isolation-qa.mjs --bundle --platform=node --format=esm \
//        --alias:@=./src --loader:.ts=ts --outfile=/tmp/isolationqa.mjs && node /tmp/isolationqa.mjs
//
// Everything asserted here is a property of the SHIPPED code: the one ownership
// rule in base44/shared/patientOwnership.ts, and the call sites that must use
// it. Any check that cannot be proved fails — it never passes silently.
import fs from "node:fs";
import path from "node:path";
import {
  checkAgainstPatient,
  partitionOwnedRecords,
} from "../base44/shared/patientOwnership.ts";

// Run from the app root (the bundle itself may be written anywhere).
const ROOT = process.cwd();
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

let passed = 0;
const failures = [];
const check = (name, condition, detail = "") => {
  if (condition) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
};

// ===== Synthetic patients — two different people, two different CINs =====
const patientA = { id: "pat_A", cin: "AM-2026001", user_id: "user_A", full_name: "Patient A" };
const patientB = { id: "pat_B", cin: "AM-2026002", user_id: "user_B", full_name: "Patient B" };

const imagingA = {
  id: "img_A1",
  request_id: "IR-A1",
  patient_id: patientA.id,
  patient_cin: patientA.cin,
  patient_user_id: patientA.user_id,
};
const imagingB = {
  id: "img_B1",
  request_id: "IR-B1",
  patient_id: patientB.id,
  patient_cin: patientB.cin,
  patient_user_id: patientB.user_id,
};
// A record whose patient id points at A but which carries B's CIN — the exact
// shape a mislinked or reused patient identifier produces.
const imagingPoisoned = {
  id: "img_X",
  request_id: "IR-X",
  patient_id: patientA.id,
  patient_cin: patientB.cin,
};
// A record with no patient link at all.
const imagingOrphan = { id: "img_O", request_id: "IR-O", patient_cin: patientA.cin };

// ===== 1. The rule itself =====
check("own patient's record verifies", checkAgainstPatient(patientA, imagingA).ok === true);
check("record carrying another patient's CIN is refused",
  checkAgainstPatient(patientA, imagingPoisoned).reason === "cin_mismatch");
check("record with another patient's id is refused when viewing A",
  checkAgainstPatient(patientA, imagingB, { expectedPatientId: patientA.id }).ok === false);
check("record with no patient link is refused",
  checkAgainstPatient(patientA, imagingOrphan).reason === "record_has_no_patient");
check("missing record is refused", checkAgainstPatient(patientA, null).reason === "record_missing");
check("missing patient is refused",
  checkAgainstPatient(null, imagingA).reason === "patient_not_found");
check("a patient with no CIN cannot own records",
  checkAgainstPatient({ ...patientA, cin: "" }, imagingA).reason === "patient_has_no_cin");
check("mismatched patient account is refused",
  checkAgainstPatient(patientA, { ...imagingA, patient_user_id: patientB.user_id }).reason ===
    "owner_user_mismatch");
check("CIN compared ignoring case and spacing",
  checkAgainstPatient(patientA, { ...imagingA, patient_cin: "  am-2026001 " }).ok === true);
check("unverifiable record (no CIN, no account) is refused",
  checkAgainstPatient(patientA, { id: "x", patient_id: patientA.id }).reason === "unverifiable");
check("an expected CIN that differs from the profile is refused",
  checkAgainstPatient(patientA, imagingA, { expectedCin: patientB.cin }).reason ===
    "expected_cin_mismatch");

// ===== 2. Cross-patient listing — the original incident =====
const caseload = [imagingA, imagingB, imagingPoisoned, imagingOrphan];
const forA = partitionOwnedRecords(patientA, caseload);
check("viewing patient A returns only A's own request",
  forA.owned.length === 1 && forA.owned[0].id === imagingA.id,
  forA.owned.map((r) => r.id).join(","));
check("patient B's request never appears under patient A",
  !forA.owned.some((r) => r.id === imagingB.id));
check("every refused row is reported with a reason (never silently shown)",
  forA.refused.length === 3 && forA.refused.every((r) => r.reason && r.id));
const forB = partitionOwnedRecords(patientB, caseload);
check("viewing patient B returns only B's own request",
  forB.owned.length === 1 && forB.owned[0].id === imagingB.id);

// ===== 3. Opening another patient's study while viewing A =====
const viewA = { expectedPatientId: patientA.id };
check("patient B's study cannot be opened from patient A's profile",
  checkAgainstPatient(patientB, imagingB, viewA).reason === "different_patient");
check("substituting a request id does not grant access to another patient",
  checkAgainstPatient(patientA, { ...imagingB, patient_id: patientB.id }, viewA).ok === false);

// ===== 4. Server-side enforcement is present at every imaging surface =====
const guarded = [
  "base44/functions/radiologyFileAccess/entry.ts",
  "base44/functions/radiologyStudyContext/entry.ts",
  "base44/functions/radiologyStudyDownload/entry.ts",
  "base44/functions/radiologyPacsAccess/entry.ts",
];
guarded.forEach((file) => {
  const src = read(file);
  check(`${path.basename(path.dirname(file))} verifies patient ownership`,
    /verifyPatientOwnership\s*\(/.test(src));
  check(`${path.basename(path.dirname(file))} audits refused access`,
    /logOwnershipDenial\s*\(/.test(src));
});

const medicalData = read("base44/functions/doctorPatientMedicalData/entry.ts");
check("doctor patient data filters every list through the ownership rule",
  /partitionOwnedRecords\s*\(/.test(medicalData));
check("doctor patient data no longer returns unfiltered imaging rows",
  !/^\s*imaging,\s*$/m.test(medicalData));

// ===== 5. The View Images listing is patient-scoped inside a profile =====
const imagingList = read("src/components/doctor/DoctorImagingRequests.jsx");
check("imaging list queries by the patient being viewed",
  /filter\(\s*\{\s*patient_id:\s*patientId\s*\}/.test(imagingList));
check("imaging list drops rows whose patient id or CIN does not match",
  /String\(r\.patient_id \|\| ""\) !== patientId/.test(imagingList) &&
    /recordCin === patientCin/.test(imagingList));
check("the doctor's whole caseload is only queried when no patient is open",
  /patientId\s*\n?\s*\?\s*await base44\.entities\.ImagingRequest\.filter\(\{ patient_id: patientId \}/.test(
    imagingList
  ));

const recordView = read("src/components/doctor/DoctorPatientRecordView.jsx");
check("the patient profile passes the patient into the imaging section",
  /<DoctorImagingRequests[^>]*patient=\{patient\}/.test(recordView));

const shared = read("src/components/doctor/DoctorSharedImagingResults.jsx");
check("shared imaging results are filtered to the open patient",
  /patientId \? list\.filter\(/.test(shared));

const history = read("src/components/doctor/patients/DoctorPatientHistorySection.jsx");
check("patient history clears the previous patient before loading the next",
  /setEvents\(null\)/.test(history) && /setRecordData\(null\)/.test(history));

// ===== Report =====
console.log(`patient isolation QA — ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  failures.forEach((f) => console.log(`  FAIL  ${f}`));
  process.exit(1);
}
console.log("  all cross-patient access checks passed");