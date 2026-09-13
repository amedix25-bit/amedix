import { sel, chk, multi, num, section } from "../shared";

export default {
  key: "genitourinary",
  label: "Genitourinary Examination",
  description: "Renal, bladder, genital and urinary assessment",
  sections: [
    section("abdominal_gu", "Abdominal / Renal Assessment", [
      chk("loin_tenderness", "Loin / renal angle tenderness", { detailLaterality: true }),
      chk("suprapubic_tenderness", "Suprapubic tenderness"),
      chk("bladder_distension", "Palpable / distended bladder"),
      chk("renal_masses", "Palpable renal mass", { detailLaterality: true }),
      chk("ballotable_kidney", "Ballotable kidney", { detailLaterality: true }),
      sel("genital_hernia", "Inguinal hernia", ["None", "Reducible", "Irreducible"], { detailLaterality: true }),
    ]),
    section("urinary_symptoms", "Urinary Symptoms Screen", [
      chk("dysuria", "Dysuria"),
      chk("frequency", "Increased frequency"),
      chk("nocturia", "Nocturia"),
      chk("urgency", "Urgency"),
      chk("hesitancy", "Hesitancy"),
      chk("poor_stream", "Poor / intermittent stream"),
      chk("hematuria", "Hematuria", { detailOn: true }),
      sel("incontinence", "Incontinence", ["None", "Stress", "Urge", "Overflow", "Continuous"], { detailOn: ["Stress", "Urge", "Overflow", "Continuous"] }),
    ]),
    section("external_genitalia", "External Genitalia", [
      sel("examined", "Examination performed", ["Not performed", "Performed"]),
      sel("findings", "External genitalia", ["Normal", "Abnormal — described below"], { detailOn: ["Abnormal — described below"] }),
    ], {
      abnormalFields: [
        chk("lesion", "Lesion / mass", { detailOn: true, detailLaterality: true }),
        chk("discharge", "Discharge", { detailOn: true }),
        chk("phimosis", "Phimosis / foreskin findings", { detailOn: true }),
        chk("hydrocele", "Hydrocele", { detailOn: true }),
      ],
      notesLabel: "Genitalia findings",
    }),
    section("prostate_dre", "Digital Rectal Examination (when indicated)", [
      sel("performed", "DRE", ["Not performed", "Performed"]),
    ], {
      abnormalFields: [
        sel("prostate_size", "Prostate size", ["Normal", "Enlarged — mild", "Enlarged — moderate", "Enlarged — massive"], { detailOn: ["Enlarged — moderate", "Enlarged — massive"] }),
        sel("prostate_surface", "Surface / consistency", ["Smooth and firm", "Nodular", "Hard", "Soft / boggy", "Tender"]),
        chk("rectal_mass", "Rectal mass", { detailOn: true }),
        sel("anal_tone", "Anal tone", ["Normal", "Reduced", "Increased"]),
      ],
      notesLabel: "DRE findings",
    }),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};