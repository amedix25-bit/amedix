import { partitionOwnedRecords } from "./patientOwnership.ts";

// AMedix EMERGENCY PATIENT SUMMARY.
//
// One read-only projection of the patient's EXISTING records, assembled at the
// point of care for a live, patient-bound emergency session. Nothing is copied
// into a second clinical record, nothing is inferred, and every value keeps the
// wording, author, timestamp and provenance it already had in AMedix.
//
// Structure follows the Pan-Canadian Patient Summary (PS-CA) sections and the
// HL7 FHIR R4 resources they map to. AMedix stores its records in its own shape,
// so this is a MAPPING layer: terminology intent (FHIR resource, SNOMED CT /
// LOINC / UCUM where a code is genuinely known) is declared next to the original
// record instead of rewriting the record itself.

const DAY = 86400000;

export const BLOOD_GROUP_WARNING =
  "Blood group information in AMedix is for clinical reference only. Follow hospital transfusion protocols, including current patient identification, blood grouping, antibody screening and compatibility testing.";

export const NO_HISTORY_STATEMENT =
  "No relevant medical history documented in AMedix. This does not exclude an underlying condition.";

const txt = (v: unknown) => String(v == null ? "" : v).trim();
const iso = (v: unknown) => txt(v);

const ageFrom = (dob: string) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
};

const daysSince = (value: unknown) => {
  const t = new Date(txt(value)).getTime();
  if (!t || Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / DAY);
};

// High-risk medication groups that change emergency management. Matched on the
// medication name AND its active ingredient — never guessed from a diagnosis.
const HIGH_RISK: Array<{ group: string; re: RegExp }> = [
  { group: "Anticoagulant", re: /warfarin|apixaban|rivaroxaban|edoxaban|dabigatran|enoxaparin|heparin|acenocoumarol/i },
  { group: "Antiplatelet", re: /clopidogrel|ticagrelor|prasugrel|aspirin|acetylsalicylic|dipyridamole/i },
  { group: "Insulin", re: /insulin|glargine|aspart|lispro|detemir|degludec/i },
  { group: "Glucose-lowering", re: /metformin|gliclazide|glimepiride|glibenclamide|sitagliptin|empagliflozin|dapagliflozin|pioglitazone|liraglutide|semaglutide/i },
  { group: "Antiepileptic", re: /carbamazepine|valproate|valproic|phenytoin|levetiracetam|lamotrigine|topiramate|gabapentin|pregabalin|phenobarbital|lacosamide/i },
  { group: "Corticosteroid", re: /prednisolone|prednisone|dexamethasone|hydrocortisone|methylprednisolone|betamethasone/i },
  { group: "Immunosuppressant", re: /azathioprine|tacrolimus|cyclosporin|mycophenolate|sirolimus|everolimus|infliximab|adalimumab|rituximab|tofacitinib/i },
  { group: "Opioid", re: /morphine|tramadol|codeine|oxycodone|fentanyl|pethidine|methadone|buprenorphine|tapentadol/i },
  { group: "Chemotherapy", re: /methotrexate|tamoxifen|capecitabine|cisplatin|carboplatin|doxorubicin|cyclophosphamide|paclitaxel|imatinib|letrozole|anastrozole/i },
];

const highRiskGroup = (name: string, ingredient: string) => {
  const hay = `${name} ${ingredient}`;
  const hit = HIGH_RISK.find((h) => h.re.test(hay));
  return hit ? hit.group : "";
};

const DEVICE_RE = /pacemaker|icd\b|crt\b|implantable|defibrillator|mechanical valve|prosthetic valve|heart valve|stent|graft|port[- ]a[- ]cath|central line|shunt|coil|clip|screw|plate|prosthe|transplant|insulin pump|tracheostomy|peg\b|mesh|cochlear|implant/i;

const FAMILY_EMERGENCY_RE = /premature|sudden cardiac|sudden death|inherited|hereditary|bleeding|clotting|thrombophilia|haemophilia|hemophilia|cardiomyopathy|long qt|brugada|aneurysm|malignant hyperthermia|sickle/i;

const IMMUNIZATION_PRIORITY: Array<{ key: string; re: RegExp }> = [
  { key: "Tetanus", re: /tetanus|dtp|td\b|dTap/i },
  { key: "Hepatitis B", re: /hepatitis b|hbv/i },
  { key: "Influenza", re: /influenza|flu\b/i },
  { key: "COVID-19", re: /covid|sars-cov/i },
];

const priorityOf = (name: string) => {
  const idx = IMMUNIZATION_PRIORITY.findIndex((p) => p.re.test(name));
  return idx === -1 ? 99 : idx;
};

