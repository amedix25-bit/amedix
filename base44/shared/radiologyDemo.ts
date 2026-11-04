// Demonstration environment rules for the Radiology Portal.
//
// A facility starts in DEMONSTRATION mode: only clearly fictional patients and
// synthetic DICOM studies exist, no real PACS is contacted and real patient
// images cannot be imported. The facility moves to VERIFICATION (real PACS
// connectivity may be tested against the vendor's own endpoint) and finally to
// LIVE (real patients) only once the infrastructure, permissions and security
// have been verified. The mode is stored server-side and enforced here — never
// in the browser.
//
// The synthetic studies are real DICOM Part 10 files built element by element,
// so seeding a demonstration facility exercises the very same upload → private
// storage → authorized import → parse → patient-match pipeline used for real
// studies. Nothing is faked on the import path.

export const DEMO_CIN_PREFIX = "DEMO-";
export const DEMO_NAME_PREFIX = "[DEMO]";

export type DeploymentMode = "demonstration" | "verification" | "live";

const MODES: DeploymentMode[] = ["demonstration", "verification", "live"];

export function deploymentModeOf(settings: any): DeploymentMode {
  const raw = String((settings && settings.deployment_mode) || "demonstration");
  return (MODES.includes(raw as DeploymentMode) ? raw : "demonstration") as DeploymentMode;
}

// A record is demonstration data when it was created from the demonstration
// patient set — identified by the reserved CIN prefix, never by free text.
export function isDemoPatient(patient: any): boolean {
  if (!patient) return false;
  return String(patient.cin || "").toUpperCase().startsWith(DEMO_CIN_PREFIX);
}

export async function readDeploymentMode(base44: any, hospitalUserId: string): Promise<DeploymentMode> {
  if (!hospitalUserId) return "demonstration";
  try {
    const page = await base44.asServiceRole.entities.RadiologySettings.filter(
      { hospital_user_id: hospitalUserId },
      { limit: 1 }
    );
    const rows = Array.isArray(page) ? page : (page && page.items) || [];
    return deploymentModeOf(rows[0]);
  } catch (err) {
    return "demonstration";
  }
}

// ---------------------------------------------------------------------------
// Fictional patients — no real person is represented by these records.
// ---------------------------------------------------------------------------

export const DEMO_PATIENTS = [
  {
    cin: "DEMO-0001",
    full_name: "[DEMO] Fictional Patient Alpha",
    dicom_name: "ALPHA^FICTIONAL^PATIENT",
    date_of_birth: "1979-04-12",
    gender: "female",
    sex: "F",
  },
  {
    cin: "DEMO-0002",
    full_name: "[DEMO] Fictional Patient Bravo",
    dicom_name: "BRAVO^FICTIONAL^PATIENT",
    date_of_birth: "1965-11-02",
    gender: "male",
    sex: "M",
  },
  {
    cin: "DEMO-0003",
    full_name: "[DEMO] Fictional Patient Charlie",
    dicom_name: "CHARLIE^FICTIONAL^PATIENT",
    date_of_birth: "1991-07-23",
    gender: "male",
    sex: "M",
  },
  {
    cin: "DEMO-0004",
    full_name: "[DEMO] Fictional Patient Delta",
    dicom_name: "DELTA^FICTIONAL^PATIENT",
    date_of_birth: "1988-02-09",
    gender: "female",
    sex: "F",
  },
];

export type DemoStudyPlan = {
  patient_index: number;
  modality: string;
  study_description: string;
  accession_number: string;
  series: { description: string; number: number; images: number }[];
};

export const DEMO_STUDIES: DemoStudyPlan[] = [
  {
    patient_index: 0,
    modality: "CT",
    study_description: "CT Brain without contrast (demonstration)",
    accession_number: "DEMO-ACC-1001",
    series: [
      { description: "Axial 5 mm", number: 1, images: 2 },
      { description: "Coronal reformats", number: 2, images: 1 },
    ],
  },
  {
    patient_index: 1,
    modality: "DX",
    study_description: "Chest X-Ray PA erect (demonstration)",
    accession_number: "DEMO-ACC-1002",
    series: [{ description: "PA erect", number: 1, images: 2 }],
  },
  {
    patient_index: 2,
    modality: "MR",
    study_description: "MRI Lumbar Spine (demonstration)",
    accession_number: "DEMO-ACC-1003",
    series: [
      { description: "Sagittal T2", number: 1, images: 2 },
      { description: "Axial T2", number: 2, images: 1 },
    ],
  },
  {
    patient_index: 3,
    modality: "US",
    study_description: "Obstetric Ultrasound (demonstration)",
    accession_number: "DEMO-ACC-1004",
    series: [{ description: "Transabdominal", number: 1, images: 2 }],
  },
];

// ---------------------------------------------------------------------------
// Synthetic DICOM writing (explicit VR little endian, uncompressed)
// ---------------------------------------------------------------------------

