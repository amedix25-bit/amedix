import { sel, chk, multi, num, section } from "../shared";

export default {
  key: "general",
  label: "General Examination",
  description: "General physical examination, vital signs and systemic survey",
  sections: [
    section("general_inspection", "General Inspection", [
      sel("conscious_level", "Level of consciousness", ["Alert", "Drowsy", "Stuporous", "Comatose"]),
      sel("appearance", "General appearance", ["Well", "Ill-looking", "Chronically ill-looking"]),
      sel("nutrition", "Nutritional status", ["Well nourished", "Undernourished", "Cachectic", "Obese"]),
      sel("hydration", "Hydration", ["Well hydrated", "Mildly dehydrated", "Severely dehydrated"], { detailOn: ["Mildly dehydrated", "Severely dehydrated"] }),
      chk("pallor", "Pallor"),
      chk("jaundice", "Jaundice"),
      chk("cyanosis", "Cyanosis", { detailOn: true }),
      chk("clubbing", "Finger clubbing", { detailOn: true }),
      sel("edema", "Edema", ["Absent", "Ankle", "Pretibial", "Sacral", "Anasarca"]),
      sel("lymph_nodes", "Lymphadenopathy", ["None", "Localized", "Generalized"], { detailOn: ["Localized", "Generalized"], detailLaterality: true }),
    ], {
      abnormalFields: [
        sel("signs_of", "Main abnormal finding", ["Respiratory distress", "Cardiac signs", "Abdominal distension", "Neurological deficit", "Skin lesions", "Other"], { detailOn: ["Other"] }),
      ],
    }),
    section("vital_signs", "Vital Signs", [
      num("temperature", "Temperature", { unit: "°C", step: 0.1, min: 30, max: 45 }),
      num("pulse", "Pulse", { unit: "bpm", min: 20, max: 250 }),
      sel("pulse_rhythm", "Pulse rhythm", ["Regular", "Regularly irregular", "Irregularly irregular"]),
      num("resp_rate", "Respiratory rate", { unit: "/min", min: 5, max: 60 }),
      num("bp_systolic", "Systolic BP", { unit: "mmHg", min: 40, max: 300 }),
      num("bp_diastolic", "Diastolic BP", { unit: "mmHg", min: 20, max: 200 }),
      num("spo2", "SpO₂", { unit: "%", min: 40, max: 100 }),
      num("pain_score", "Pain score (0–10)", { min: 0, max: 10 }),
    ], { mode: "free" }),
    section("head_neck", "Head and Neck", [
      sel("eyes", "Eyes / conjunctiva", ["Normal", "Pale conjunctiva", "Icteric sclera", "Other"], { detailOn: ["Other"] }),
      sel("oral_cavity", "Oral cavity", ["Normal", "Coated tongue", "Oral thrush", "Ulceration", "Other"], { detailOn: ["Other"] }),
      sel("thyroid", "Thyroid", ["Normal", "Enlarged"], { detailOn: ["Enlarged"], detailLaterality: true }),
      sel("jvp", "JVP", ["Normal", "Raised", "Cannot assess"]),
      sel("neck_stiffness", "Neck mobility", ["Normal", "Stiff"], { detailOn: ["Stiff"] }),
    ]),
    section("hands", "Hands and Nails", [
      chk("palm_changes", "Palmar changes", { detailOn: true }),
      chk("nail_changes", "Nail changes", { detailOn: true }),
      chk("tremor", "Tremor", { detailOn: true }),
      sel("perfusion", "Peripheral perfusion", ["Warm and well perfused", "Cold peripheries", "Slow capillary refill"]),
    ]),
    section("lymphatic", "Lymph Nodes", [
      multi("nodes_regions", "Palpable nodes", ["None", "Cervical", "Submandibular", "Axillary", "Inguinal", "Supraclavicular"]),
      sel("node_character", "Node character", ["Not applicable", "Soft", "Firm", "Rubbery", "Hard", "Matted", "Tender"], { detailOn: ["Matted", "Hard", "Tender"] }),
    ], {
      abnormalFields: [
        num("node_size", "Largest node size", { unit: "cm", step: 0.1 }),
      ],
    }),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional findings / notes",
    }),
  ],
};