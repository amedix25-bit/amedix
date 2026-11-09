// Urology — WHO ICD-11 MMS coding context.
//
// WHERE THE CODES COME FROM
//   * The CENTRAL AMedix ICD-11 service is the only source of a code. Search and
//     entry detail come from the workspace classification database
//     (base44/functions/icd11LocalSearch, reading Icd11Term / Icd11Release) which
//     is maintained centrally for every specialty portal. No urology-only code
//     list is maintained by hand and no live WHO API key is required.
//   * This module therefore carries NO typed code of its own apart from the small
//     subset already verified in the workspace catalogue (GB70.0 calculus of
//     kidney, GB60 acute kidney failure, GB61 chronic kidney disease — read from
//     the published MMS block listing and marked REVIEW REQUIRED, never verified).
//   * Everything else in the urology coverage checklist below is a SEARCH TERM,
//     not a code. Selecting a condition asks the central service for the official
//     concept; a condition the dataset does not hold is recorded WITHOUT a code and
//     flagged for coding review. AMedix never generates, completes, crosswalks or
//     substitutes a code, and never presents an ICD-10 code as ICD-11.
//   * A code is never a diagnosis. Every entry records role (primary/secondary),
//     diagnostic status (provisional, differential, confirmed, historical,
//     resolved, suspected) and the clinician's documented basis. A differential is
//     never turned into a confirmed diagnosis by the presence of a code.

import { ICD11_MMS, SPECIFICITY, DIAGNOSIS_ROLES, DIAGNOSIS_STATUSES } from "@/lib/rheumIcd11";

export { ICD11_MMS, SPECIFICITY, DIAGNOSIS_ROLES, DIAGNOSIS_STATUSES };

export const URO_ICD11_MMS = {
  ...ICD11_MMS,
  browser_url: "https://icd.who.int/browse/2024-01/mms/en",
  source_url: "https://icd.who.int/",
  service: "Central AMedix ICD-11 service (workspace classification dataset)",
  verification_note:
    "Codes are read from the central AMedix ICD-11 database for the release recorded on each entry, never typed by " +
    "the portal. Only GB70.0, GB60 and GB61 are carried in the bundled catalogue and each is shown as review " +
    "required until a coder confirms it against the WHO browser. Any urological condition outside those three is " +
    "resolved through the central service at selection time, and an unresolved condition is stored with NO code.",
};

// The diagnostic statuses a urologist records. A provisional or differential
// diagnosis is a hypothesis; only the clinician documents confirmation.
export const URO_ICD_STATUSES = [
  "Confirmed",
  "Provisional",
  "Suspected",
  "Differential — not confirmed",
  "Historical — resolved",
  "Resolved",
  "Symptom — no definitive diagnosis",
  "Sign — no definitive diagnosis",
];

export const URO_ICD_ROLES = ["Primary", "Secondary"];

// Detail a code cannot carry. Recorded beside the code, never encoded into it.
export const URO_ICD_DETAIL_FIELDS = [
  { key: "laterality", label: "Laterality", type: "select", options: ["Right", "Left", "Bilateral", "Midline", "Not applicable"] },
  { key: "anatomic_site", label: "Anatomical site / segment", type: "input" },
  { key: "stage_or_severity", label: "Stage / grade / severity as documented", type: "input" },
  { key: "detail_note", label: "Detail the code cannot carry", type: "input" },
];

export const URO_ICD_CATALOG_NOTE =
  "Bundled catalogue entries are shown as REVIEW REQUIRED: they were read from the published ICD-11 MMS tabulation " +
  "and not yet confirmed in the WHO browser for this deployment. Inclusion and exclusion terms are not reproduced " +
  "here — open the WHO browser entry to read them.";

export const URO_ICD_CLUSTER_NOTE =
  "Postcoordination: a cluster is entered exactly as the WHO Coding Tool displays it and stored as review required. " +
  "AMedix never builds, completes or guesses a cluster.";

// The three entries already verified in the workspace catalogue, labelled for
// urology. Nothing is added that the workspace catalogue does not already hold.
const CATALOGUE_NOTE_BASE =
  "Held in the AMedix ICD-11 catalogue. Confirm inclusion and exclusion terms in the WHO browser before relying on a residual code.";

