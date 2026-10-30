// Part 5 — Radiology, Laboratory and Pathology documents of the unified AMedix
// architecture. These attach to the SAME Patient Record and Encounters through
// the ClinicalDocument system — the same AMedix header (patient, CIN, DOB,
// encounter, hospital, department, doctor, specialty, date/time, document type),
// digital signature, PDF generation, AMedix Document ID, version control
// (signed documents are never overwritten — corrections create addenda or new
// versions) and Audit Log. Radiologists, laboratory physicians and pathologists
// register as doctors of their specialty and document on the longitudinal
// patient record; the separate Radiology and Laboratory portals handle the
// operational request workflows on the same patient.

const I = (key, label) => ({ key, label, type: "input" });
const N = (key, label) => ({ key, label, type: "number" });
const T = (key, label) => ({ key, label, type: "textarea" });
const S = (key, label, options) => ({ key, label, type: "select", options });

const RADIOLOGY_DOCS = [
  {
    key: "rad_patient_preparation", label: "Patient Preparation Record", specialty: "radiology",
    fields: [I("examination", "Examination"), T("preparation_instructions", "Preparation Instructions Given"), S("fasting_required", "Fasting Required", ["Yes", "No"]), I("fasting_duration", "Fasting Duration (hours)"), T("hydration", "Hydration Instructions"), T("contrast_preparation", "Contrast Preparation"), S("pregnancy_screening", "Pregnancy Screening", ["Not Applicable", "Negative", "Positive", "Declined"]), S("renal_function_check", "Renal Function Verified (Contrast)", ["Not Applicable", "Verified", "Pending", "Impaired — See Notes"]), T("previous_reactions", "Previous Contrast Reactions Reviewed"), I("preparation_completed_datetime", "Preparation Completed (Date & Time)"), T("notes", "Notes")],
  },
  {
    key: "rad_imaging_procedure_record", label: "Imaging Procedure Record", specialty: "radiology",
    fields: [I("modality", "Modality"), I("examination", "Examination Performed"), I("procedure_datetime", "Procedure Date & Time"), N("duration_minutes", "Duration (minutes)"), I("equipment", "Equipment / Machine"), T("technique", "Technique"), I("contrast_agent", "Contrast Agent"), I("contrast_dose", "Contrast Dose"), T("sedation", "Sedation (if any)"), T("patient_positioning", "Positioning"), N("images_acquired", "Images / Series Acquired"), S("technical_quality", "Technical Quality", ["Diagnostic", "Limited", "Non-Diagnostic — Repeat Needed"]), T("adverse_events", "Adverse Events During Procedure"), I("radiographer_name", "Radiographer / Performed By")],
  },
  {
    key: "rad_preliminary_report", label: "Preliminary Report (Radiology)", specialty: "radiology",
    fields: [I("examination", "Examination"), T("clinical_indication", "Clinical Indication"), T("preliminary_findings", "Preliminary Findings"), T("urgent_recommendations", "Urgent Recommendations"), I("preliminary_datetime", "Preliminary Report Date & Time"), T("note", "Note: this is a preliminary communication — the final report will follow")],
  },
  {
    key: "rad_final_report", label: "Final Radiology Report", specialty: "radiology",
    fields: [I("examination", "Examination"), T("clinical_indication", "Clinical Indication"), T("technique", "Technique"), T("findings", "Findings"), T("comparison", "Comparison with Prior Studies"), T("impression", "Impression"), T("recommendations", "Recommendations"), T("critical_findings", "Critical Findings (if any)")],
  },
  {
    key: "rad_critical_finding_notification", label: "Critical Finding Notification", specialty: "radiology",
    fields: [I("examination", "Examination"), T("critical_finding", "Critical Finding"), I("notified_doctor", "Requesting Doctor Notified"), I("notification_datetime", "Notification Date & Time"), T("communication_notes", "Communication Notes (read-back confirmed)"), T("recommended_action", "Recommended Urgent Action")],
  },
  {
    key: "rad_addendum_correction", label: "Addendum / Correction (Radiology)", specialty: "radiology",
    fields: [I("original_report_reference", "Original Report Reference"), S("addendum_type", "Type", ["Addendum", "Correction"]), T("addendum_content", "Addendum / Correction Content"), T("reason", "Reason"), I("addendum_datetime", "Date & Time")],
  },
  {
    key: "rad_consultation", label: "Radiology Consultation", specialty: "radiology",
    fields: [I("reason", "Reason for Consultation"), T("clinical_question", "Clinical Question"), T("history", "Relevant History"), T("imaging_reviewed", "Imaging Reviewed"), T("recommendations", "Recommendations")],
  },
  {
    key: "rad_image_report_association", label: "Image / Report Association", specialty: "radiology",
    fields: [I("images", "Images / Studies"), I("series", "Series Numbers"), I("accession", "Imaging Accession Reference"), I("report_reference", "Report Reference"), T("association_notes", "Association Notes")],
  },
];

