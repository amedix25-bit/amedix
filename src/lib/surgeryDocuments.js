// General Surgery clinical document catalogue — the existing AMedix Surgical
// note types, strengthened in place. Note keys, names, navigation and the
// surrounding Specialty System are unchanged; only the clinical content of
// each note has been aligned with current guidance: ACS operative-report and
// informed-consent principles, ACS NSQIP / ERAS preoperative optimisation and
// VTE risk assessment, WHO Surgical Safety Checklist, SAGES laparoscopy
// documentation, ASCRS/SSAT/AHPBA hepatobiliary and colorectal practice,
// ASBrS breast-conserving and specimen-orientation standards, and EAST
// damage-control and trauma documentation where applicable.
//
// Fields are declared in the same shape the rest of the clinical system uses
// (key, label, type, options). An optional `section` groups related fields
// under a heading inside the same form — nothing else about the note changes.

const I = (key, label) => ({ key, label, type: "input" });
const N = (key, label) => ({ key, label, type: "number" });
const T = (key, label) => ({ key, label, type: "textarea" });
const S = (key, label, options) => ({ key, label, type: "select", options });

// Groups the following fields under one heading in the note.
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

const ASA = ["ASA I", "ASA II", "ASA III", "ASA IV", "ASA V", "ASA VI"];
const URGENCY = ["Elective", "Urgent", "Emergency"];
const LATERALITY = ["Not applicable", "Right", "Left", "Bilateral"];
const CLAVIEN = ["None", "I", "II", "IIIa", "IIIb", "IVa", "IVb", "V"];