export const URO_ICD11 = [
  {
    code: "GB70.0",
    display: "Calculus of kidney",
    aliases: "kidney stone renal calculus nephrolithiasis renal colic",
    synonyms: ["kidney stone", "renal calculus", "nephrolithiasis", "renal colic"],
    definition: "Urinary calculus located in the renal calyces or the renal pelvis.",
    criteria: "Document stone size, site and obstruction on imaging.",
    specificity: SPECIFICITY.SUB,
    release: URO_ICD11_MMS.release,
    source: "AMedix verified ICD-11 catalogue",
    mapping_state: "review_required",
    verified_date: "",
    coding_note: CATALOGUE_NOTE_BASE,
    category: "medical_condition",
  },
  {
    code: "GB60",
    display: "Acute kidney failure",
    aliases: "AKI acute kidney injury acute renal failure obstructive uropathy",
    synonyms: ["AKI", "acute kidney injury", "acute renal failure", "obstructive AKI"],
    definition: "Rapid deterioration of kidney function, with or without reduced urine output, developing over hours to days.",
    criteria: "KDIGO 2012 definition and staging — document baseline and current creatinine with their dates.",
    specificity: SPECIFICITY.BLOCK,
    release: URO_ICD11_MMS.release,
    source: "AMedix verified ICD-11 catalogue",
    mapping_state: "review_required",
    verified_date: "",
    coding_note: CATALOGUE_NOTE_BASE,
    category: "medical_condition",
  },
  {
    code: "GB61",
    display: "Chronic kidney disease",
    aliases: "CKD chronic renal impairment chronic renal failure",
    synonyms: ["CKD", "chronic renal failure", "chronic renal impairment"],
    definition: "Abnormalities of kidney structure or function present for more than three months, with implications for health.",
    criteria: "KDIGO CKD definition — chronicity must be documented (values ≥ 3 months apart or structural evidence).",
    specificity: SPECIFICITY.BLOCK,
    release: URO_ICD11_MMS.release,
    source: "AMedix verified ICD-11 catalogue",
    mapping_state: "review_required",
    verified_date: "",
    coding_note: CATALOGUE_NOTE_BASE,
    category: "medical_condition",
  },
];

// COVERAGE CHECKLIST — the urological conditions this portal must be able to
// code. Each row is a SEARCH TERM for the central ICD-11 service, never a code.
// The list is a coverage checklist, not a replacement for the WHO classification.
const C = (key, label, whoQuery) => ({ key, label, whoQuery });

