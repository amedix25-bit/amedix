// ONE patient-ownership rule for every patient-data read in AMedix.
//
// Every clinical record (imaging request, study, report, laboratory result,
// prescription, note, document, encounter) must belong to the EXACT patient it
// is shown under. A record is only ever served when its own patient link is
// internally consistent:
//
//   record.patient_id  → an existing PatientProfile
//   record.patient_cin → that profile's CIN (never a different patient's)
//   record.patient_user_id → that profile's account (never a different account)
//
// When a caller knows which patient the user is looking at, the record must
// resolve to that same patient id. Anything that cannot be conclusively
// established is refused — the rule is FAIL-CLOSED: a missing patient, a
// missing CIN, a mismatched CIN, a mismatched account or a different patient id
// all deny the record. There is no "best guess" and no fallback to a request
// number, doctor, hospital, department or modality.
import { logClinicalAudit } from "./clinicalAudit.ts";

const norm = (value: any) => String(value ?? "").trim().toUpperCase();

export type OwnershipReason =
  | "verified"
  | "record_missing"
  | "record_has_no_patient"
  | "patient_not_found"
  | "patient_has_no_cin"
  | "different_patient"
  | "cin_mismatch"
  | "owner_user_mismatch"
  | "expected_cin_mismatch"
  | "unverifiable";

export type OwnershipResult = {
  ok: boolean;
  reason: OwnershipReason;
  patient?: any;
};

// Loads the patient record a clinical record claims to belong to.
export async function loadPatient(base44: any, patientId: any): Promise<any | null> {
  const id = String(patientId || "").trim();
  if (!id) return null;
  const sr = base44.asServiceRole || base44;
  try {
    const rows = await sr.entities.PatientProfile.filter({ id });
    return (rows && rows[0]) || null;
  } catch (e) {
    return null;
  }
}

// PURE comparison against an already-loaded patient record — the rule itself,
// with no database access, so it can be unit tested and reused everywhere.
export function checkAgainstPatient(
  patient: any,
  record: any,
  options: { expectedPatientId?: string; expectedCin?: string } = {}
): OwnershipResult {
  if (!record) return { ok: false, reason: "record_missing" };
  const patientId = String(record.patient_id || "").trim();
  if (!patientId) return { ok: false, reason: "record_has_no_patient" };
  if (!patient || !patient.id) return { ok: false, reason: "patient_not_found" };
  if (String(patient.id) !== patientId) return { ok: false, reason: "patient_not_found", patient };

  const patientCin = norm(patient.cin);
  if (!patientCin) return { ok: false, reason: "patient_has_no_cin", patient };

  const expectedPatientId = String(options.expectedPatientId || "").trim();
  if (expectedPatientId && expectedPatientId !== patient.id) {
    return { ok: false, reason: "different_patient", patient };
  }

  const recordCin = norm(record.patient_cin);
  if (recordCin && recordCin !== patientCin) return { ok: false, reason: "cin_mismatch", patient };

  // A record carrying a patient account must carry THIS patient's account.
  const recordUser = String(record.patient_user_id || "").trim();
  const patientUser = String(patient.user_id || "").trim();
  if (recordUser && patientUser && recordUser !== patientUser) {
    return { ok: false, reason: "owner_user_mismatch", patient };
  }

  // No CIN and no account on the record: its patient link cannot be proven.
  if (!recordCin && !recordUser) return { ok: false, reason: "unverifiable", patient };

  const expectedCin = norm(options.expectedCin);
  if (expectedCin && expectedCin !== patientCin) return { ok: false, reason: "expected_cin_mismatch", patient };

  return { ok: true, reason: "verified", patient };
}

// Verifies one record, loading its patient first. Pass `cache` (a Map) to reuse
// patient lookups inside one request.
export async function verifyPatientOwnership(
  base44: any,
  record: any,
  options: { expectedPatientId?: string; expectedCin?: string; cache?: Map<string, any> } = {}
): Promise<OwnershipResult> {
  if (!record) return { ok: false, reason: "record_missing" };
  const patientId = String(record.patient_id || "").trim();
  if (!patientId) return { ok: false, reason: "record_has_no_patient" };

  let patient = null;
  const cache = options.cache;
  if (cache && cache.has(patientId)) {
    patient = cache.get(patientId);
  } else {
    patient = await loadPatient(base44, patientId);
    if (cache) cache.set(patientId, patient);
  }
  return checkAgainstPatient(patient, record, options);
}

// Splits a list of records into those provably owned by `patient` and those
// refused. The refused list carries only ids and reasons — never clinical
// content — so a caller can report a data-integrity problem without exposing it.
export function partitionOwnedRecords(
  patient: any,
  records: any[],
  options: { expectedPatientId?: string; expectedCin?: string } = {}
): { owned: any[]; refused: { id: string; reason: OwnershipReason }[] } {
  const owned: any[] = [];
  const refused: { id: string; reason: OwnershipReason }[] = [];
  (records || []).forEach((record) => {
    const check = checkAgainstPatient(patient, record, {
      expectedPatientId: options.expectedPatientId || patient?.id,
      expectedCin: options.expectedCin || patient?.cin,
    });
    if (check.ok) owned.push(record);
    else refused.push({ id: String(record?.id || ""), reason: check.reason });
  });
  return { owned, refused };
}

// Records a refused access attempt in the clinical audit trail. The entry holds
// who asked, which record was refused and why — never the other patient's name,
// CIN or any clinical content.
export async function logOwnershipDenial(
  base44: any,
  entry: {
    user?: any;
    actor_role?: string;
    module: string;
    record_id?: string;
    record_ref?: string;
    reason: OwnershipReason | string;
    expected_patient_id?: string;
    patient_id?: string;
    hospital?: string;
  }
): Promise<void> {
  await logClinicalAudit(base44, {
    actor_user_id: entry.user?.id || "",
    actor_name: entry.user?.full_name || entry.user?.email || "",
    actor_role: entry.actor_role || entry.user?.role || "user",
    action: "patient_isolation_denied",
    action_label: `refused access to a record that could not be proven to belong to the patient being viewed (${entry.module})`,
    patient_id: entry.patient_id || entry.expected_patient_id || "",
    document_id: entry.record_id || entry.record_ref || "",
    hospital: entry.hospital || "",
  });
}