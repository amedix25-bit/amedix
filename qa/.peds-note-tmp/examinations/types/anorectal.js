import { sel, chk, multi, num, section, area } from "../shared.js";

export default {
  key: "anorectal",
  label: "Anorectal Examination",
  description: "Perianal inspection, digital rectal examination and proctoscopy",
  sections: [
    section("inspection", "Perianal Inspection", [
      multi("findings", "Findings", ["Normal", "Skin tags", "External haemorrhoids", "Fissure", "Fistula opening", "Abscess", "Mass / prolapse", "Faecal soiling"]),
      sel("position", "Clock position of findings", ["Not applicable", "1 o'clock", "3 o'clock", "5 o'clock", "7 o'clock", "9 o'clock", "11 o'clock"]),
      chk("perianal_abscess", "Perianal abscess / induration", { detailOn: true }),
      chk("skin_excoriation", "Perianal skin excoriation", { detailOn: true }),
    ]),
    section("dre", "Digital Rectal Examination", [
      sel("tone", "Anal tone", ["Normal", "Reduced", "Increased", "Not assessed"]),
      sel("pain", "Examination tolerance", ["Comfortable", "Painful", "Not tolerated"]),
      sel("rectal_wall", "Rectal wall / mucosa", ["Normal", "Irregular", "Narrowed", "Not assessed"]),
      num("prostate_size", "Prostate size (if male)", { unit: "g (approx.)", step: 1, min: 0, max: 200 }),
      chk("prostate_enlarged", "Enlarged prostate", { detailOn: true }),
      multi("findings", "Findings", ["None", "Mass", "Tenderness", "Blood on glove", "Impaction", "Stricture", "Haemorrhoids felt", "Not assessed"]),
    ], {
      abnormalFields: [
        area("mass_detail", "Describe mass — position, size, mobility, relation to wall"),
        chk("blood_on_glove", "Blood on glove"),
        chk("empty_rectum", "Empty rectum with faecal loading above"),
      ],
      notesLabel: "DRE findings",
    }),
    section("proctoscopy", "Proctoscopy / Sigmoidoscopy Findings", [
      sel("performed", "Performed", ["Not performed", "Performed"]),
      multi("findings", "Findings", ["Normal", "Internal haemorrhoids", "Fissure", "Polyp", "Ulceration", "Mass", "Blood in lumen"]),
    ], {
      abnormalFields: [area("detail", "Describe findings and level")],
      notesLabel: "Endoscopic findings",
    }),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};