const LABORATORY_DOCS = [
  {
    key: "lab_specimen_collection_record", label: "Specimen Collection Record", specialty: "laboratory",
    fields: [I("specimen_type", "Specimen Type"), I("collection_datetime", "Collection Date & Time"), I("collection_site", "Collection Site"), I("collection_method", "Collection Method"), I("collected_by", "Collected By"), S("fasting_status", "Fasting Status", ["Fasting", "Non-Fasting", "Unknown"]), S("specimen_condition", "Specimen Condition", ["Acceptable", "Hemolyzed", "Clotted", "Insufficient Volume", "Rejected"]), N("volume", "Volume (ml)"), T("rejection_reason", "Rejection Reason (if rejected)")],
  },
  {
    key: "lab_accession_record", label: "Specimen / Accession Record", specialty: "laboratory",
    fields: [I("accession_number", "Accession Number"), T("specimens", "Specimens Registered"), I("received_datetime", "Received Date & Time"), S("condition_on_arrival", "Condition on Arrival", ["Acceptable", "Compromised", "Rejected"]), I("storage", "Storage Conditions"), T("chain_of_custody", "Chain of Custody Notes")],
  },
  {
    key: "lab_test_processing_record", label: "Test Processing Record", specialty: "laboratory",
    fields: [T("tests", "Tests Processed"), T("methodology", "Methodology"), I("analyzer", "Analyzer / Instrument"), T("reagents", "Reagents & Lots"), I("run_datetime", "Run Date & Time"), S("qc_status", "Quality Control Status", ["Within Limits", "Out of Limits — Repeat Run", "Pending"]), T("technical_issues", "Technical Issues")],
  },
  {
    key: "lab_result_entry", label: "Result Entry", specialty: "laboratory",
    fields: [T("tests_results", "Results Entered (test, value, unit, reference range)"), I("entered_by", "Entered By"), I("entry_datetime", "Entry Date & Time"), T("reference_ranges", "Reference Ranges Applied"), T("flags", "Flags (High / Low / Critical)")],
  },
  {
    key: "lab_result_verification", label: "Result Verification", specialty: "laboratory",
    fields: [I("verified_by", "Verified By"), I("verification_datetime", "Verification Date & Time"), S("verification_status", "Verification Status", ["Verified", "Reissued", "Rejected — Repeated"]), T("discrepancies", "Discrepancies Identified"), T("plausibility_review", "Plausibility Review")],
  },
  {
    key: "lab_critical_result_notification", label: "Critical Result Notification", specialty: "laboratory",
    fields: [T("critical_result", "Critical Result"), T("reference_range", "Reference Range"), I("notified_person", "Notified Person (Doctor / Caregiver)"), I("notification_datetime", "Notification Date & Time"), T("communication_notes", "Communication Notes (read-back confirmed)"), T("repeat_testing", "Repeat / Confirmatory Testing")],
  },
  {
    key: "lab_corrected_result", label: "Corrected Result", specialty: "laboratory",
    fields: [I("original_result_reference", "Original Result Reference"), T("corrected_value", "Corrected Value(s)"), T("correction_reason", "Reason for Correction"), I("corrected_by", "Corrected By"), I("corrected_datetime", "Correction Date & Time"), T("impact_assessment", "Impact Assessment")],
  },
  {
    key: "lab_final_report", label: "Final Laboratory Report", specialty: "laboratory",
    fields: [T("tests", "Tests Reported"), T("summary", "Summary of Findings"), T("interpretation", "Interpretation"), T("critical_values", "Critical Values (if any)"), I("released_datetime", "Released Date & Time")],
  },
];