export const URO_CONDITION_GROUPS = [
  {
    key: "kidney_upper_tract",
    label: "Kidney & upper urinary tract",
    conditions: [
      C("renal_calculus", "Renal calculus (nephrolithiasis)", "calculus of kidney"),
      C("renal_colic", "Renal colic", "renal colic"),
      C("aki", "Acute kidney injury", "acute kidney failure"),
      C("ckd", "Chronic kidney disease", "chronic kidney disease"),
      C("hydronephrosis", "Hydronephrosis", "hydronephrosis"),
      C("obstructed_kidney", "Obstructed kidney / obstructive uropathy", "obstructive uropathy"),
      C("pyelonephritis", "Acute pyelonephritis", "acute pyelonephritis"),
      C("renal_abscess", "Renal abscess", "renal abscess"),
      C("renal_cyst", "Renal cyst (simple / complex)", "cyst of kidney"),
      C("pcKD", "Polycystic kidney disease", "polycystic kidney disease"),
      C("duplex_kidney", "Duplex kidney / congenital renal anomaly", "congenital anomaly of kidney"),
      C("horseshoe_kidney", "Horseshoe kidney", "horseshoe kidney"),
      C("renal_trauma", "Renal injury", "injury of kidney"),
      C("rcc", "Renal cell carcinoma", "renal cell carcinoma"),
      C("utuc", "Upper tract urothelial carcinoma", "carcinoma of renal pelvis"),
      C("renal_haematuria", "Haematuria of renal origin", "haematuria"),
    ],
  },
  {
    key: "ureter",
    label: "Ureter",
    conditions: [
      C("ureteric_calculus", "Ureteric calculus", "calculus of ureter"),
      C("ureteric_obstruction", "Ureteric obstruction", "obstruction of ureter"),
      C("ureteric_stricture", "Ureteric stricture", "stricture of ureter"),
      C("ureteric_malignancy", "Ureteric malignancy", "malignant neoplasm of ureter"),
      C("ureteric_injury", "Ureteric injury", "injury of ureter"),
      C("upj_obstruction", "Pelvi-ureteric junction obstruction", "pelviureteric junction obstruction"),
      C("vesicoureteric_reflux", "Vesicoureteric reflux", "vesicoureteric reflux"),
    ],
  },
  {
    key: "bladder",
    label: "Bladder",
    conditions: [
      C("cystitis", "Cystitis", "cystitis"),
      C("recurrent_uti", "Recurrent urinary tract infection", "recurrent urinary tract infection"),
      C("bladder_calculus", "Bladder calculus", "calculus of bladder"),
      C("neurogenic_bladder", "Neurogenic bladder", "neurogenic bladder"),
      C("urinary_retention", "Urinary retention", "retention of urine"),
      C("oab", "Overactive bladder", "overactive bladder"),
      C("incontinence", "Urinary incontinence", "urinary incontinence"),
      C("stress_incontinence", "Stress urinary incontinence", "stress incontinence"),
      C("urgency_incontinence", "Urgency urinary incontinence", "urgency incontinence"),
      C("bladder_diverticulum", "Bladder diverticulum", "diverticulum of bladder"),
      C("bladder_cancer", "Bladder cancer", "malignant neoplasm of bladder"),
      C("bladder_pain", "Bladder pain syndrome", "bladder pain syndrome"),
      C("bladder_trauma", "Bladder injury", "injury of bladder"),
      C("clot_retention", "Clot retention", "retention of urine"),
      C("vesicovaginal_fistula", "Vesicovaginal fistula", "vesicovaginal fistula"),
      C("cystocele", "Pelvic organ prolapse (cystocele)", "cystocele"),
    ],
  },
  {
    key: "prostate",
    label: "Prostate",
    conditions: [
      C("bph", "Benign prostatic hyperplasia / LUTS", "benign prostatic hyperplasia"),
      C("acute_prostatitis", "Acute prostatitis", "acute prostatitis"),
      C("chronic_prostatitis", "Chronic prostatitis / chronic pelvic pain", "chronic prostatitis"),
      C("prostatic_abscess", "Prostatic abscess", "abscess of prostate"),
      C("prostate_cancer", "Prostate cancer", "malignant neoplasm of prostate"),
      C("elevated_psa", "Elevated PSA (no diagnosis)", "elevated prostate specific antigen"),
    ],
  },
  {
    key: "urethra",
    label: "Urethra",
    conditions: [
      C("urethral_stricture", "Urethral stricture", "stricture of urethra"),
      C("urethral_trauma", "Urethral injury", "injury of urethra"),
      C("urethritis", "Urethritis", "urethritis"),
      C("urethral_carcinoma", "Urethral carcinoma", "malignant neoplasm of urethra"),
      C("meatal_stenosis", "Meatal stenosis", "meatal stenosis"),
    ],
  },
  {
    key: "male_genital",
    label: "Male reproductive & genital",
    conditions: [
      C("ed", "Erectile dysfunction", "erectile dysfunction"),
      C("male_infertility", "Male infertility", "male infertility"),
      C("varicocele", "Varicocele", "varicocele"),
      C("hydrocele", "Hydrocele", "hydrocele"),
      C("spermatocele", "Spermatocele", "spermatocele"),
      C("torsion", "Testicular torsion", "torsion of testis"),
      C("epididymitis", "Epididymitis", "epididymitis"),
      C("orchitis", "Orchitis", "orchitis"),
      C("testicular_tumour", "Testicular tumour", "malignant neoplasm of testis"),
      C("cryptorchidism", "Cryptorchidism / undescended testis", "undescended testis"),
      C("peyronie", "Peyronie disease", "Peyronie disease"),
      C("phimosis", "Phimosis", "phimosis"),
      C("paraphimosis", "Paraphimosis", "paraphimosis"),
      C("priapism", "Priapism", "priapism"),
      C("balanitis", "Balanitis / balanoposthitis", "balanitis"),
      C("fournier", "Fournier gangrene", "Fournier gangrene"),
      C("hypogonadism", "Male hypogonadism", "hypogonadism"),
    ],
  },
  {
    key: "female_urology",
    label: "Female urology",
    conditions: [
      C("female_incontinence", "Female urinary incontinence", "urinary incontinence"),
      C("pelvic_prolapse", "Pelvic organ prolapse", "prolapse of female genital organ"),
      C("female_boo", "Female bladder outlet obstruction", "bladder outlet obstruction"),
      C("female_bps", "Bladder pain syndrome (female)", "bladder pain syndrome"),
      C("urethral_caruncle", "Urethral caruncle / prolapse", "urethral caruncle"),
    ],
  },
  {
    key: "paediatric",
    label: "Paediatric urology",
    conditions: [
      C("vur", "Vesicoureteric reflux (paediatric)", "vesicoureteric reflux"),
      C("hypospadias", "Hypospadias", "hypospadias"),
      C("epispadias", "Epispadias", "epispadias"),
      C("puv", "Posterior urethral valves", "posterior urethral valve"),
      C("paed_cryptorchidism", "Undescended testis (paediatric)", "undescended testis"),
      C("paed_hydronephrosis", "Congenital hydronephrosis", "congenital hydronephrosis"),
      C("paed_upj", "Congenital pelvi-ureteric junction obstruction", "congenital pelviureteric junction obstruction"),
      C("enuresis", "Nocturnal enuresis", "enuresis"),
      C("bladder_exstrophy", "Bladder exstrophy / epispadias complex", "exstrophy of bladder"),
      C("paed_phimosis", "Phimosis (paediatric)", "phimosis"),
    ],
  },
  {
    key: "neuro_urology",
    label: "Neuro-urology",
    conditions: [
      C("neuro_spinal", "Neurogenic bladder (spinal cord injury)", "neurogenic bladder"),
      C("detrusor_overactivity", "Detrusor overactivity", "detrusor overactivity"),
      C("dsd", "Detrusor sphincter dyssynergia", "detrusor sphincter dyssynergia"),
      C("cauda_equina", "Cauda equina syndrome", "cauda equina syndrome"),
      C("ms_bladder", "Bladder dysfunction in multiple sclerosis", "neurogenic bladder"),
      C("spina_bifida", "Spina bifida with bladder dysfunction", "spina bifida"),
    ],
  },
  {
    key: "trauma",
    label: "Urological trauma",
    conditions: [
      C("renal_injury", "Renal trauma", "injury of kidney"),
      C("bladder_rupture", "Bladder rupture", "injury of bladder"),
      C("urethral_injury", "Urethral injury", "injury of urethra"),
      C("penile_fracture", "Penile fracture", "fracture of penis"),
      C("testicular_rupture", "Testicular rupture", "injury of testis"),
      C("scrotal_trauma", "Scrotal trauma", "injury of scrotum"),
    ],
  },
  {
    key: "transplant",
    label: "Transplant-related urology",
    conditions: [
      C("graft_dysfunction", "Renal graft dysfunction", "complication of transplanted kidney"),
      C("graft_ureteric_stricture", "Ureteric stricture after transplantation", "stricture of ureter"),
      C("lymphocele", "Lymphocele after transplantation", "lymphocele"),
      C("graft_reflux", "Vesicoureteric reflux in the graft", "vesicoureteric reflux"),
    ],
  },
  {
    key: "postoperative",
    label: "Postoperative & procedural complications",
    conditions: [
      C("postop_haematuria", "Post-procedural haematuria", "haematuria"),
      C("postop_retention", "Post-procedural urinary retention", "retention of urine"),
      C("postop_stricture", "Anastomotic / post-procedural stricture", "stricture of urethra"),
      C("stent_complication", "Ureteric stent complication", "complication of urinary device"),
      C("ssi", "Surgical site infection", "surgical site infection"),
      C("anastomotic_leak", "Anastomotic leak", "complication of anastomosis"),
    ],
  },
];

export const URO_CONDITION_COUNT = URO_CONDITION_GROUPS.reduce((n, g) => n + g.conditions.length, 0);

// Conditions the urology portal must cover that are coded elsewhere or need a
// category decision this catalogue cannot make. Listed rather than guessed.
export const URO_ICD_OUTSIDE_CATALOGUE = [
  "Urological malignancy staging — the neoplasm code itself is held in Chapter 02 and is coded with the oncology service",
  "Post-transplant graft rejection — coded with the nephrology / transplant service",
  "Congenital malformations of the urinary tract — Chapter 20 categories, confirmed per anomaly",
  "Urological injury categories — Chapter 22, confirmed per injured organ and mechanism",
  "Postcoordination — laterality, stage, obstruction and stone burden are recorded beside the code, never inside it",
];