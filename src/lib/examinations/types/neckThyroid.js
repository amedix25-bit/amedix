import { sel, chk, multi, num, section, area } from "../shared";

export default {
  key: "neck_thyroid",
  label: "Neck & Thyroid Examination",
  description: "Thyroid swelling, neck masses and cervical lymphadenopathy",
  sections: [
    section("inspection", "Inspection", [
      sel("neck_contour", "Neck contour", ["Normal", "Diffuse swelling", "Localised swelling", "Scar"], { detailOn: ["Localised swelling"] }),
      sel("swelling_movement", "Movement on swallowing", ["Moves with swallowing", "Does not move with swallowing", "Not observed"]),
      sel("tongue_protrusion", "Movement on tongue protrusion", ["Moves up", "No movement", "Not tested"]),
      chk("tracheal_deviation", "Tracheal deviation", { detailOn: true }),
      chk("venous_engorgement", "Venous engorgement / Pemberton's sign", { detailOn: true }),
    ]),
    section("palpation", "Palpation", [
      sel("thyroid", "Thyroid gland", ["Not enlarged", "Diffuse goitre", "Nodular goitre", "Single nodule", "Not palpable"]),
      sel("consistency", "Consistency", ["Soft", "Firm", "Hard", "Cystic", "Not applicable"]),
      chk("tenderness", "Tender", { detailOn: true }),
      chk("retrosternal", "Retrosternal extension", { detailOn: true }),
      chk("bruit", "Thyroid bruit", { detailOn: true }),
      num("nodule_size", "Dominant nodule size", { unit: "cm", step: 0.1, min: 0, max: 30 }),
      sel("nodule_site", "Nodule position", ["Not applicable", "Right lobe", "Left lobe", "Isthmus"]),
    ]),
    section("lymph_nodes", "Cervical Lymph Nodes", [
      multi("levels", "Involved levels", ["None", "Level I", "Level II", "Level III", "Level IV", "Level V", "Level VI", "Supraclavicular"]),
    ], {
      abnormalFields: [
        num("node_size", "Largest node", { unit: "cm", step: 0.1, min: 0, max: 15 }),
        sel("node_consistency", "Consistency", ["Soft", "Firm", "Hard"]),
        sel("node_mobility", "Mobility", ["Mobile", "Matted", "Fixed"]),
      ],
      notesLabel: "Lymph node findings",
    }),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [area("findings", "Describe findings")],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};