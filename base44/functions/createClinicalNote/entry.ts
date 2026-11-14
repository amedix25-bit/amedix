import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { findActiveCheckIn, gateBlocked } from "../../shared/hospitalAuth.ts";
import { generateClinicalRef, logClinicalAudit } from "../../shared/clinicalAudit.ts";

// Clinical note creation with the mandatory check-in gate. The backend
// independently verifies that an active check-in exists for this patient at
// the doctor's hospital BEFORE the note is created — no frontend state, URL
// or crafted request can bypass it.
//
// UNIVERSAL INFORMATION STAYS CONNECTED: the backend auto-attaches the
// AMedix universal context to every note — patient name, CIN, date of birth,
// allergies, active medications, previous history, doctor, specialty,
// hospital, department, the encounter the note belongs to (an active
// encounter is reused, or one is opened automatically), an AMedix note
// reference and the doctor's electronic signature. The doctor never
// re-enters any of it manually; only the specialty-specific clinical content
// comes from the form.
const asStringArray = (v: any) =>
  Array.isArray(v) ? v.map((x: any) => String(x ?? "").trim()).filter(Boolean) : [];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const payload = body && typeof body === "object" ? body : {};
    if (!payload.patient_id || !payload.doctor_id) {
      return Response.json({ error: "Patient and doctor are required." }, { status: 400 });
    }

    // The doctor profile must belong to the signed-in user.
    const doctors = await base44.asServiceRole.entities.DoctorProfile.filter({ id: String(payload.doctor_id) });
    if (doctors.length === 0 || doctors[0].user_id !== user.id) {
      return Response.json({ error: "Doctor profile not found." }, { status: 403 });
    }
    const doctor = doctors[0];

    const checkin = await findActiveCheckIn(base44, payload.patient_id, doctor.hospital);
    if (!checkin) return gateBlocked();

    const patients = await base44.asServiceRole.entities.PatientProfile.filter({ id: String(payload.patient_id) });
    if (patients.length === 0) return Response.json({ error: "Patient not found." }, { status: 404 });
    const patient = patients[0];

    // Universal clinical context — snapshotted from the unified AMedix
    // Patient Record at note time so every note is self-contained and stays
    // connected to the same patient record.
    const [activeMeds, conditions, encounters] = await Promise.all([
      base44.asServiceRole.entities.Medication.filter({ patient_id: patient.id, is_active: true }).catch(() => []),
      base44.asServiceRole.entities.MedicalCondition.filter({ patient_id: patient.id }).catch(() => []),
      base44.asServiceRole.entities.Encounter.filter(
        { patient_id: patient.id, doctor_id: doctor.id, status: "active" },
        "-encounter_datetime",
        1
      ).catch(() => []),
    ]);

    // The note automatically belongs to the correct encounter: the doctor's
    // active encounter for this patient, or a new one opened automatically.
    let encounter = encounters[0] || null;
    if (!encounter) {
      const now = new Date();
      encounter = await base44.asServiceRole.entities.Encounter.create({
        encounter_id: generateClinicalRef("ENC"),
        patient_id: patient.id,
        patient_user_id: patient.user_id || "",
        patient_cin: patient.cin || "",
        patient_name: patient.full_name || "",
        patient_dob: patient.date_of_birth || "",
        hospital: doctor.hospital || "",
        hospital_user_id: checkin.hospital_user_id || "",
        department: doctor.specialization || "",
        doctor_id: doctor.id,
        doctor_user_id: user.id,
        doctor_name: doctor.full_name || "",
        doctor_specialty: doctor.specialization || "",
        encounter_type: "consultation",
        status: "active",
        chief_complaint: String(payload.diagnosis || ""),
        encounter_datetime: now.toISOString(),
        encounter_date: now.toISOString().slice(0, 10),
        encounter_time: now.toISOString().slice(11, 16),
      });
    }

    // Prescribed medications ride along with the note; the note and the
    // medications are written server-side (service role) — direct client-side
    // writes are blocked by Row Level Security.
    const { medications, ...notePayload } = payload;

    // ---- ICD-11 coding, re-validated server-side --------------------------
    // The coded diagnoses come from the note form but are never trusted as sent:
    // only ICD-11 MMS entries carrying a documented term are kept, the system is
    // fixed to ICD-11 MMS, and the mapping state is constrained. A code is never
    // created, completed or substituted from a description — an entry the
    // clinician could not map stays unresolved with no code.
    const MAP_STATES = ["verified", "review_required", "unresolved"];
    const coded = (Array.isArray(payload.icd11_coded_diagnoses) ? payload.icd11_coded_diagnoses : [])
      .filter((d: any) => d && String(d.display || "").trim())
      .slice(0, 40)
      .map((d: any) => ({
        field_key: String(d.field_key || ""),
        code: String(d.code || "").trim(),
        display: String(d.display || "").trim(),
        system: "ICD-11-MMS",
        system_uri: "http://id.who.int/icd/release/11/mms",
        release: String(d.release || ""),
        source: String(d.source || ""),
        verified_date: String(d.verified_date || ""),
        coding_note: String(d.coding_note || ""),
        specificity: String(d.specificity || ""),
        role: String(d.role || ""),
        status: String(d.status || ""),
        mapping_state: MAP_STATES.includes(d.mapping_state)
          ? d.mapping_state
          : String(d.code || "").trim()
            ? "review_required"
            : "unresolved",
        basis: String(d.basis || ""),
        follow_up: String(d.follow_up || ""),
        // WHO provenance, the official record detail and the append-only coding
        // history are stored with the code so a later coding review can see what
        // the code was verified against and what it replaced. Nothing here is
        // derived or completed server-side.
        who_uri: String(d.who_uri || ""),
        who_browser_url: String(d.who_browser_url || ""),
        definition: String(d.definition || ""),
        inclusions: asStringArray(d.inclusions).slice(0, 40),
        exclusions: asStringArray(d.exclusions).slice(0, 40),
        index_terms: asStringArray(d.index_terms).slice(0, 40),
        ancestors: Array.isArray(d.ancestors)
          ? d.ancestors.slice(0, 12).map((a: any) => ({
              uri: String(a?.uri || ""),
              code: String(a?.code || ""),
              display: String(a?.display || ""),
            }))
          : [],
        cluster: String(d.cluster || ""),
        language: String(d.language || ""),
        retrieved_at: String(d.retrieved_at || ""),
        detail_status: String(d.detail_status || ""),
        coding_history: Array.isArray(d.coding_history)
          ? d.coding_history.slice(-25).map((h: any) => ({
              datetime: String(h?.datetime || ""),
              from_code: String(h?.from_code || ""),
              from_display: String(h?.from_display || ""),
              from_cluster: String(h?.from_cluster || ""),
              to_code: String(h?.to_code || ""),
              to_display: String(h?.to_display || ""),
              to_cluster: String(h?.to_cluster || ""),
              note: String(h?.note || ""),
            }))
          : [],
      }));
    notePayload.icd11_coded_diagnoses = coded;

    const now = new Date();
    notePayload.patient_id = patient.id;
    notePayload.patient_cin = patient.cin || "";
    notePayload.patient_name = patient.full_name || "";
    notePayload.patient_dob = patient.date_of_birth || "";
    notePayload.doctor_name = doctor.full_name || "";
    notePayload.hospital = doctor.hospital || "";
    notePayload.department = doctor.specialization || "";
    notePayload.encounter_id = encounter.encounter_id || "";
    notePayload.note_reference = generateClinicalRef("CN");
    notePayload.allergies = patient.allergies || "";
    notePayload.current_medications = activeMeds.map((m) => m.name).filter(Boolean);
    notePayload.previous_history = conditions.map((c) => c.name).filter(Boolean).join("; ");
    // Saving the note applies the doctor's electronic signature automatically.
    notePayload.signed_by_name = doctor.full_name || "";
    notePayload.signed_datetime = now.toISOString();
    const note = await base44.asServiceRole.entities.ClinicalNote.create(notePayload);

    const meds = Array.isArray(medications) ? medications : [];
    if (meds.length > 0) {
      await base44.asServiceRole.entities.Medication.bulkCreate(
        meds.map((m) => ({ ...m, patient_user_id: patient.user_id || "" }))
      );

      // Every medication prescribed in the note is also issued as an electronic
      // prescription, so it reaches the patient's own prescription list (and can
      // be dispensed) instead of living only inside the note and the medication
      // list. The note is signed by the prescribing doctor, and the prescription
      // carries that doctor and encounter, so the two documents always agree.
      const ROUTES = [
        "oral",
        "intravenous",
        "intramuscular",
        "subcutaneous",
        "topical",
        "inhalation",
        "rectal",
        "ophthalmic",
        "otic",
        "nasal",
        "other",
      ];
      const day = now.toISOString().slice(0, 10);
      const stamp = day.replace(/-/g, "");
      try {
        await base44.asServiceRole.entities.Prescription.bulkCreate(
          meds
            .filter((m: any) => String(m?.name || "").trim())
            .map((m: any, index: number) => ({
              prescription_id: `PR-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}${index}`,
              patient_id: patient.id,
              patient_user_id: patient.user_id || "",
              patient_cin: patient.cin || "",
              patient_name: patient.full_name || "",
              patient_dob: patient.date_of_birth || "",
              doctor_id: doctor.id,
              doctor_user_id: user.id,
              doctor_name: doctor.full_name || "",
              doctor_specialization: doctor.specialization || "",
              doctor_hospital: doctor.hospital || "",
              encounter_id: encounter.encounter_id || "",
              medication_name: String(m.name || "").trim(),
              active_ingredient: String(m.active_ingredient || "").trim(),
              strength: String(m.strength || "").trim(),
              dosage: String(m.dose || "").trim(),
              ...(ROUTES.includes(m.route) ? { route: m.route } : {}),
              frequency: String(m.prn ? "As needed (PRN)" : m.frequency || "").trim(),
              duration: String(m.duration || "").trim(),
              quantity: String(m.quantity || "").trim(),
              special_instructions: [m.special_instructions, m.notes]
                .map((v: any) => String(v || "").trim())
                .filter(Boolean)
                .join(" · "),
              date_prescribed: day,
              prescribed_datetime: now.toISOString(),
              status: "issued",
            }))
        );
      } catch (e) {
        // The note and the medication list are already saved; the prescription
        // rows are logged rather than failing the clinician's note.
        console.log("PRESCRIPTION-FROM-NOTE-ERROR:", e && e.message);
      }
    }

    await logClinicalAudit(base44, {
      actor_user_id: user.id,
      actor_name: doctor.full_name,
      actor_role: "doctor",
      action: "created_clinical_note",
      action_label: "created a clinical note",
      patient_id: patient.id,
      patient_cin: patient.cin,
      patient_name: patient.full_name,
      encounter_id: encounter.encounter_id || "",
      hospital: doctor.hospital || "",
      department: doctor.specialization || "",
    });

    // Coding provenance is audited separately, so the trail answers "which code,
    // from which release, verified against what, and was it reviewed".
    if (coded.length > 0) {
      const awaitingReview = coded.filter((d) => d.mapping_state !== "verified").length;
      await logClinicalAudit(base44, {
        actor_user_id: user.id,
        actor_name: doctor.full_name,
        actor_role: "doctor",
        action: "coded_clinical_diagnosis",
        action_label:
          `recorded ${coded.length} ICD-11 MMS diagnosis code(s), release ${coded[0].release || "not stated"}` +
          (awaitingReview ? `, ${awaitingReview} awaiting coding review` : ""),
        patient_id: patient.id,
        patient_user_id: patient.user_id || "",
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        encounter_id: encounter.encounter_id || "",
        document_id: note.id,
        hospital: doctor.hospital || "",
        department: doctor.specialization || "",
      });

      // The coded diagnosis is written into the patient's own record with its
      // provenance, so the note and the record carry the same ICD-11 code. Only
      // a diagnosis the clinician CONFIRMED as primary or secondary is mirrored:
      // suspected, differential and unresolved entries stay on the note and are
      // never promoted into the patient's confirmed problem list.
      const existingDiags = await base44.asServiceRole.entities.Diagnosis
        .filter({ patient_id: patient.id })
        .catch(() => []);
      const seenCodes = new Set(
        existingDiags.map((x: any) => String(x.icd11_code || "").trim().toUpperCase()).filter(Boolean)
      );
      const seenNames = new Set(
        existingDiags.map((x: any) => String(x.diagnosis_name || "").trim().toLowerCase()).filter(Boolean)
      );
      for (const d of coded) {
        if (d.status !== "Confirmed" || !["Primary", "Secondary"].includes(d.role)) continue;
        const codeKey = d.code ? d.code.toUpperCase() : "";
        const nameKey = d.display.toLowerCase();
        if ((codeKey && seenCodes.has(codeKey)) || seenNames.has(nameKey)) continue;
        await base44.asServiceRole.entities.Diagnosis
          .create({
            patient_id: patient.id,
            patient_user_id: patient.user_id || "",
            patient_cin: patient.cin || "",
            patient_name: patient.full_name || "",
            doctor_id: doctor.id,
            doctor_name: doctor.full_name || "",
            diagnosis_name: d.display,
            diagnosis_type: d.role === "Primary" ? "Primary" : "Secondary",
            created_datetime: now.toISOString(),
            description: d.basis,
            assessment: d.basis,
            treatment_plan: d.follow_up,
            icd11_code: d.code,
            icd11_display: d.display,
            icd11_system: d.system,
            icd11_system_uri: d.system_uri,
            icd11_release: d.release,
            icd11_source: d.source,
            icd11_mapping_state: d.mapping_state,
            icd11_verified_date: d.verified_date,
            icd11_note_reference: note.note_reference || "",
            icd11_encounter_id: note.encounter_id || "",
          })
          .catch(() => null);
        if (codeKey) seenCodes.add(codeKey);
        seenNames.add(nameKey);
      }
    }

    return Response.json({ note, checkin_id: checkin.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}