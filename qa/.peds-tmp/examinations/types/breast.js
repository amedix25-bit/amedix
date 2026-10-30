import { sel, chk, multi, lat, num, section } from "../shared.js";

export default {
  key: "breast",
  label: "Breast Examination",
  description: "Breast, nipple and axillary lymph node assessment",
  sections: [
    section("inspection", "Inspection", [
      sel("symmetry", "Symmetry", ["Symmetrical", "Asymmetrical"], { detailOn: ["Asymmetrical"], detailLaterality: true }),
      multi("skin_changes", "Skin changes", ["None", "Dimpling", "Peau d'orange", "Redness", "Retraction", "Visible mass", "Visible veins"]),
      multi("nipple_changes", "Nipple changes", ["None", "Inversion", "Discharge", "Eczema / Paget change", "Ulceration", "Retraction"]),
      chk("visible_mass", "Visible mass", { detailLaterality: true }),
    ]),
    section("palpation", "Palpation", [
      lat("laterality", "Laterality of findings"),
      chk("mass", "Palpable mass", { detailOn: true }),
    ], {
      abnormalFields: [
        sel("quadrant", "Location", ["Upper outer quadrant", "Upper inner quadrant", "Lower outer quadrant", "Lower inner quadrant", "Central / subareolar", "Axillary tail"]),
        num("size", "Size", { unit: "cm", step: 0.1, min: 0, max: 30 }),
        sel("consistency", "Consistency", ["Soft", "Firm", "Hard"]),
        sel("shape", "Shape / margins", ["Well-defined", "Ill-defined", "Irregular", "Fixed to chest wall", "Tethered to skin"]),
        chk("tenderness", "Tender"),
        sel("discharge", "Nipple discharge on expression", ["None", "Milky", "Serous", "Green / brown", "Blood-stained"], { detailOn: ["Milky", "Serous", "Green / brown", "Blood-stained"], detailLaterality: true }),
      ],
      notesLabel: "Palpation findings",
    }),
    section("axillary_nodes", "Axillary / Regional Lymph Nodes", [
      multi("regions", "Involved regions", ["None", "Axillary", "Infraclavicular", "Supraclavicular", "Internal mammary"]),
    ], {
      abnormalFields: [
        num("node_size", "Largest node", { unit: "cm", step: 0.1, min: 0, max: 15 }),
        sel("node_consistency", "Consistency", ["Soft", "Firm", "Hard"]),
        sel("node_fixity", "Mobility", ["Mobile", "Matted", "Fixed"]),
        chk("arm_edema", "Arm edema (lymphedema)", { detailLaterality: true }),
      ],
      notesLabel: "Lymph node findings",
    }),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};