export const SURGERY_DOCS = [
  {
    key: "surg_consultation", label: "Surgical Consultation", specialty: "surgery",
    fields: [
      ...sec("Referral & History", [
        I("referral_source", "Referral Source"),
        T("chief_complaint", "Chief Complaint"),
        T("hpi", "History of Present Illness"),
        T("pmh", "Past Medical History / Comorbidities"),
        T("surgical_history", "Past Surgical History (previous abdominal operations, adhesions)"),
        T("medications", "Current Medications (including anticoagulants and antiplatelets)"),
        T("allergies", "Allergies"),
        T("social_history", "Social History — Smoking, Alcohol, Functional Status"),
      ]),
      ...sec("Examination", [
        T("vitals", "Vital Signs"),
        T("review_of_systems", "Review of Systems"),
        T("exam_findings", "Physical Examination Findings"),
        T("focused_exam", "Focused Surgical Examination (mass, hernia, per rectum as indicated)"),
      ]),
      ...sec("Assessment", [
        T("working_diagnosis", "Working Diagnosis"),
        T("differential_diagnosis", "Differential Diagnosis"),
        T("clinical_reasoning", "Clinical Reasoning / Assessment"),
        T("investigations_ordered", "Investigations Ordered"),
        T("imaging_reviewed", "Imaging Reviewed"),
      ]),
      ...sec("Plan & Counselling", [
        S("urgency", "Urgency", URGENCY),
        T("surgical_indication", "Surgical Indication"),
        T("treatment_options_discussed", "Treatment Options Discussed — Operative and Non-Operative"),
        T("risks_benefits_discussed", "Risks, Benefits and Alternatives Discussed"),
        S("patient_decision", "Patient Decision", ["Proceed with Surgery", "Considering Options", "Declined Surgery", "Referred On"]),
        T("recommendation", "Recommendation"),
        T("plan", "Plan / Next Steps"),
        T("safety_netting", "Safety-Net Instructions — When to Return or Seek Urgent Care"),
      ]),
    ],
  },
  {
    key: "surg_preop_assessment", label: "Pre-Operative Assessment", specialty: "surgery",
    fields: [
      ...sec("Procedure & Indication", [
        T("diagnosis", "Diagnosis"),
        I("planned_procedure", "Planned Procedure"),
        I("planned_date", "Planned Date"),
        T("indication", "Indication for Surgery"),
        S("urgency", "Urgency", URGENCY),
        S("laterality", "Site / Laterality", LATERALITY),
        S("surgical_approach", "Planned Approach", ["Open", "Laparoscopic", "Robotic", "Endoscopic", "Percutaneous"]),
        S("consent_documented", "Informed Consent Documented", ["Yes", "No", "Pending"]),
        S("site_marking", "Surgical Site Marking", ["Marked", "Not Required", "Pending"]),
      ]),
      ...sec("Risk Assessment", [
        S("functional_status", "Functional Status", ["Independent", "Partially Dependent", "Totally Dependent"]),
        T("comorbidities", "Comorbidities"),
        T("cardiac_status", "Cardiac Status (stents, revascularisation, antiplatelets)"),
        T("respiratory_status", "Respiratory Status (COPD, obstructive sleep apnoea)"),
        T("renal_endocrine_status", "Renal / Hepatic / Endocrine Status (diabetes control, HbA1c)"),
        T("nutritional_status", "Nutritional Status (weight loss, albumin, malnutrition screening)"),
        T("anaemia_blood", "Anaemia, Blood Group & Crossmatch Availability"),
        T("smoking_alcohol", "Smoking & Alcohol Use — Cessation Advised"),
        T("anticoagulation", "Anticoagulants / Antiplatelets — Perioperative Plan"),
        S("vte_risk", "VTE Risk (Caprini Category)", ["Low", "Moderate", "High", "Very High"]),
        T("vte_prophylaxis_plan", "VTE Prophylaxis Planned"),
        T("medication_management", "Medication Management — Continue / Hold / Substitute (with timing)"),
        T("medications", "Current Medications"),
        T("allergies", "Allergies"),
      ]),
      ...sec("Optimisation & Preparation", [
        T("labs_reviewed", "Laboratory Results Reviewed"),
        T("imaging_reviewed", "Imaging Reviewed"),
        T("other_investigations", "ECG / Chest X-Ray / Other Investigations"),
        T("eras_plan", "ERAS Elements Planned (avoid prolonged fasting, carbohydrate loading, multimodal analgesia, PONV prophylaxis, early feeding and ambulation)"),
        T("bowel_prep", "Bowel Preparation / Fasting Plan"),
        T("antibiotic_prophylaxis", "Antibiotic Prophylaxis — Agent, Dose & Timing"),
        T("blood_products", "Blood Products Ordered / Available"),
        T("preop_instructions", "Pre-Operative Instructions"),
      ]),
      ...sec("Clearance", [
        T("alternatives_discussed", "Alternatives to Surgery Discussed"),
        T("risks_discussed", "Key Risks Discussed — Consent & Understanding Confirmed"),
        T("risk_assessment", "Overall Risk Assessment & Medical Optimisation"),
      ]),
    ],
  },
  {
    key: "surg_operative_note", label: "Operative Note", specialty: "surgery",
    fields: [
      ...sec("Diagnoses & Procedure", [
        T("preop_diagnosis", "Pre-Operative Diagnosis"),
        T("postop_diagnosis", "Post-Operative Diagnosis"),
        I("procedure", "Procedure"),
        I("operation_date", "Date of Surgery"),
        S("urgency", "Urgency", URGENCY),
        S("laterality", "Site / Laterality", LATERALITY),
        S("approach", "Approach", ["Open", "Laparoscopic", "Laparoscopic Converted to Open", "Robotic", "Robotic Converted to Open", "Endoscopic", "Percutaneous"]),
        T("indication", "Indication"),
      ]),
      ...sec("Safety Checklist & Team", [
        I("surgeon", "Surgeon"),
        T("assistants", "Assistants"),
        S("anesthesia", "Anaesthesia", ["General", "Regional", "Local", "Monitored Anesthesia Care", "Sedation", "Other"]),
        T("anesthesia_provider", "Anaesthetist / Anaesthesia Provider"),
        S("who_timeout", "WHO Surgical Safety Checklist — Sign In, Time Out & Sign Out", ["Completed", "Not Completed"]),
        T("patient_position", "Patient Position & Positioning Aids"),
        T("antibiotic_prophylaxis", "Antibiotic Prophylaxis — Agent, Dose & Timing"),
        T("vte_prophylaxis", "VTE Prophylaxis — Method & Timing"),
      ]),
      ...sec("Findings & Technique", [
        T("findings", "Findings"),
        T("anatomical_details", "Anatomical Details / Variant Anatomy"),
        T("procedure_details", "Procedure Details — Key Procedural Steps in Sequence"),
        T("conversion", "Conversion / Additional Procedure and Reason"),
        I("pneumoperitoneum", "Pneumoperitoneum Pressure (mmHg) — laparoscopic cases"),
        T("port_configuration", "Port Configuration & Insufflation Method — laparoscopic cases"),
        I("operative_time", "Operative Time"),
        I("estimated_blood_loss", "Estimated Blood Loss"),
        T("fluids_output", "Intraoperative Fluids & Urine Output"),
        T("transfusion", "Blood Products / Transfusion Given"),
        T("complications", "Complications"),
        T("drains", "Drains"),
        T("implants", "Implants / Mesh"),
      ]),
      ...sec("Trauma Additions — complete only for injured patients", [
        S("trauma_haemodynamic_status", "Haemodynamic Status at Incision", ["Stable", "Unstable", "Transient Responder", "Non-Responder"]),
        S("trauma_damage_control", "Damage-Control Strategy", ["Not applicable", "Yes — abbreviated laparotomy", "Yes — haemorrhage control only", "Yes — staged orthopaedic fixation", "No"]),
        S("trauma_temporary_closure", "Temporary Abdominal Closure", ["Not applicable", "Negative-pressure dressing", "Bogota bag", "Mesh-mediated traction", "Primary closure"]),
        S("trauma_mtp", "Massive Transfusion Protocol", ["Not activated", "Activated — balanced component therapy", "Activated — whole blood", "Considered", "Not assessed"]),
        S("trauma_txa", "Tranexamic Acid", ["Given within 3 hours", "Given after 3 hours", "Not given — not indicated", "Not assessed"]),
        S("trauma_relook", "Planned Re-Look Laparotomy", ["Not planned", "Planned within 24 hours", "Planned within 48 hours", "Not assessed"]),
        T("trauma_injury_findings", "Intra-Operative Injury Findings & AAST Grades"),
      ]),
      ...sec("Specimens, Counts & Disposition", [
        T("specimens", "Specimens — Site, Orientation & Containers"),
        S("specimens_to_pathology", "Specimens Sent to Pathology", ["Yes", "No"]),
        S("counts_correct", "Instrument, Sponge & Needle Counts", ["Correct", "Incorrect — See Note", "Not Applicable"]),
        S("wound_class", "Wound Classification", ["Clean", "Clean-Contaminated", "Contaminated", "Dirty / Infected"]),
        T("closure", "Closure & Dressing"),
        S("disposition", "Disposition", ["PACU", "ICU", "HDU", "Ward", "Day Case Discharge"]),
        T("patient_condition", "Patient Condition"),
        T("postop_plan", "Post-Operative Plan"),
      ]),
    ],
  },
  {
    key: "surg_procedure_note", label: "Procedure Note", specialty: "surgery",
    fields: [
      ...sec("Procedure & Consent", [
        I("procedure", "Procedure"),
        T("indication", "Indication"),
        T("consent", "Consent"),
        S("time_out", "Time Out / Site Verification", ["Completed", "Not Completed"]),
        T("site_prep", "Site, Laterality & Antisepsis"),
        T("local_anesthesia", "Local Anaesthetic — Agent, Concentration, Dose"),
      ]),
      ...sec("Technique & Findings", [
        T("technique", "Technique"),
        T("findings", "Findings"),
        T("specimens", "Specimens"),
        I("estimated_blood_loss", "Estimated Blood Loss"),
        T("complications", "Complications"),
        T("closure", "Closure & Dressing"),
        T("patient_tolerance", "Patient Tolerance / Sedation"),
      ]),
      ...sec("Aftercare", [
        T("patient_condition", "Patient Condition"),
        T("aftercare", "Aftercare & Discharge Instructions"),
        T("post_procedure_plan", "Post-Procedure Plan"),
        I("follow_up", "Follow-Up"),
      ]),
    ],
  },
  {
    key: "surg_postop_note", label: "Post-Operative Note", specialty: "surgery",
    fields: [
      ...sec("Vital Signs & Symptoms", [
        I("procedure_date", "Procedure Date"),
        I("postop_day", "Post-Operative Day"),
        T("vitals", "Vital Signs (including early warning score)"),
        N("pain_score", "Pain Score (0–10)"),
        T("pain_control", "Pain Control / Analgesia and Opioid Use"),
        S("nausea_vomiting", "Nausea / Vomiting", ["None", "Nausea", "Vomiting", "Controlled"]),
        T("symptoms", "Symptoms"),
      ]),
      ...sec("Surgical Site, Drains & Lines", [
        T("wound_condition", "Wound Condition"),
        T("drain_output", "Drain Output"),
        T("lines_catheters", "IV Lines, Urinary Catheter & Nasogastric Tube"),
        T("tubes_stoma", "Tubes & Stoma — Type and Output"),
        T("fluid_balance", "Fluid Balance / Urine Output"),
      ]),
      ...sec("Investigations & Complications", [
        T("labs", "Laboratory Results"),
        T("imaging", "Imaging"),
        T("vte_prophylaxis", "VTE Prophylaxis Received"),
        T("antibiotics", "Antibiotics"),
        S("complication_grade", "Complication Grade (Clavien–Dindo)", CLAVIEN),
        T("complications", "Complications"),
      ]),
      ...sec("ERAS Progress & Plan", [
        T("diet", "Diet & Oral Intake"),
        T("bowel_function", "Bowel Function / Flatus"),
        T("mobility", "Mobility"),
        S("discharge_ready", "Meeting Discharge Criteria", ["Yes", "No", "Pending Review"]),
        T("plan", "Plan"),
      ]),
    ],
  },
  {
    key: "surg_daily_progress", label: "Daily Surgical Progress Note", specialty: "surgery",
    fields: [
      ...sec("Interval Course", [
        I("postop_day", "Post-Operative Day"),
        T("overnight_events", "Interval Events"),
        T("symptoms", "Symptoms"),
        T("vitals", "Vital Signs"),
        T("pain_control", "Pain Control"),
      ]),
      ...sec("Examination", [
        T("wound_exam", "Wound Examination"),
        T("abdominal_exam", "Abdominal Examination"),
        T("drain_status", "Drain Status & Output"),
        T("tubes_stoma", "Tubes, Catheters & Stoma Output"),
      ]),
      ...sec("Investigations & Treatment", [
        T("labs", "Laboratory Results"),
        T("imaging", "Imaging"),
        T("antibiotics", "Antibiotics"),
        T("vte_prophylaxis", "VTE Prophylaxis"),
        S("antimicrobial_review", "Antimicrobial Review", ["Continue", "Review", "De-escalate", "Stop", "Not on Antimicrobials"]),
        T("hydration_nutrition", "Hydration & Nutrition"),
        T("nutrition_bowel", "Diet, Bowel Function & Mobilisation"),
        T("medications", "Medication Changes"),
        S("complication_grade", "Complication Grade (Clavien–Dindo)", CLAVIEN),
      ]),
      ...sec("Plan", [
        T("plan", "Plan & Recovery Goals"),
        T("escalation_criteria", "Escalation Criteria — When to Escalate Care"),
        S("disposition", "Care Location", ["Ward", "HDU", "ICU", "Discharge"]),
        I("code_status", "Code Status"),
      ]),
    ],
  },
  {
    key: "surg_discharge_summary", label: "Discharge Summary", specialty: "surgery",
    fields: [
      ...sec("Admission & Procedure", [
        I("admission_date", "Admission Date"),
        I("discharge_date", "Discharge Date"),
        T("preop_diagnosis", "Pre-Operative Diagnosis"),
        T("postop_diagnosis", "Post-Operative Diagnosis"),
        T("procedure", "Procedure Performed"),
      ]),
      ...sec("Hospital Course", [
        T("hospital_course", "Hospital Course"),
        S("complication_grade", "Complications (Clavien–Dindo)", CLAVIEN),
        T("wound_instructions", "Wound Status & Care Instructions"),
        T("drain_care", "Drain Care / Removal"),
      ]),
      ...sec("Discharge Status & Instructions", [
        T("discharge_medications", "Discharge Medications"),
        T("analgesia_plan", "Pain Management & Opioid Stewardship"),
        T("vte_prophylaxis_discharge", "VTE Prophylaxis After Discharge"),
        T("diet_activity", "Diet & Activity Instructions"),
        T("warning_signs", "Warning Signs — When to Seek Urgent Care"),
        S("discharge_destination", "Discharge Destination", ["Home", "Home with Home Care", "Rehabilitation", "Transfer", "Other"]),
        T("responsible_services", "Responsible Services / Team & Contact"),
        S("medication_reconciliation", "Medication Reconciliation", ["Completed", "Pending", "Not Applicable"]),
      ]),
      ...sec("Follow-Up & Pending Results", [
        S("pathology_communicated", "Pathology Results Communicated", ["Not Applicable", "Pending", "Discussed with Patient"]),
        T("follow_up", "Follow-Up"),
        T("pending_results", "Pending Results"),
      ]),
    ],
  },
  {
    key: "surg_followup", label: "Surgical Follow-Up", specialty: "surgery",
    fields: [
      ...sec("Interval History", [
        I("procedure_done", "Procedure Done"),
        I("time_since_procedure", "Time Since Procedure"),
        T("symptoms", "Symptoms"),
        T("pain_function", "Pain & Return to Daily Activity / Work"),
      ]),
      ...sec("Examination", [
        T("wound_status", "Wound Status"),
        T("exam_findings", "Physical Examination Findings"),
      ]),
      ...sec("Assessment & Plan", [
        S("pathology_reviewed", "Pathology Result Reviewed", ["Not Applicable", "Pending", "Reviewed — Discussed with Patient"]),
        T("workup", "Work-Up"),
        T("surveillance_plan", "Surveillance / Further Investigation Plan"),
        T("complications", "Late Complications"),
        T("plan", "Plan"),
        I("next_review", "Next Review"),
      ]),
    ],
  },
  {
    key: "surg_pathology", label: "Pathology Request / Record", specialty: "surgery",
    fields: [
      ...sec("Specimen Details", [
        T("specimens_sent", "Specimens Sent"),
        T("clinical_history", "Clinical History"),
        I("requesting_surgeon", "Requesting / Operating Surgeon"),
        T("specimen_site", "Specimen Site, Laterality & Orientation"),
        I("specimen_count", "Number of Specimens / Containers"),
        S("priority", "Priority", ["Routine", "Urgent", "Frozen Section"]),
      ]),
      ...sec("Report", [
        T("gross_findings", "Gross Findings"),
        T("microscopic_findings", "Microscopic Findings"),
        T("diagnosis", "Pathology Diagnosis"),
        T("margins", "Margin Status"),
        T("lymph_nodes", "Lymph Nodes Examined / Positive"),
        T("staging", "Pathological Staging (pTNM)"),
        T("ancillary", "Ancillary Studies (immunohistochemistry, molecular)"),
        I("turnaround", "Turnaround / Report Date"),
      ]),
      ...sec("Communication", [
        S("mdt", "Discussed at MDT / Tumour Board", ["Not Applicable", "Pending", "Discussed"]),
        S("communicated", "Result Communicated to Patient", ["Pending", "Discussed"]),
        T("notes", "Notes"),
      ]),
    ],
  },
  {
    key: "surg_referral", label: "Surgical Referral", specialty: "surgery",
    fields: [
      ...sec("Referral & Clinical Question", [
        I("referred_to", "Referred To"),
        I("referral_date", "Referral Date"),
        I("referring_doctor", "Referring Doctor & Contact"),
        T("referring_diagnosis", "Referring Diagnosis"),
        T("clinical_question", "Clinical Question / Reason"),
        S("urgency", "Urgency", URGENCY),
      ]),
      ...sec("Supporting Information", [
        T("relevant_history", "Relevant History"),
        T("comorbidities", "Comorbidities & Fitness for Intervention"),
        T("medications_allergies", "Current Medications / Anticoagulants & Allergies"),
        T("investigations", "Investigations & Imaging Attached"),
      ]),
      ...sec("Expectations", [
        S("patient_preference", "Patient's Preference", ["Prefers Surgery", "Prefers Non-Operative Management", "Undecided"]),
        T("expectations", "Expected Outcome / What the Referral Requests"),
      ]),
    ],
  },
  {
    key: "surg_consent_documentation", label: "Consent Documentation", specialty: "surgery",
    fields: [
      ...sec("Diagnosis & Procedure", [
        T("diagnosis", "Diagnosis / Condition"),
        I("procedure", "Procedure"),
        I("consent_type", "Consent Type"),
        I("consent_datetime", "Date & Time of Consent"),
      ]),
      ...sec("Discussion of Risks, Benefits & Alternatives", [
        T("intended_benefit", "Intended Benefits"),
        T("risks_discussed", "Material Risks Discussed (serious and frequently occurring)"),
        T("alternatives", "Alternatives Discussed, including Non-Operative Management"),
        T("no_treatment", "Consequences of Declining Treatment"),
        T("additional_procedures", "Possible Additional or Converted Procedure Discussed"),
        T("blood_transfusion", "Blood Products / Transfusion Discussed"),
      ]),
      ...sec("Consent & Capacity", [
        S("questions_answered", "Patient's Questions Answered", ["All Questions Answered", "Further Discussion Required"]),
        S("interpreter", "Interpreter Used", ["Not Required", "Professional Interpreter", "Family Member — Patient Consented"]),
        S("capacity", "Decision-Making Capacity", ["Intact", "Impaired — Assessed", "Not Assessed"]),
        S("patient_agreement", "Patient Agreement", ["Agreed", "Declined", "Deferred"]),
        I("witness", "Witness"),
        T("notes", "Notes"),
      ]),
    ],
  },
  {
    key: "surg_implant_device", label: "Implant / Device Record", specialty: "surgery",
    fields: [
      ...sec("Device Identification", [
        I("implant_name", "Implant / Device Name"),
        S("device_category", "Device Category", ["Mesh", "Stapler / Staple Line", "Energy Device", "Prosthesis", "Suture / Anchor", "Implanted Port / Catheter", "Other"]),
        I("manufacturer", "Manufacturer"),
        I("model", "Model"),
        I("udi", "UDI (Unique Device Identification)"),
        I("serial_number", "Serial Number"),
        I("lot_number", "Lot / Batch Number"),
        I("size", "Size / Dimensions"),
        I("expiration", "Expiration Date (if applicable)"),
      ]),
      ...sec("Implantation", [
        T("indication", "Indication for Implant"),
        I("implant_site", "Implant Site"),
        S("laterality", "Site / Laterality", LATERALITY),
        I("date_implanted", "Date Implanted"),
        I("implanting_surgeon", "Implanting Surgeon"),
      ]),
      ...sec("Traceability", [
        S("patient_card", "Patient Implant Information Given", ["Yes", "No"]),
        I("explant_date", "Explant / Removal Date"),
        T("explant_reason", "Reason for Removal"),
        T("notes", "Notes"),
      ]),
    ],
  },
];