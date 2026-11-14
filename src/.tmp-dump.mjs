import { generateClinicalNotePdf } from "@/lib/clinicalNotePdf";
import { getDocDef } from "@/lib/specialtyDocuments";

const def = getDocDef("obgyn_antenatal_followup");
console.log(
  "template 'Select Examination' fields:",
  (def?.fields || [])
    .filter((f) => /select examination/i.test(`${f.label} ${f.section || ""}`))
    .map((f) => [f.key, f.type, f.label, f.section])
);

const note = {
  id: "t",
  note_reference: "CN-1",
  patient_name: "Mariam Abdulla",
  patient_cin: "CIN-1",
  doctor_name: "Aisha Ben Ali",
  specialty: "obstetrics_gynecology",
  hospital: "Tripoli Central Hospital",
  document_type: "obgyn_antenatal_followup",
  document_type_label: "Antenatal Follow-Up",
  date: "2026-11-14",
  signed_by_name: "Aisha Ben Ali",
  signed_datetime: "2026-11-14T06:50:00Z",
  data: {
    examinations: {
      label: "Select Examination",
      value: '{"selected":["general"],"data":{"general":{"general_inspection":{"status":"normal"}}}}',
    },
    "exam.general_appearance": { label: "General Appearance", value: "Not in distress" },
  },
};

const doc = await generateClinicalNotePdf(note, { logo: {} });
for (const b of doc.__pdfBoxes || []) console.log(b.page, b.kind, Math.round(b.top), "|", b.label);