const TEXT = new TextEncoder();

const SHORT_VR = new Set([
  "AE", "AS", "AT", "CS", "DA", "DS", "DT", "FL", "FD", "IS", "LO", "LT",
  "PN", "SH", "SL", "SS", "ST", "TM", "UI", "UL", "US",
]);

const SOP_CLASS: Record<string, string> = {
  CT: "1.2.840.10008.5.1.4.1.1.2",
  MR: "1.2.840.10008.5.1.4.1.1.4",
  DX: "1.2.840.10008.5.1.4.1.1.1.1",
  CR: "1.2.840.10008.5.1.4.1.1.1",
  US: "1.2.840.10008.5.1.4.1.1.6.1",
  MG: "1.2.840.10008.5.1.4.1.1.1.2",
};

function textBytes(value: string, pad: number): Uint8Array {
  const raw = TEXT.encode(value);
  if (raw.length % 2 === 0) return raw;
  const out = new Uint8Array(raw.length + 1);
  out.set(raw, 0);
  out[raw.length] = pad;
  return out;
}

// Explicit VR little endian: tag and lengths are written low byte first,
// exactly as a DICOM reader (AMedix's included) expects them.
function writeHeader(out: number[], group: number, element: number, vr: string, length: number) {
  out.push(group & 0xff, (group >> 8) & 0xff, element & 0xff, (element >> 8) & 0xff);
  out.push(vr.charCodeAt(0), vr.charCodeAt(1));
  if (SHORT_VR.has(vr)) {
    out.push(length & 0xff, (length >> 8) & 0xff);
  } else {
    out.push(0x00, 0x00, length & 0xff, (length >>> 8) & 0xff, (length >>> 16) & 0xff, (length >>> 24) & 0xff);
  }
}

function textElement(out: number[], group: number, element: number, vr: string, value: string) {
  const bytes = textBytes(value, vr === "UI" ? 0x00 : 0x20);
  writeHeader(out, group, element, vr, bytes.length);
  bytes.forEach((b) => out.push(b));
}

function binaryElement(out: number[], group: number, element: number, vr: string, bytes: Uint8Array) {
  writeHeader(out, group, element, vr, bytes.length);
  bytes.forEach((b) => out.push(b));
}

function usElement(out: number[], group: number, element: number, value: number) {
  writeHeader(out, group, element, "US", 2);
  out.push(value & 0xff, (value >> 8) & 0xff);
}

