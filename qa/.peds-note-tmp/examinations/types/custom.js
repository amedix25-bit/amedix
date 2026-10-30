import { txt, area, section } from "../shared.js";

export default {
  key: "custom",
  label: "Other / Custom Examination",
  description: "Free-form examination for any other system or region",
  sections: [
    section("exam_area", "Examination Area", [
      txt("region", "Region / system examined"),
      txt("context", "Clinical context"),
    ], { mode: "free" }),
    section("findings", "Examination Findings", [], {
      abnormalFields: [area("findings", "Describe examination findings")],
      notesLabel: "Examination findings",
    }),
    section("additional_notes", "Additional Notes", [
      area("notes", "Additional notes"),
    ], { mode: "free" }),
  ],
};