// Vitals documented in a clinical note are saved in one deterministic summary
// line by the note form. Only the parameters that are actually present are
// returned — nothing is calculated or filled in.
const VITAL_PATTERNS: Array<{ key: string; label: string; loinc: string; unit: string; ucum: string; re: RegExp }> = [
  { key: "blood_pressure", label: "Blood pressure", loinc: "85354-9", unit: "mmHg", ucum: "mm[Hg]", re: /BP:\s*([0-9]{2,3}\s*\/\s*[0-9]{2,3})/i },
  { key: "pulse", label: "Heart rate", loinc: "8867-4", unit: "bpm", ucum: "/min", re: /Pulse:\s*([0-9]{1,3})/i },
  { key: "temperature", label: "Temperature", loinc: "8310-5", unit: "°C", ucum: "Cel", re: /Temp:\s*([0-9]{2}(\.[0-9])?)/i },
  { key: "respiratory_rate", label: "Respiratory rate", loinc: "9279-1", unit: "breaths/min", ucum: "/min", re: /RR:\s*([0-9]{1,3})/i },
  { key: "spo2", label: "Oxygen saturation", loinc: "2708-6", unit: "%", ucum: "%", re: /SpO?₂?:\s*([0-9]{1,3})/i },
];

const parseVitals = (summary: string) => {
  const text = txt(summary);
  if (!text) return [];
  return VITAL_PATTERNS.map((p) => {
    const m = text.match(p.re);
    return m ? { key: p.key, label: p.label, value: m[1].replace(/\s+/g, ""), unit: p.unit, loinc: p.loinc, ucum: p.ucum } : null;
  }).filter(Boolean);
};

const section = (
  key: string,
  label: string,
  fhir: string,
  status: string,
  extra: Record<string, any> = {}
) => ({ key, label, fhir_resource: fhir, status, ...extra });

