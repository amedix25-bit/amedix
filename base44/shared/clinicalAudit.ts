// Shared clinical-system helpers: unique AMedix reference IDs and the
// comprehensive clinical audit log. Every important clinical action is
// recorded with who did it, when, where (hospital/department) and which
// patient/encounter/document it concerns.
//
// Audit logging never breaks the clinical flow — a logging failure is
// swallowed on purpose (the clinical write already succeeded).

// Generates a unique AMedix reference, e.g. ENC-20260916-8F3K or
// AMD-20260916-8F3K — cryptographically random suffix, checked for
// uniqueness by the caller when needed.
export function generateClinicalRef(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  let rand = "";
  for (let i = 0; i < 4; i++) rand += alphabet[bytes[i] % alphabet.length];
  return `${prefix}-${date}-${rand}`;
}

// Records one audit entry. Written with the service role — clients can never
// forge or delete audit records (Row Level Security allows admin writes only).
export async function logClinicalAudit(base44: any, entry: any): Promise<void> {
  try {
    await base44.asServiceRole.entities.ClinicalAuditLog.create({
      actor_user_id: entry.actor_user_id || "",
      actor_name: entry.actor_name || "",
      actor_role: entry.actor_role || "doctor",
      action: entry.action,
      action_label: entry.action_label || entry.action,
      patient_id: entry.patient_id || "",
      patient_cin: entry.patient_cin || "",
      patient_name: entry.patient_name || "",
      encounter_id: entry.encounter_id || "",
      document_id: entry.document_id || "",
      hospital: entry.hospital || "",
      department: entry.department || "",
      datetime: new Date().toISOString(),
    });
  } catch (e) {
    // Never break the clinical flow on audit failure.
  }
}