const PATHOLOGY_DOCS = [
  {
    key: "path_request", label: "Pathology Request", specialty: "pathology",
    fields: [T("specimens_requested", "Specimens Requested"), T("clinical_history", "Clinical History / Reason"), I("requesting_doctor", "Requesting Doctor"), S("urgency", "Urgency", ["Routine", "Urgent", "STAT"]), T("relevant_procedure", "Relevant Procedure / Operation")],
  },
  {
    key: "path_specimen_registration", label: "Specimen Registration", specialty: "pathology",
    fields: [I("accession_number", "Accession Number"), I("specimen_type", "Specimen Type"), I("site", "Specimen Site"), I("fixative", "Fixative"), I("received_datetime", "Received Date & Time"), N("number_of_specimens", "Number of Specimens"), T("labeling_check", "Labeling Verification")],
  },
  {
    key: "path_gross_description", label: "Gross Description", specialty: "pathology",
    fields: [I("specimen", "Specimen"), T("measurements", "Measurements (dimensions, weight)"), T("appearance", "Gross Appearance"), T("sections_taken", "Sections Taken / Cassette Map"), T("orientation", "Orientation"), T("inked_margins", "Inked Margins")],
  },
  {
    key: "path_histopathology_report", label: "Histopathology Report", specialty: "pathology",
    fields: [I("specimen", "Specimen"), T("microscopic_description", "Microscopic Description"), T("diagnosis", "Diagnosis"), T("margins", "Margin Status"), T("staging_info", "Staging Information"), T("special_stains", "Special Stains / IHc"), T("ancillary_tests", "Ancillary Tests")],
  },
  {
    key: "path_cytology_report", label: "Cytology Report", specialty: "pathology",
    fields: [I("specimen_type", "Specimen Type (Pap / FNA / Fluid)"), S("adequacy", "Specimen Adequacy", ["Satisfactory", "Unsatisfactory"]), T("cellular_findings", "Cellular Findings"), T("diagnosis", "Diagnosis / Report Category"), I("report_category", "Report Category (e.g. Bethesda / Bethesda-for-Thyroid)")],
  },
  {
    key: "path_biopsy_report", label: "Biopsy Report", specialty: "pathology",
    fields: [I("biopsy_site", "Biopsy Site"), T("technique", "Biopsy Technique"), T("microscopic_description", "Microscopic Description"), T("diagnosis", "Diagnosis"), T("margins", "Margin Status"), T("recommendations", "Recommendations")],
  },
  {
    key: "path_surgical_pathology_report", label: "Surgical Pathology Report", specialty: "pathology",
    fields: [T("specimen_received", "Specimen(s) Received"), T("gross_description", "Gross Description"), T("microscopic_description", "Microscopic Description"), T("final_diagnosis", "Final Diagnosis"), T("staging", "Staging (TNM where applicable)"), T("margin_status", "Margin Status"), T("lymph_nodes", "Lymph Nodes (number, involved)")],
  },
  {
    key: "path_preliminary_report", label: "Preliminary Pathology Report", specialty: "pathology",
    fields: [T("preliminary_findings", "Preliminary Findings"), T("pending_stains", "Pending Stains / Tests"), T("urgent_communications", "Urgent Communications")],
  },
  {
    key: "path_final_report", label: "Final Pathology Report", specialty: "pathology",
    fields: [T("final_diagnosis", "Final Diagnosis"), T("microscopic_description", "Microscopic Description"), T("staging", "Staging"), T("remarks", "Remarks")],
  },
  {
    key: "path_addendum", label: "Pathology Addendum", specialty: "pathology",
    fields: [I("original_report_reference", "Original Report Reference"), T("addendum_content", "Addendum Content"), T("reason", "Reason for Addendum"), I("addendum_datetime", "Date & Time")],
  },
  {
    key: "path_consultation", label: "Pathology Consultation", specialty: "pathology",
    fields: [I("reason", "Reason for Consultation"), T("slides_specimens_reviewed", "Slides / Specimens Reviewed"), T("history", "Relevant History"), T("opinion", "Consultation Opinion"), T("recommendations", "Recommendations")],
  },
];

export { RADIOLOGY_DOCS, LABORATORY_DOCS, PATHOLOGY_DOCS };