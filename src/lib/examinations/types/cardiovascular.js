import { sel, chk, multi, section } from "../shared";

export default {
  key: "cardiovascular",
  label: "Cardiovascular Examination",
  description: "Heart and peripheral vascular assessment",
  sections: [
    section("general_inspection", "General Inspection", [
      chk("dyspnea", "Dyspnea at rest"),
      chk("orthopnea", "Orthopnea"),
      chk("pnd", "Paroxysmal nocturnal dyspnea"),
      chk("cyanosis", "Central cyanosis", { detailOn: true }),
      chk("pallor", "Pallor"),
      sel("edema", "Peripheral edema", ["Absent", "Ankle", "Mid-shin", "Knee", "Sacral", "Anasarca"]),
      chk("clubbing", "Clubbing", { detailOn: true }),
      chk("cachexia", "Cachexia"),
    ]),
    section("inspection", "Inspection", [
      sel("chest_deformity", "Chest deformity", ["None", "Pectus excavatum", "Pectus carinatum", "Barrel chest", "Kyphoscoliosis"], { detailOn: ["Pectus excavatum", "Pectus carinatum", "Barrel chest", "Kyphoscoliosis"] }),
      multi("visible_pulsations", "Visible pulsations", ["None", "Apex beat", "Suprasternal", "Precordial", "Epigastric"]),
      chk("scars", "Surgical scars", { detailOn: true }),
    ]),
    section("palpation", "Palpation", [
      sel("apex_beat", "Apex beat", ["Normal position (5th ICS, MCL)", "Displaced", "Impalpable", "Hyperdynamic"], { detailOn: ["Displaced", "Hyperdynamic"] }),
      chk("thrill", "Palpable thrill", { detailOn: true }),
      chk("heaves", "Left ventricular heave", { detailOn: true }),
      chk("parasternal_heave", "Parasternal heave (RV)", { detailOn: true }),
    ]),
    section("auscultation", "Auscultation", [
      sel("s1", "First heart sound", ["Normal", "Loud", "Soft"]),
      sel("s2", "Second heart sound", ["Normal", "Loud", "Soft", "Wide split"]),
      multi("added_sounds", "Added sounds", ["None", "S3 gallop", "S4", "Ejection click", "Midsystolic click", "Pericardial rub"]),
      chk("murmur", "Murmur"),
    ], {
      abnormalFields: [
        sel("murmur_timing", "Murmur timing", ["Systolic", "Diastolic", "Continuous"]),
        sel("murmur_site", "Loudest at", ["Aortic area", "Pulmonary area", "Tricuspid area", "Mitral area"]),
        sel("murmur_grade", "Murmur grade", ["1/6 — very soft", "2/6 — soft", "3/6 — moderate", "4/6 — loud", "5/6 — very loud", "6/6 — audible without stethoscope"]),
        sel("murmur_character", "Murmur character", ["Ejection", "Pansystolic", "Late systolic", "Early diastolic", "Mid-diastolic"]),
        sel("murmur_radiation", "Radiation", ["None", "To neck", "To axilla", "To back", "Other"], { detailOn: ["Other"] }),
      ],
      notesLabel: "Auscultation findings",
    }),
    section("peripheral_signs", "Peripheral Signs", [
      sel("jvp", "JVP", ["Normal", "Raised", "Cannot assess"], { detailOn: ["Raised"] }),
      sel("carotid_pulse", "Carotid pulse", ["Normal", "Weak", "Bounding", "Absent"]),
      sel("radial_pulse", "Radial pulse", ["Normal", "Weak", "Absent", "Radio-femoral delay"]),
      chk("peripheral_cyanosis", "Peripheral cyanosis"),
      sel("cap_refill", "Capillary refill", ["Normal (<2s)", "Prolonged (≥2s)"]),
      chk("peripheral_pulses_other", "Femoral / popliteal / pedal pulses abnormal", { detailOn: true }),
    ]),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};