function ulElement(out: number[], group: number, element: number, value: number) {
  writeHeader(out, group, element, "UL", 4);
  out.push(value & 0xff, (value >> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function newUid(root: string): string {
  const stamp = Date.now().toString();
  const random = String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
  return `${root}.${stamp}.${random}`;
}

function compactDate(iso: string): string {
  return String(iso).slice(0, 10).replace(/-/g, "");
}

type BuildParams = {
  sop_class_uid: string;
  sop_instance_uid: string;
  study_instance_uid: string;
  series_instance_uid: string;
  study_date: string;
  accession_number: string;
  modality: string;
  study_description: string;
  series_description: string;
  series_number: number;
  instance_number: number;
  patient_name: string;
  patient_id: string;
  patient_birth_date: string;
  patient_sex: string;
};

function buildDicomFile(p: BuildParams): Uint8Array {
  const meta: number[] = [];
  binaryElement(meta, 0x0002, 0x0001, "OB", new Uint8Array([0x00, 0x01]));
  textElement(meta, 0x0002, 0x0002, "UI", p.sop_class_uid);
  textElement(meta, 0x0002, 0x0003, "UI", p.sop_instance_uid);
  textElement(meta, 0x0002, 0x0010, "UI", "1.2.840.10008.1.2.1");
  textElement(meta, 0x0002, 0x0012, "UI", "1.2.826.0.1.3680043.10.999.1");

  const out: number[] = [];
  for (let i = 0; i < 128; i += 1) out.push(0);
  ["D", "I", "C", "M"].forEach((c) => out.push(c.charCodeAt(0)));
  ulElement(out, 0x0002, 0x0000, meta.length);
  meta.forEach((b) => out.push(b));

  textElement(out, 0x0008, 0x0016, "UI", p.sop_class_uid);
  textElement(out, 0x0008, 0x0018, "UI", p.sop_instance_uid);
  textElement(out, 0x0008, 0x0020, "DA", p.study_date);
  textElement(out, 0x0008, 0x0030, "TM", "120000");
  textElement(out, 0x0008, 0x0050, "SH", p.accession_number);
  textElement(out, 0x0008, 0x0060, "CS", p.modality);
  textElement(out, 0x0008, 0x0070, "LO", "AMedix Synthetic Imaging");
  textElement(out, 0x0008, 0x0090, "PN", "DEMO^REFERRING^CLINICIAN");
  textElement(out, 0x0008, 0x1030, "LO", p.study_description);
  textElement(out, 0x0008, 0x103e, "LO", p.series_description);
  textElement(out, 0x0010, 0x0010, "PN", p.patient_name);
  textElement(out, 0x0010, 0x0020, "LO", p.patient_id);
  textElement(out, 0x0010, 0x0030, "DA", p.patient_birth_date);
  textElement(out, 0x0010, 0x0040, "CS", p.patient_sex);
  textElement(out, 0x0020, 0x000d, "UI", p.study_instance_uid);
  textElement(out, 0x0020, 0x000e, "UI", p.series_instance_uid);
  textElement(out, 0x0020, 0x0011, "IS", String(p.series_number));
  textElement(out, 0x0020, 0x0013, "IS", String(p.instance_number));
  usElement(out, 0x0028, 0x0002, 1);
  textElement(out, 0x0028, 0x0004, "CS", "MONOCHROME2");
  usElement(out, 0x0028, 0x0010, 2);
  usElement(out, 0x0028, 0x0011, 2);
  usElement(out, 0x0028, 0x0100, 8);
  usElement(out, 0x0028, 0x0101, 8);
  usElement(out, 0x0028, 0x0102, 7);
  usElement(out, 0x0028, 0x0103, 0);
  binaryElement(out, 0x7fe0, 0x0010, "OB", new Uint8Array([0x40, 0x80, 0x40, 0x80]));

  return Uint8Array.from(out);
}

export type DemoStudyFiles = {
  patient: (typeof DEMO_PATIENTS)[number];
  modality: string;
  study_description: string;
  accession_number: string;
  study_instance_uid: string;
  files: { file_name: string; sop_instance_uid: string; bytes: Uint8Array }[];
};

// One complete synthetic study: a fresh Study Instance UID, one Series Instance
// UID per series, one SOP Instance UID per image.
export function buildDemoStudyFiles(plan: DemoStudyPlan, studyDateIso: string): DemoStudyFiles {
  const patient = DEMO_PATIENTS[plan.patient_index];
  const sopClass = SOP_CLASS[plan.modality] || SOP_CLASS.DX;
  const studyUid = newUid("1.2.826.0.1.3680043.10.999.1");
  const files: DemoStudyFiles["files"] = [];
  let instance = 0;

  plan.series.forEach((series) => {
    const seriesUid = newUid("1.2.826.0.1.3680043.10.999.2");
    for (let i = 0; i < series.images; i += 1) {
      instance += 1;
      const sopUid = newUid("1.2.826.0.1.3680043.10.999.3");
      const bytes = buildDicomFile({
        sop_class_uid: sopClass,
        sop_instance_uid: sopUid,
        study_instance_uid: studyUid,
        series_instance_uid: seriesUid,
        study_date: compactDate(studyDateIso),
        accession_number: plan.accession_number,
        modality: plan.modality,
        study_description: plan.study_description,
        series_description: series.description,
        series_number: series.number,
        instance_number: instance,
        patient_name: patient.dicom_name,
        patient_id: patient.cin,
        patient_birth_date: compactDate(patient.date_of_birth),
        patient_sex: patient.sex,
      });
      files.push({ file_name: `${patient.cin}-${plan.accession_number}-I${String(instance).padStart(3, "0")}.dcm`, sop_instance_uid: sopUid, bytes });
    }
  });

  return {
    patient,
    modality: plan.modality,
    study_description: plan.study_description,
    accession_number: plan.accession_number,
    study_instance_uid: studyUid,
    files,
  };
}

// ---------------------------------------------------------------------------
// Staged rollout — the order the portal is verified in before real PACS work.
// ---------------------------------------------------------------------------

export const DEMO_STAGES = [
  {
    key: "dashboard_data",
    label: "Stage 1 — Dashboard & database",
    detail: "Facility-isolated studies, series, staff, audit and settings records.",
  },
  {
    key: "worklist",
    label: "Stage 2 — Imaging worklist",
    detail: "Requests and the single examination → reporting → release chain.",
  },
  {
    key: "viewer",
    label: "Stage 3 — DICOM viewer",
    detail: "Stored studies opened in the facility's own viewer or RadiAnt.",
  },
  {
    key: "manual_import",
    label: "Stage 4 — Manual DICOM import",
    detail: "Verified DICOM files, duplicate detection, patient matching.",
  },
  {
    key: "reporting",
    label: "Stage 5 — Reporting system",
    detail: "Report versions, signature and release, with the audit trail.",
  },
  {
    key: "portals",
    label: "Stage 6 — Patient & Doctor portal integration",
    detail: "Requests and released reports reach the referring doctor and patient.",
  },
  {
    key: "pacs",
    label: "Stage 7 — Real hospital PACS & RadiAnt",
    detail: "The facility's existing PACS and RadiAnt installation, verified with the vendor.",
  },
];