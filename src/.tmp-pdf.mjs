import { generateClinicalNotePdf } from "@/lib/clinicalNotePdf";

const base = {
  id: "tmp1",
  note_reference: "CN-20261114-8F3K",
  patient_id: "p1",
  patient_name: "Mariam Abdulla",
  patient_cin: "CIN-2026-1001",
  patient_dob: "1994-03-02",
  doctor_name: "Aisha Ben Ali",
  specialty: "obstetrics_gynecology",
  department: "Obstetrics & Gynaecology",
  hospital: "Tripoli Central Hospital",
  document_type: "obgyn_antenatal_followup",
  document_type_label: "Antenatal Follow-Up",
  date: "2026-11-14",
  encounter_datetime: "2026-11-14T08:15:00.000Z",
  allergies: "",
  current_medications: [],
  signed_by_name: "Aisha Ben Ali",
  signed_datetime: "2026-11-14T06:50:00.000Z",
  icd11_coded_diagnoses: [
    {
      code: "JA8B.1",
      display: "Placenta previa with hemorrhage",
      role: "Primary",
      status: "Confirmed",
      mapping_state: "review_required",
      basis: "Painless per vaginal bleeding at 32 weeks",
      follow_up: "Inpatient monitoring",
    },
  ],
  data: {
    gestational_age: { label: "Gestational Age", value: "32 weeks" },
    symptoms: { label: "Symptoms", value: "Painless per vaginal bleeding" },
    htn_disorder: { label: "Hypertensive Disorder Documented at This Encounter", value: "Not documented" },
    maternal_infection_status: { label: "Maternal Infection or Sepsis Status", value: "None documented" },
    ob_screening_followup: { label: "Follow-Up Action for the Results Above", value: "." },
    icd11_diagnoses: {
      label: "Diagnoses (ICD-11 MMS)",
      value:
        "JA8B.1 Placenta previa with hemorrhage — Primary · Confirmed — Mapping review required\nCoding review prompts (advisory — the clinician's documented diagnosis stands):\n   · A code was not verified",
    },
    obgyn_safety: {
      label: "Safety concerns and the prompts raised by the findings documented in this note",
      value:
        "[Act now] Ongoing heavy bleeding — Raised by the clinician for this encounter. Document the assessment, the action taken and who was involved. — Action documented: Bleeding was mild, conservative management continued\nSource: AMedix · build 3 · review pending",
    },
    examinations: {
      label: "Select Examination",
      value: '{"selected":["general"],"data":{"general":{"general_inspection":{"status":"normal"}}}}',
    },
    "exam.__exam_status": { label: "Exam status", value: "completed" },
    "exam.general_appearance": { label: "General Appearance", value: "Not in distress" },
  },
};

const run = async (note, tag) => {
  const doc = await generateClinicalNotePdf(note, { logo: {}, profile: { gender: "female", blood_type: "O+" } });
  const boxes = doc.__pdfBoxes || [];
  const byPage = {};
  boxes.forEach((b) => {
    if (!b.label) return;
    byPage[b.page] = byPage[b.page] || [];
    byPage[b.page].push(b.label);
  });
  const all = boxes.map((b) => String(b.label || "")).join(" | ");
  return {
    tag,
    pages: doc.getNumberOfPages(),
    issues: (doc.__pdfIssues || []).length,
    headings: [...new Set(boxes.filter((b) => b.kind === "heading").map((b) => b.label))],
    hasCodingPrompts: /Coding review prompts/i.test(all),
    hasBoilerplate: /Clinical judgement remains|not a statement that no urgent problem/i.test(all),
    hasRawJson: /"selected"/.test(all),
    hasExamStatus: /__exam_status|Exam status/i.test(all),
    hasNotDocumented: /Not documented/.test(all),
    hasNoneDocumented: /None documented/.test(all),
    hasSafetyAction: /Bleeding was mild/.test(all),
    signature: boxes.filter((b) => /ELECTRONICALLY SIGNED|SIGNING EVENT|Electronic Signature|Finalized record|Aisha|Obstetrics|Tripoli|signed/i.test(String(b.label || ""))).map((b) => b.label),
    lastPage: byPage[Math.max(...Object.keys(byPage).map(Number))] || [],
  };
};

const signed = await run(base, "signed");
console.log(JSON.stringify(signed, null, 1));
const unsigned = await run({ ...base, signed_datetime: "", signed_by_name: "" }, "unsigned");
console.log(JSON.stringify({ tag: unsigned.tag, signature: unsigned.signature }, null, 1));