export async function buildEmergencyPatientSummary(base44: any, patient: any, session: any) {
  const sr = base44.asServiceRole || base44;
  const pull = async (entity: string, sort: string, limit: number) => {
    try {
      const rows: any = await sr.entities[entity].filter({ patient_id: patient.id }, sort, limit);
      const list = Array.isArray(rows) ? rows : (rows && rows.items) || [];
      return partitionOwnedRecords(patient, list).owned || [];
    } catch (e) {
      // A source that could not be read is reported as unavailable — never as
      // "no history".
      return null;
    }
  };

  const [allergyRows, medRows, conditionRows, surgeryRows, immunizationRows, familyRows, encounterRows, noteRows, labResultRows, labRequestRows, imagingRows, accessRows] =
    await Promise.all([
      pull("Allergy", "-created_date", 100),
      pull("Medication", "-created_date", 200),
      pull("MedicalCondition", "-created_date", 200),
      pull("SurgicalHistory", "-created_date", 100),
      pull("Immunization", "-created_date", 200),
      pull("FamilyHistory", "-created_date", 100),
      pull("Encounter", "-encounter_datetime", 20),
      pull("ClinicalNote", "-created_date", 20),
      pull("PatientLabResult", "-test_date", 10),
      pull("LabRequest", "-created_date", 40),
      pull("ImagingRequest", "-created_date", 40),
      (async () => {
        try {
          const rows = await sr.entities.AccessRequest.filter({ patient_id: patient.id, status: "approved" });
          return Array.isArray(rows) ? rows : (rows && rows.items) || [];
        } catch (e) {
          return null;
        }
      })(),
    ]);

  const unavailable = [
    allergyRows === null ? "Allergies and intolerances" : "",
    medRows === null ? "Medications" : "",
    conditionRows === null ? "Medical problems" : "",
    surgeryRows === null ? "Procedures and devices" : "",
    immunizationRows === null ? "Immunizations" : "",
    familyRows === null ? "Family history" : "",
    encounterRows === null ? "Recent encounters" : "",
    noteRows === null ? "Clinical notes" : "",
  ].filter(Boolean);

  const allergies = allergyRows || [];
  const medications = medRows || [];
  const conditions = conditionRows || [];
  const surgeries = surgeryRows || [];
  const immunizations = immunizationRows || [];
  const family = familyRows || [];
  const encounters = encounterRows || [];
  const notes = noteRows || [];

  // ── Patient identification ────────────────────────────────────────────────
  let photoUrl = "";
  if (txt(patient.photo_uri)) {
    try {
      const signed = await sr.integrations.Core.CreateFileSignedUrl({ file_uri: patient.photo_uri, expires_in: 900 });
      photoUrl = (signed && (signed.signed_url || signed.signedUrl)) || "";
    } catch (e) {
      photoUrl = "";
    }
  }

  const contacts = Array.isArray(patient.emergency_contacts) ? patient.emergency_contacts.filter((c: any) => txt(c && c.name)) : [];
  const primaryContact = contacts[0] || (txt(patient.emergency_contact_name)
    ? {
        name: patient.emergency_contact_name,
        relationship: patient.emergency_contact_relationship,
        phone: patient.emergency_contact_phone,
      }
    : null);

  const bloodType = txt(patient.blood_type);
  const bloodKnown = !!bloodType && bloodType.toLowerCase() !== "unknown";
  // A blood group only counts as verified when an AMedix laboratory result
  // actually documents it; otherwise it stays patient-recorded.
  const bloodGroupLab = (labRequestRows || []).find((r: any) =>
    (r.tests || []).some((t: any) => /blood group|abo|rh(d)?\b/i.test(txt(t && t.name))) &&
    (r.result_verified === true || !!txt(r.released_datetime))
  );
  const bloodVerified = !!bloodGroupLab;

  const identity = {
    patient_id: patient.id,
    name: txt(patient.full_name),
    name_ar: txt(patient.full_name_ar),
    photo_url: photoUrl,
    cin: txt(patient.cin),
    date_of_birth: iso(patient.date_of_birth),
    age: ageFrom(txt(patient.date_of_birth)),
    sex_recorded: txt(patient.gender),
    blood_group: bloodKnown ? bloodType : "",
    blood_group_known: bloodKnown,
    blood_group_verified: bloodVerified,
    blood_group_source: bloodVerified
      ? `Laboratory report ${txt(bloodGroupLab.report_id || bloodGroupLab.request_id) || ""}`.trim()
      : bloodKnown
        ? "Patient record (not verified by a laboratory result in AMedix)"
        : "Not documented",
    blood_group_recorded_at: bloodVerified ? txt(bloodGroupLab.released_datetime || bloodGroupLab.date_completed) : "",
    preferred_language: txt(patient.preferred_language) === "ar" ? "Arabic" : "English",
    nationality: txt(patient.nationality),
    emergency_contacts: contacts.map((c: any) => ({ name: txt(c.name), relationship: txt(c.relationship), phone: txt(c.phone) })),
    emergency_contact: primaryContact
      ? { name: txt(primaryContact.name), relationship: txt(primaryContact.relationship), phone: txt(primaryContact.phone) }
      : null,
    // A guardian / substitute decision-maker is not a distinct AMedix field; it
    // is only ever shown when the record actually names one.
    guardian: "",
    communication: [],
  };
  if (!txt(patient.preferred_language) || txt(patient.preferred_language) !== "en") {
    identity.communication.push({
      label: "Preferred language",
      value: identity.preferred_language,
      status: txt(patient.preferred_language) ? "documented" : "not_documented",
    });
  }
  identity.communication.push(
    { label: "Hearing", value: "", status: "not_documented" },
    { label: "Vision", value: "", status: "not_documented" },
    { label: "Speech", value: "", status: "not_documented" },
    { label: "Interpreter required", value: "", status: "not_documented" }
  );

  // ── Allergies and intolerances ────────────────────────────────────────────
  const allergyItems = allergies.map((a: any) => ({
    id: a.id,
    allergen: txt(a.allergen),
    type: txt(a.allergy_type),
    entry_type: txt(a.entry_type) || "confirmed_allergy",
    reaction: txt(a.reaction),
    severity: txt(a.severity),
    treatment_required: txt(a.treatment_required),
    recorded_at: txt(a.approx_date) || txt(a.created_date),
    source: txt(a.source) || "unspecified",
    verification: txt(a.source) === "clinician_documented" ? "clinician_documented" : "patient_reported",
    fhir: "AllergyIntolerance",
  }));
  const confirmedAllergies = allergyItems.filter((a: any) => a.entry_type !== "reported_side_effect");
  const intolerances = allergyItems.filter((a: any) => a.entry_type === "reported_side_effect");
  const severeReactions = allergyItems.filter((a: any) => a.severity === "severe");

  let allergyStatus = "unknown";
  if (allergyItems.length) allergyStatus = "documented";
  else if (txt(patient.allergy_record_status) === "no_known_allergies") allergyStatus = "no_known_allergies";
  else if (txt(patient.allergy_record_status) === "prefer_not_to_answer") allergyStatus = "unable_to_obtain";

  // ── Medications ───────────────────────────────────────────────────────────
  const medItem = (m: any) => ({
    id: m.id,
    name: txt(m.name),
    ingredient: txt(m.active_ingredient),
    kind: txt(m.medication_kind),
    dose: txt(m.dose),
    route: txt(m.route),
    frequency: txt(m.frequency),
    prn: m.prn === true,
    indication: txt(m.reason),
    status: txt(m.current_status) || (m.is_active === false ? "discontinued" : "taking"),
    source: txt(m.source) || "unspecified",
    prescribed_by: txt(m.prescribed_by),
    started: txt(m.start_date),
    ended: txt(m.end_date || m.stopped_date),
    stop_reason: txt(m.stop_reason),
    last_updated: txt(m.updated_date || m.created_date),
    high_risk: highRiskGroup(txt(m.name), txt(m.active_ingredient)),
    verification: txt(m.source) === "patient_reported" ? "patient_reported" : "prescribed_record",
    fhir: "MedicationStatement",
  });
  const meds = medications.map(medItem);
  const ACTIVE_STATUSES = ["taking", "taken_occasionally"];
  const isCurrent = (m: any) => ACTIVE_STATUSES.includes(m.status);
  const recentlyStopped = (m: any) => {
    if (m.status !== "discontinued") return false;
    const d = daysSince(m.ended || m.last_updated);
    return d !== null && d <= 90;
  };
  const currentMeds = meds.filter((m: any) => isCurrent(m) && m.source !== "patient_reported" && m.kind !== "non_prescription" && m.kind !== "vitamin_supplement" && m.kind !== "herbal");
  const patientReportedMeds = meds.filter((m: any) => isCurrent(m) && m.source === "patient_reported");
  const otcMeds = meds.filter((m: any) => isCurrent(m) && m.kind === "non_prescription" && m.source !== "patient_reported");
  const supplementMeds = meds.filter((m: any) => isCurrent(m) && ["vitamin_supplement", "herbal"].includes(m.kind));
  const stoppedMeds = meds.filter(recentlyStopped);
  const historicalMeds = meds.filter((m: any) => m.status === "discontinued" && !recentlyStopped(m));
  const highRiskMeds = meds.filter((m: any) => isCurrent(m) && m.high_risk);
  const lastMedication = medications
    .map((m: any) => txt(m.updated_date || m.created_date))
    .filter(Boolean)
    .sort()
    .reverse()[0];

  // ── Problems and family history ───────────────────────────────────────────
  const problemItems = conditions.map((c: any) => ({
    id: c.id,
    name: txt(c.name),
    name_ar: txt(c.name_ar),
    status: txt(c.current_status) || "unknown",
    category: txt(c.category),
    history_type: txt(c.history_type),
    since: txt(c.date),
    details: txt(c.details),
    treating_facility: txt(c.treating_facility),
    verification: "documented",
    source: "AMedix medical record",
    fhir: "Condition",
  }));
  const activeProblems = problemItems.filter((c: any) => ["active", "being_monitored"].includes(c.status));
  const resolvedProblems = problemItems.filter((c: any) => c.status === "resolved");
  const familyItems = family.map((f: any) => ({
    id: f.id,
    condition: txt(f.condition),
    condition_ar: txt(f.condition_ar),
    relation: txt(f.relation),
    age_at_diagnosis: txt(f.age_at_diagnosis),
    notes: txt(f.notes),
    emergency_relevant: FAMILY_EMERGENCY_RE.test(`${txt(f.condition)} ${txt(f.notes)}`),
    verification: "patient_reported",
    fhir: "FamilyMemberHistory",
  }));

  // ── Procedures, devices, anaesthesia ──────────────────────────────────────
  const procedureItems = surgeries.map((s: any) => {
    const implantText = txt(s.implants_devices);
    return {
      id: s.id,
      procedure: txt(s.surgery_type),
      procedure_ar: txt(s.surgery_type_ar),
      date: txt(s.surgery_date),
      reason: txt(s.reason),
      complications: txt(s.complications),
      outcome: txt(s.outcome),
      devices: implantText ? implantText.split(/[;,\n]/).map(txt).filter(Boolean) : [],
      anaesthesia_history: txt(s.anesthesia_history),
      anaesthesia_complications: txt(s.anesthesia_complications),
      difficult_airway: /difficult airway|difficult intubation/i.test(`${txt(s.anesthesia_history)} ${txt(s.anesthesia_complications)}`),
      malignant_hyperthermia: /malignant hyperthermia/i.test(`${txt(s.anesthesia_history)} ${txt(s.anesthesia_complications)}`),
      transfused: txt(s.transfusion_count) || txt(s.transfusion_type) ? true : false,
      transfusion_count: txt(s.transfusion_count),
      transfusion_type: txt(s.transfusion_type),
      transfusion_amount: txt(s.transfusion_amount),
      transfusion_reason: txt(s.transfusion_reason),
      transfusion_timing: txt(s.transfusion_timing),
      transfusion_reactions: txt(s.transfusion_reactions),
      verification: "documented",
      fhir: "Procedure",
    };
  });
  const deviceItems = procedureItems.flatMap((p: any) =>
    (p.devices || []).filter((d: string) => DEVICE_RE.test(d)).map((d: string) => ({ device: d, date: p.date, procedure: p.procedure, fhir: "Device" }))
  );
  const anaesthesiaFlags = procedureItems.filter((p: any) => p.difficult_airway || p.malignant_hyperthermia || p.anaesthesia_complications);

  // ── Immunizations ─────────────────────────────────────────────────────────
  const documentedVaccines = immunizations
    .filter((i: any) => txt(i.kind) === "vaccination" && txt(i.name))
    .map((i: any) => ({
      name: txt(i.name),
      date: txt(i.date),
      doses: "",
      notes: txt(i.result_notes),
      source: "AMedix immunization record",
      verification: "documented",
    }));
  const reportedVaccines = (Array.isArray(patient.vaccination_records) ? patient.vaccination_records : [])
    .filter((v: any) => txt(v && v.received) === "received")
    .map((v: any) => ({
      name: txt(v.other_label) || txt(v.vaccine).replace(/_/g, " "),
      date: txt(v.date),
      doses: txt(v.doses),
      notes: txt(v.notes),
      source: "Reported by the patient",
      verification: "patient_reported",
    }));
  const allVaccines = [...documentedVaccines, ...reportedVaccines].sort((a: any, b: any) => priorityOf(a.name) - priorityOf(b.name));

  // ── Vital signs ───────────────────────────────────────────────────────────
  const noteWithVitals = notes
    .filter((n: any) => txt(n.vital_signs))
    .sort((a: any, b: any) => String(b.created_date).localeCompare(String(a.created_date)))[0];
  const historicalVitals = noteWithVitals
    ? {
        status: "documented",
        at: txt(noteWithVitals.encounter_datetime) || txt(noteWithVitals.date) || txt(noteWithVitals.created_date),
        author: txt(noteWithVitals.doctor_name),
        source: "Clinical note",
        raw: txt(noteWithVitals.vital_signs),
        measurements: parseVitals(noteWithVitals.vital_signs).map((v: any) => ({ ...v, at: txt(noteWithVitals.date) || txt(noteWithVitals.created_date), source: "Clinical note" })),
      }
    : { status: "not_documented", at: "", author: "", source: "", raw: "", measurements: [] };

  const accessStart = new Date(txt(session.access_start)).getTime() || 0;
  const currentEpisodeNotes = notes.filter(
    (n: any) => txt(n.doctor_user_id) === txt(session.doctor_user_id) && new Date(txt(n.created_date)).getTime() >= accessStart
  );
  const currentNote = currentEpisodeNotes
    .filter((n: any) => txt(n.vital_signs))
    .sort((a: any, b: any) => String(b.created_date).localeCompare(String(a.created_date)))[0];
  const currentVitals = currentNote
    ? {
        status: "documented",
        at: txt(currentNote.created_date),
        author: txt(currentNote.doctor_name || session.doctor_name),
        source: "Emergency encounter documentation",
        raw: txt(currentNote.vital_signs),
        measurements: parseVitals(currentNote.vital_signs),
      }
    : { status: "not_documented", at: "", author: "", source: "", raw: "", measurements: [] };

  // ── Transfusion history ───────────────────────────────────────────────────
  const transfusions = procedureItems.filter((p: any) => p.transfused).map((p: any) => ({
    date: p.date,
    procedure: p.procedure,
    type: p.transfusion_type,
    amount: p.transfusion_amount,
    reason: p.transfusion_reason,
    timing: p.transfusion_timing,
    reactions: p.transfusion_reactions,
  }));

  // ── Women's health ────────────────────────────────────────────────────────
  const isFemale = txt(patient.gender) === "female";
  const gynae = patient.gynae_obstetric_history && typeof patient.gynae_obstetric_history === "object" ? patient.gynae_obstetric_history : {};
  const currentPregnancy = gynae.current_pregnancy || {};
  const gynaePast = gynae.past || {};
  const pregnancies = Array.isArray(gynae.obstetric && gynae.obstetric.pregnancies) ? gynae.obstetric.pregnancies : [];
  let pregnancyStatus = "not_assessed";
  const gynaePregnancy = txt(currentPregnancy.status);
  if (gynaePregnancy === "pregnant") pregnancyStatus = "pregnant";
  else if (gynaePregnancy === "not_pregnant") pregnancyStatus = "not_pregnant_confirmed";
  else if (gynaePregnancy === "unknown") pregnancyStatus = "unknown";
  else if (txt(patient.pregnancy_status) === "pregnant") pregnancyStatus = "pregnant";
  else if (txt(patient.pregnancy_status) === "not_pregnant") pregnancyStatus = "not_pregnancy_unspecified";
  else if (txt(patient.pregnancy_status) === "unknown") pregnancyStatus = "unknown";

  const womensHealth = isFemale
    ? {
        status: pregnancyStatus,
        status_confirmed_at: txt(gynae.updated_datetime) || txt(patient.updated_date),
        gestational_age: txt(currentPregnancy.gestational_age) || txt(patient.gestational_age),
        estimated_due_date: txt(currentPregnancy.edd) || txt(patient.estimated_due_date),
        last_menstrual_period: txt((gynae.menstrual && gynae.menstrual.lmp) || currentPregnancy.lmp),
        obstetric_summary: txt(patient.pregnancy_history),
        previous_ectopic: pregnancies.some((p: any) => txt(p.outcome) === "ectopic_pregnancy"),
        complications: txt(patient.pregnancy_complications),
        contraception: txt(patient.contraception_history) || txt(gynaePast.contraception_method).replace(/_/g, " "),
        fhir: "Observation/Pregnancy",
      }
    : { status: "not_applicable" };

  // ── Social and functional information ─────────────────────────────────────
  const smokingValue = txt(patient.smoking_status);
  const alcoholValue = txt(patient.alcohol_use);
  const social = {
    // A registration default ("never" / "none") with nothing behind it is shown
    // as recorded but not reconfirmed — never as a verified negative history.
    smoking: smokingValue
      ? `${smokingValue}${smokingValue === "never" && !txt(patient.tobacco_details) && !txt(patient.vaping_history) ? " (recorded, not reconfirmed)" : ""}`
      : "",
    tobacco_details: txt(patient.tobacco_details),
    alcohol: alcoholValue ? `${alcoholValue}${alcoholValue === "none" && !txt(patient.substance_use) ? " (recorded)" : ""}` : "",
    substance_use: txt(patient.substance_use),
    living_situation: txt(patient.living_situation_type).replace(/_/g, " "),
    living_details: txt(patient.living_situation),
    mobility: txt(patient.mobility_limitations),
    occupation: txt(patient.occupation),
    occupational_exposure: txt(patient.occupational_exposure),
    cognitive_impairment: "",
    caregiver_dependence: "",
    fhir: "Observation/SocialHistory",
  };
  const socialDocumented = ["smoking", "alcohol", "substance_use", "living_situation", "mobility"].filter((k) => txt((social as any)[k]));

  // ── Recent clinical information ───────────────────────────────────────────
  const recentEncounters = encounters.slice(0, 6).map((e: any) => ({
    id: e.id,
    reference: txt(e.encounter_id),
    at: txt(e.encounter_datetime) || txt(e.encounter_date),
    type: txt(e.encounter_type),
    department: txt(e.department),
    hospital: txt(e.hospital),
    doctor: txt(e.doctor_name),
    specialty: txt(e.doctor_specialty),
    presentation: txt(e.chief_complaint),
    status: txt(e.status),
    fhir: "Encounter",
  }));
  const recentLabs = (labRequestRows || [])
    .filter((r: any) => (r.result_verified === true || !!txt(r.released_datetime)) && txt(r.result))
    .slice(0, 5)
    .map((r: any) => ({
      id: r.id,
      at: txt(r.released_datetime) || txt(r.date_completed) || txt(r.date_requested),
      title: (r.tests || []).map((t: any) => txt(t && t.name)).filter(Boolean).join(", ") || "Laboratory report",
      summary: txt(r.result).slice(0, 400),
      source: txt(r.lab_name),
      fhir: "DiagnosticReport",
    }));
  const recentImaging = (imagingRows || [])
    .filter((r: any) => txt(r.report) && (r.workflow_status === "released" || txt(r.released_datetime) || r.status === "completed"))
    .slice(0, 5)
    .map((r: any) => ({
      id: r.id,
      at: txt(r.released_datetime) || txt(r.date_completed) || txt(r.date_requested),
      title: [txt(r.scan_type), txt(r.examination)].filter(Boolean).join(" · "),
      summary: txt(r.report).slice(0, 400),
      source: txt(r.routed_hospital || r.doctor_hospital),
      fhir: "ImagingStudy/DiagnosticReport",
    }));
  const olderLabResults = (labResultRows || []).slice(0, 5).map((l: any) => ({
    id: l.id,
    at: txt(l.test_date),
    title: txt(l.test_type),
    source: txt(l.lab_name),
  }));

  // ── Emergency warnings for the first screen ───────────────────────────────
  const warnings: Array<{ level: string; text: string }> = [];
  severeReactions.forEach((a: any) =>
    warnings.push({ level: "critical", text: `Severe documented allergy: ${a.allergen}${a.reaction ? ` (${a.reaction})` : ""}` })
  );
  if (confirmedAllergies.length && !severeReactions.length) {
    warnings.push({ level: "high", text: `${confirmedAllergies.length} documented allergy(ies) — confirm before prescribing` });
  }
  if (allergyStatus === "no_known_allergies") warnings.push({ level: "info", text: "No known allergies — explicitly documented" });
  if (allergyStatus !== "documented" && allergyStatus !== "no_known_allergies") {
    warnings.push({ level: "high", text: "Allergy status unknown — assess before administering any medication" });
  }
  highRiskMeds.forEach((m: any) => warnings.push({ level: "high", text: `High-risk medication: ${m.name} (${m.high_risk})` }));
  if (pregnancyStatus === "pregnant") warnings.push({ level: "high", text: "Patient is pregnant — consider pregnancy in every investigation and drug choice" });
  if (pregnancyStatus === "unknown" && isFemale) warnings.push({ level: "medium", text: "Pregnancy status unknown — do not assume the patient is not pregnant" });
  deviceItems.forEach((d: any) => warnings.push({ level: "medium", text: `Implanted device: ${d.device}` }));
  if (anaesthesiaFlags.some((p: any) => p.malignant_hyperthermia)) warnings.push({ level: "critical", text: "Documented malignant hyperthermia susceptibility" });
  if (anaesthesiaFlags.some((p: any) => p.difficult_airway)) warnings.push({ level: "critical", text: "Documented difficult airway" });

  // ── Section register with explicit statuses ───────────────────────────────
  const medsOutdated = lastMedication ? (daysSince(lastMedication) || 0) > 365 : false;
  const problemsLastUpdated = problemItems.map((p: any) => p.since).filter(Boolean).sort().reverse()[0] || "";

  const sections = [
    section("allergies", "Allergies and intolerances", "AllergyIntolerance", allergyStatus, {
      count: allergyItems.length,
      last_updated: allergyItems.map((a: any) => a.recorded_at).filter(Boolean).sort().reverse()[0] || "",
    }),
    section("medications", "Medication summary", "MedicationStatement", currentMeds.length || meds.length ? (medsOutdated ? "outdated" : "documented") : "not_documented", {
      count: currentMeds.length,
      last_updated: lastMedication || "",
    }),
    section("problems", "Active problems and medical history", "Condition", activeProblems.length ? "documented" : problemItems.length ? "documented" : "not_documented", {
      count: activeProblems.length,
      last_updated: problemsLastUpdated,
    }),
    section("procedures", "Procedures, surgery and devices", "Procedure", procedureItems.length ? "documented" : "not_documented", {
      count: procedureItems.length,
      last_updated: procedureItems.map((p: any) => p.date).filter(Boolean).sort().reverse()[0] || "",
    }),
    section("immunizations", "Immunization history", "Immunization", allVaccines.length ? "documented" : "not_documented", {
      count: allVaccines.length,
      last_updated: allVaccines.map((v: any) => v.date).filter(Boolean).sort().reverse()[0] || "",
    }),
    section("vitals", "Vital signs", "Observation", historicalVitals.status, {
      count: historicalVitals.measurements.length,
      last_updated: historicalVitals.at || "",
    }),
    section("transfusion", "Blood group and transfusion history", "Observation/Procedure", bloodKnown || transfusions.length ? "documented" : "not_documented", {
      count: transfusions.length,
      last_updated: transfusions.map((t: any) => t.date).filter(Boolean).sort().reverse()[0] || "",
    }),
    section("womens_health", "Women's health and pregnancy", "Observation/Pregnancy", isFemale ? pregnancyStatus : "not_applicable", {
      last_updated: isFemale ? txt(gynae.updated_datetime) : "",
    }),
    section("social", "Substance use and social information", "Observation/SocialHistory", socialDocumented.length ? "documented" : "not_documented", {
      count: socialDocumented.length,
    }),
    section("advance_care", "Advance care planning", "Consent/AdvanceDirective", "not_documented", { count: 0 }),
    section(
      "recent",
      "Recent clinical information",
      "Encounter/DiagnosticReport",
      recentEncounters.length || recentLabs.length || recentImaging.length ? "documented" : "not_documented",
      { count: recentEncounters.length + recentLabs.length + recentImaging.length }
    ),
  ];

  const fullRecordAuthorized = (accessRows || []).some((r: any) => txt(r.status) === "approved");

  return {
    meta: {
      generated_at: new Date().toISOString(),
      summary_version: "PS-CA-aligned mapping v1",
      emergency_session_ref: txt(session.session_ref),
      pathway: txt(session.pathway),
      access_start: txt(session.access_start),
      access_expires: txt(session.access_expires),
      hospital: txt(session.hospital_name),
      department: txt(session.department) || "Emergency Department",
      authorized_doctor: txt(session.doctor_name),
      authorized_doctor_license: txt(session.doctor_license),
      emergency_reason: txt(session.emergency_reason),
      patient_bound_to: patient.id,
      unavailable_sources: unavailable,
      empty_statement: NO_HISTORY_STATEMENT,
    },
    interoperability: {
      standard: "Pan-Canadian Patient Summary (PS-CA) — profile-aligned section mapping",
      fhir_version: "R4",
      terminologies: [
        "HL7 FHIR R4 resource shapes per section",
        "SNOMED CT intended for conditions and findings (AMedix keeps its own condition wording)",
        "LOINC on vital-sign observations where a parameter was documented",
        "UCUM units on every measured value",
        "Original AMedix wording, author, timestamp and provenance preserved next to each entry",
      ],
      note: "AMedix records are mapped, not rewritten: no clinical record is duplicated or restructured, so future interoperability can be added without data loss.",
    },
    identity,
    critical: {
      warnings,
      allergy_status: allergyStatus,
      allergies: confirmedAllergies.slice(0, 12),
      intolerances: intolerances.slice(0, 12),
      severe_reactions: severeReactions.slice(0, 8),
      high_risk_medications: highRiskMeds,
      active_problems: activeProblems.slice(0, 12),
      blood_group: bloodKnown ? bloodType : "",
      blood_group_verified: bloodVerified,
      emergency_contact: identity.emergency_contact,
    },
    sections,
    allergies: {
      status: allergyStatus,
      items: allergyItems,
      confirmed: confirmedAllergies,
      intolerances,
      serious_adverse_reactions: allergyItems.filter((a: any) => a.type === "drug" && a.severity === "severe"),
      fhir: "AllergyIntolerance",
    },
    medications: {
      status: currentMeds.length ? (medsOutdated ? "outdated" : "documented") : meds.length ? "documented" : "not_documented",
      current: currentMeds,
      patient_reported: patientReportedMeds,
      over_the_counter: otcMeds,
      supplements: supplementMeds,
      recently_stopped: stoppedMeds,
      historical: historicalMeds.slice(0, 20),
      high_risk: highRiskMeds,
      last_reconciled_at: lastMedication || "",
      last_reconciled_source: lastMedication ? "Most recent medication record update in AMedix" : "",
      note: "A prescribed medication is shown with the status the record carries; it is not assumed to be taken.",
      fhir: "MedicationStatement",
    },
    problems: {
      active: activeProblems,
      resolved: resolvedProblems,
      family_history: familyItems.sort((a: any, b: any) => Number(b.emergency_relevant) - Number(a.emergency_relevant)),
      fhir: "Condition",
    },
    procedures: {
      items: procedureItems,
      devices: deviceItems,
      anaesthesia_flags: anaesthesiaFlags.map((p: any) => ({
        procedure: p.procedure,
        date: p.date,
        difficult_airway: p.difficult_airway,
        malignant_hyperthermia: p.malignant_hyperthermia,
        complications: p.anaesthesia_complications,
        history: p.anaesthesia_history,
      })),
      fhir: "Procedure",
    },
    immunizations: {
      items: allVaccines,
      documented: documentedVaccines,
      patient_reported: reportedVaccines,
      note: "An absent immunization record is not evidence that the patient is unvaccinated.",
      fhir: "Immunization",
    },
    vitals: { historical: historicalVitals, current: currentVitals },
    transfusion: {
      blood_group: bloodKnown ? bloodType : "",
      verified: bloodVerified,
      source: identity.blood_group_source,
      recorded_at: identity.blood_group_recorded_at,
      previous_transfusions: transfusions,
      antibodies: "",
      warning: BLOOD_GROUP_WARNING,
      fhir: "Observation/Procedure",
    },
    womens_health: womensHealth,
    social,
    advance_care: {
      status: "not_documented",
      directives: [],
      substitute_decision_maker: "",
      note: "AMedix holds no advance care planning document, resuscitation order or treatment limitation for this patient. Absence of an order is never a treatment instruction — follow applicable clinical and legal requirements.",
      fhir: "Consent/AdvanceDirective",
    },
    recent: {
      encounters: recentEncounters,
      laboratory_reports: recentLabs,
      imaging_reports: recentImaging,
      laboratory_results: olderLabResults,
      note: "Source documents, discharge summaries and specialist reports open only through the full authorized record.",
      fhir: "Encounter/DiagnosticReport",
    },
    full_record_authorized: fullRecordAuthorized,
    access_policy:
      "Minimum necessary emergency information, assembled from this patient's existing AMedix records for one patient-bound emergency session. Documents, imaging archives, private notes and unrestricted history are not exposed here.",
  };
}