// Urology — examination element register.
//
// Every element is recorded as NORMAL, ABNORMAL, NOT PERFORMED, NOT APPLICABLE or
// NOT DOCUMENTED. That is the whole point of this module: an examination that was
// not performed, declined or not applicable can never be read back as normal, and
// the printed record says exactly which state was recorded.
//
// Nothing here is pre-selected and no element defaults to "Normal".

import { EXAM_STATES } from "@/lib/uroFieldKit";

export { EXAM_STATES };

export const URO_EXAM_GROUPS = [
  {
    key: "abdomen_renal",
    label: "Abdomen, kidneys and bladder",
    elements: [
      { key: "abdomen_general", label: "Abdominal examination", detail: "Masses, tenderness, guarding, bowel sounds" },
      { key: "kidney_ballotable", label: "Kidneys — ballotable / palpable", detail: "Which side, level, consistency" },
      { key: "renal_angle_tenderness", label: "Renal angle tenderness", detail: "Which side" },
      { key: "bladder_distension", label: "Suprapubic bladder distension", detail: "Level relative to symphysis" },
      { key: "suprapubic_tenderness", label: "Suprapubic tenderness", detail: "" },
      { key: "surgical_scars", label: "Surgical scars / stomas / drains", detail: "Site and state" },
      { key: "groin_hernia", label: "Inguinal region and hernia orifices", detail: "Which side, reducible" },
    ],
  },
  {
    key: "genital",
    label: "Genital and scrotal examination",
    elements: [
      { key: "penis_skin", label: "Penis — skin and shaft", detail: "Lesions, plaque, induration" },
      { key: "foreskin", label: "Foreskin / prepuce", detail: "Retractile, phimosis, paraphimosis" },
      { key: "meatus", label: "Meatal position and calibre", detail: "Hypospadias, stenosis, discharge" },
      { key: "testis_right", label: "Right testis — size, consistency, lie", detail: "" },
      { key: "testis_left", label: "Left testis — size, consistency, lie", detail: "" },
      { key: "epididymis", label: "Epididymis", detail: "Tenderness, swelling, cyst" },
      { key: "spermatic_cord", label: "Spermatic cord / varicocele", detail: "Thickening, varicocele with Valsalva" },
      { key: "hydrocele", label: "Hydrocele / swelling", detail: "Which side, transillumination" },
      { key: "inguinal_nodes", label: "Inguinal lymph nodes", detail: "Which side, mobile, size" },
    ],
  },
  {
    key: "prostate",
    label: "Digital rectal examination & prostate",
    elements: [
      { key: "dre_prostate_size", label: "Prostate size on DRE", detail: "Estimated size / grade" },
      { key: "dre_prostate_consistency", label: "Prostate consistency", detail: "Smooth, firm, hard, nodular" },
      { key: "dre_nodule", label: "Nodule or asymmetry", detail: "Site within the gland" },
      { key: "dre_sphincter_tone", label: "Anal sphincter tone", detail: "" },
      { key: "dre_rectal_mucosa", label: "Rectal mucosa and other findings", detail: "" },
    ],
  },
  {
    key: "neurology",
    label: "Neurological examination (bladder & sexual function)",
    elements: [
      { key: "perineal_sensation", label: "Perineal / saddle sensation", detail: "Dermatome level if reduced" },
      { key: "anal_tone_neuro", label: "Anal tone", detail: "" },
      { key: "bulbocavernosus", label: "Bulbocavernosus reflex", detail: "" },
      { key: "lower_limb_neuro", label: "Lower limb power, reflexes and sensation", detail: "" },
      { key: "gait", label: "Gait and mobility", detail: "" },
    ],
  },
  {
    key: "devices",
    label: "Catheters, stents and devices",
    elements: [
      { key: "urethral_catheter_site", label: "Urethral catheter and meatus", detail: "Size, balloon, trauma, discharge" },
      { key: "suprapubic_site", label: "Suprapubic catheter site", detail: "Skin, leakage, granulation" },
      { key: "nephrostomy_site", label: "Nephrostomy site", detail: "Dressing, leakage, fixation" },
      { key: "stoma_urinary", label: "Urinary stoma / diversion", detail: "Appliance, skin, output" },
    ],
  },
];

export const URO_EXAM_ELEMENT_COUNT = URO_EXAM_GROUPS.reduce((n, g) => n + g.elements.length, 0);

// The state as it must be reported. A blank is never turned into a finding.
export const examStateLabel = (state) => (state && EXAM_STATES.includes(state) ? state : "Not documented");