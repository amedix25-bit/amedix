import { sel, chk, multi, num, section } from "../shared";

export default {
  key: "abdominal",
  label: "Abdominal Examination",
  description: "GI system examination in the standard order",
  sections: [
    section("inspection", "Inspection", [
      sel("contour", "Contour", ["Normal", "Distended", "Scaphoid"], { detailOn: ["Distended", "Scaphoid"] }),
      sel("umbilicus", "Umbilicus", ["Central and inverted", "Everted", "Displaced"], { detailOn: ["Everted", "Displaced"] }),
      sel("movements", "Respiratory movements", ["Normal", "Restricted", "Absent"]),
      chk("visible_peristalsis", "Visible peristalsis", { detailOn: true }),
      chk("visible_pulsations", "Visible pulsations", { detailOn: true }),
      chk("dilated_veins", "Dilated veins / caput medusae", { detailOn: true }),
      chk("flanks", "Full flanks"),
      chk("hernial_orifices", "Hernial orifices", { detailOn: true }),
      multi("scars", "Surgical scars", ["None", "Upper midline", "Lower midline", "Grid iron", "Kocher's (subcostal)", "Laparoscopic", "Other"]),
    ]),
    section("auscultation", "Auscultation", [
      sel("bowel_sounds", "Bowel sounds", ["Normal", "Increased", "Absent", "Tinkling"]),
      multi("bruits", "Vascular bruits", ["None", "Aortic", "Renal", "Hepatic", "Iliac"]),
    ], {
      abnormalFields: [
        chk("succussion_splash", "Succussion splash"),
      ],
      notesLabel: "Auscultation findings",
    }),
    section("percussion", "Percussion", [
      sel("percussion_note", "Percussion note", ["Tympanic", "Dull", "Shifting dullness"], { detailOn: ["Shifting dullness"] }),
      chk("fluid_thrill", "Fluid thrill"),
      sel("liver_dullness", "Liver dullness", ["Preserved", "Lost"]),
      sel("spleen_percussion", "Splenic dullness", ["Absent", "Present"]),
    ]),
    section("palpation", "Palpation", [
      sel("tenderness", "Tenderness", ["None", "Superficial", "Deep"], { detailOn: ["Superficial", "Deep"], detailLaterality: true }),
      sel("guarding", "Guarding", ["None", "Localized", "Generalized"], { detailOn: ["Localized", "Generalized"], detailLaterality: true }),
      chk("rigidity", "Board-like rigidity"),
      chk("rebound_tenderness", "Rebound tenderness", { detailLaterality: true }),
      sel("liver", "Liver", ["Not palpable", "Palpable"], { detailOn: ["Palpable"] }),
      sel("spleen", "Spleen", ["Not palpable", "Just palpable", "Moderately enlarged", "Massively enlarged"]),
      chk("kidneys", "Ballotable kidneys", { detailLaterality: true }),
      sel("aorta", "Aortic pulsation", ["Normal", "Expansile mass", "Cannot assess"]),
    ], {
      abnormalFields: [
        num("liver_span", "Liver span", { unit: "cm", step: 0.5 }),
        sel("liver_edge", "Liver edge", ["Smooth", "Tender", "Nodular", "Hard"]),
        sel("murphy", "Murphy's sign", ["Negative", "Positive"]),
        sel("mcburney", "McBurney's point tenderness", ["Negative", "Positive"]),
        chk("mass", "Palpable mass", { detailOn: true }),
      ],
      notesLabel: "Palpation findings",
    }),
    section("special_findings", "Special Findings", [
      chk("per_rectum", "Per rectum examination", { detailOn: true }),
      chk("hernia_exam", "Hernia examination findings", { detailOn: true }),
    ], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};