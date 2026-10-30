import { sel, chk, multi, num, lat, section } from "../shared.js";

export default {
  key: "hernia",
  label: "Hernia Examination",
  description: "Abdominal wall hernia — site, contents, reducibility and complications",
  sections: [
    section("inspection", "Inspection", [
      sel("site", "Site", ["Inguinal", "Femoral", "Umbilical", "Paraumbilical", "Epigastric", "Incisional", "Spigelian", "Lumbar", "Obturator", "Other"], { detailOn: ["Other"] }),
      lat("laterality", "Side"),
      sel("size", "Approximate size", ["< 2 cm", "2–5 cm", "5–10 cm", "> 10 cm"]),
      chk("visible_on_cough", "Visible swelling on cough", { detailOn: true }),
      chk("skin_changes", "Overlying skin changes", { detailOn: true }),
    ]),
    section("palpation", "Palpation", [
      sel("reducibility", "Reducibility", ["Fully reducible", "Partially reducible", "Irreducible"]),
      sel("cough_impulse", "Cough impulse", ["Present", "Absent", "Not assessed"]),
      sel("consistency", "Consistency", ["Soft", "Firm", "Hard", "Tense"]),
      chk("tenderness", "Tender"),
      sel("defect", "Defect on examination", ["Not palpable", "Finger-sized", "Two fingers", "Wide neck", "Narrow neck"]),
      num("defect_size", "Defect diameter", { unit: "cm", step: 0.1, min: 0, max: 30 }),
      sel("relation_to_ring", "Relation to anatomical landmark", ["Above and medial to pubic tubercle", "Below and lateral to pubic tubercle", "At the umbilicus", "Not applicable"]),
    ], {
      abnormalFields: [
        chk("irreducible", "Irreducible"),
        chk("obstructed", "Features of obstruction (vomiting, distension, absolute constipation)"),
        chk("strangulated", "Features of strangulation (severe pain, tense, skin changes)"),
        chk("expansile_cough", "Expansile cough impulse"),
      ],
      notesLabel: "Hernia findings",
    }),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};