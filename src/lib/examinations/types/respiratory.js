import { sel, chk, multi, num, section } from "../shared";

export default {
  key: "respiratory",
  label: "Respiratory Examination",
  description: "Airways, chest and breathing assessment",
  sections: [
    section("inspection", "Inspection", [
      num("resp_rate", "Respiratory rate", { unit: "/min", min: 5, max: 60 }),
      sel("rhythm", "Breathing rhythm", ["Regular", "Irregular", "Cheyne-Stokes", "Kussmaul"]),
      sel("effort", "Breathing effort", ["Normal", "Labored", "Accessory muscle use", "Paradoxical"], { detailOn: ["Labored", "Accessory muscle use", "Paradoxical"] }),
      sel("chest_symmetry", "Chest wall symmetry", ["Symmetrical", "Asymmetrical"], { detailOn: ["Asymmetrical"], detailLaterality: true }),
      sel("trachea", "Tracheal position", ["Central", "Deviated"], { detailOn: ["Deviated"], detailLaterality: true }),
      multi("deformities", "Chest deformities", ["None", "Barrel chest", "Pectus excavatum", "Pectus carinatum", "Kyphoscoliosis"]),
      chk("scars", "Chest scars", { detailOn: true }),
      sel("cough", "Cough", ["Absent", "Dry", "Productive", "Hemoptysis"], { detailOn: ["Productive", "Hemoptysis"] }),
    ]),
    section("palpation", "Palpation", [
      sel("chest_expansion", "Chest expansion", ["Normal and symmetrical", "Reduced"], { detailOn: ["Reduced"], detailLaterality: true }),
      sel("tactile_fremitus", "Tactile vocal fremitus", ["Normal", "Increased", "Reduced"], { detailOn: ["Increased", "Reduced"], bilateral: true }),
      chk("tenderness", "Chest wall tenderness", { detailOn: true }),
      sel("lymph_nodes", "Axillary / cervical lymph nodes", ["Normal", "Enlarged"], { detailOn: ["Enlarged"] }),
    ]),
    section("percussion", "Percussion", [
      sel("upper_zones", "Upper zones", ["Resonant", "Hyper-resonant", "Dull", "Stony dull"], { bilateral: true }),
      sel("mid_zones", "Mid zones", ["Resonant", "Hyper-resonant", "Dull", "Stony dull"], { bilateral: true }),
      sel("lower_zones", "Lower zones", ["Resonant", "Hyper-resonant", "Dull", "Stony dull"], { bilateral: true }),
    ], {
      abnormalFields: [
        sel("dullness_position", "Position of abnormal percussion note", ["Not applicable", "Above the 4th rib posteriorly", "Costophrenic angle", "Upper zone", "Whole hemithorax"], { detailLaterality: true }),
      ],
      notesLabel: "Percussion findings",
    }),
    section("auscultation", "Auscultation", [
      sel("breath_sounds", "Breath sounds", ["Vesicular", "Bronchial", "Reduced / diminished", "Absent"], { bilateral: true }),
      multi("added_sounds", "Added sounds", ["None", "Fine crackles", "Coarse crackles", "Wheeze", "Rhonchi", "Pleural rub", "Stridor"]),
      sel("crackles_position", "Crackles — position", ["Not applicable", "Bases", "Mid zones", "Upper zones", "Localized"], { detailLaterality: true }),
      sel("vocal_resonance", "Vocal resonance", ["Normal", "Increased", "Decreased / absent"], { bilateral: true }),
    ], {
      notesLabel: "Auscultation findings",
    }),
    section("special_findings", "Special Findings", [
      chk("finger_clubbing", "Finger clubbing"),
      chk("signs_of_effusion", "Signs of pleural effusion"),
      chk("signs_of_pneumothorax", "Signs of pneumothorax"),
    ], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};