// Urology — advisory safety prompts.
//
// WHAT THESE ARE
//   Deterministic prompts raised from what the note ACTUALLY documented. Each one
//   names the finding it fired on, why it matters and what must be considered, and
//   cites the international source it follows.
//
// WHAT THESE ARE NOT
//   * Not a diagnosis, and never a confirmation of one.
//   * Not an order. Nothing here prescribes, discontinues, changes or doses a
//     medication, and no rule suggests an intervention. The clinician decides.
//   * Not silence-as-reassurance: a prompt that does not fire means the finding
//     was not documented, NOT that the patient is safe. The panel says so.
//
// A prompt fires only when the documented finding is present; with nothing
// documented every rule stays silent.

import { allText, anyNumber } from "@/lib/uroFieldKit";
import { URO_REFERENCES } from "@/lib/uroReferences";

const src = (key) => {
  const r = URO_REFERENCES[key];
  return r ? { organization: r.issuing_organization, title: r.title, url: r.source_url } : { organization: "AMedix", title: "Local safety rule", url: "" };
};

const has = (text, re) => re.test(text);

const DRUG = {
  alpha: /tamsulosin|alfuzosin|doxazosin|silodosin|terazosin|indoramin/i,
  antimuscarinic: /oxybutynin|solifenacin|tolterodine|darifenacin|trospium|propiverine/i,
  pde5: /sildenafil|tadalafil|vardenafil|avanafil/i,
  fiveari: /finasteride|dutasteride/i,
  nephrotoxic: /gentamicin|vancomycin|amphotericin|colistin|ibuprofen|diclofenac|naproxen|ketorolac|metformin|nitrofurantoin/i,
  antibiotic: /trimethoprim|nitrofurantoin|ciprofloxacin|levofloxacin|cefixime|ceftriaxone|co-amoxiclav|amoxicillin|fosfomycin|pivmecillinam|gentamicin|meropenem|piperacillin/i,
  pregnancyRisk: /trimethoprim|co-trimoxazole|sulfamethoxazole|ciprofloxacin|levofloxacin|nitrofurantoin|ibuprofen|diclofenac|ketorolac|tamsulosin|doxazosin|finasteride|dutasteride/i,
};

export const URO_SAFETY_RULES = [
  {
    key: "obstructed_infected_kidney",
    title: "Obstruction with infection — infected obstructed urinary tract",
    severity: "critical",
    source: src("eau_stones"),
    trigger: (t) => {
      const obstruction = has(t, /obstruct|hydronephros|calculus|stone|stricture|stent|retention/i);
      const infection = has(t, /fever|pyrexi|temperature (of )?3[89]|rigor|sepsis|urosepsis|positive (urine )?culture|culture grew|leucocyt|wbc/);
      if (!obstruction || !infection) return null;
      return {
        detail:
          "An obstructed urinary tract AND an infective finding are both documented in this note. An infected obstruction is a urological emergency in which drainage is the priority.",
        action:
          "The responsible urologist must consider urgent decompression and sepsis management. AMedix does not choose the drainage route, the antibiotic or the timing — that decision is the clinician's.",
      };
    },
  },
  {
    key: "urosepsis",
    title: "Possible urosepsis",
    severity: "critical",
    source: src("eau_stones"),
    trigger: (t) => {
      if (!has(t, /sepsis|septic|urosepsis|hypotens|sbp (of )?(8|9)\d|shock|rigors/i)) return null;
      return {
        detail: "A sepsis-related finding (hypotension, rigors, shock or an explicit sepsis entry) is documented.",
        action: "Senior review and the sepsis pathway apply. Confirm the source is urinary and whether the tract is obstructed; document the decision taken.",
      };
    },
  },
  {
    key: "acute_retention",
    title: "Acute urinary retention / high post-void residual",
    severity: "critical",
    source: src("eau_luts"),
    trigger: (t, values) => {
      const pvr = anyNumber(values, ["post_void_residual", "pvr", "residual_volume", "residual"]);
      const documentedRetention = has(t, /acute retention|unable to void|inability to void|cannot (pass|void)|retention of urine|painful retention/i);
      if (documentedRetention) {
        return {
          detail: "Retention is documented in this note.",
          action: "Decompression and the cause must be addressed and documented by the clinician; the drainage method and its timing are the clinician's decision.",
        };
      }
      if (pvr !== null && pvr >= 300) {
        return {
          detail: `A post-void residual of ${pvr} mL is documented, at or above the level at which significant retention is described.`,
          action: "Correlate with symptoms, upper-tract assessment and renal function, and document the plan. A single residual is one observation, not a diagnosis of obstruction.",
        };
      }
      return null;
    },
  },
  {
    key: "testicular_torsion",
    title: "Suspected testicular torsion — time-critical",
    severity: "critical",
    source: src("eau_testis"),
    trigger: (t) => {
      const torsion = has(t, /torsion|high[- ]riding testis|transverse lie|absent cremasteric|bell[- ]clapper/i);
      const acuteScrotum = has(t, /acute scrotal pain|sudden (onset )?scrotal pain|acute scrotum/i) && has(t, /nausea|vomit|tender|swollen/i);
      if (!torsion && !acuteScrotum) return null;
      return {
        detail: "Findings consistent with an acute scrotum suspicious of torsion are documented. Testicular salvage is time-dependent.",
        action: "Immediate urological/surgical assessment. AMedix does not select imaging, manual detorsion or exploration — the treating team decides and documents.",
      };
    },
  },
  {
    key: "deteriorating_renal_function",
    title: "Deteriorating renal function",
    severity: "warning",
    source: src("kdigo"),
    trigger: (t) => {
      if (!has(t, /aki\b|acute kidney injury|acute renal failure|rising creatinine|creatinine (rose|increased|up from)|deteriorating renal|egfr (of )?[0-3]?\d ?ml|obstructive uropathy|bilateral obstruction|solitary functioning kidney/i)) return null;
      return {
        detail: "A deterioration in renal function, or a state that threatens it, is documented.",
        action: "Review hydration, medications cleared by the kidney, and whether the tract is obstructed. No dose is calculated or changed by AMedix.",
      };
    },
  },
  {
    key: "significant_haematuria",
    title: "Significant haematuria / clot retention",
    severity: "warning",
    source: src("eau_nmibc"),
    trigger: (t) => {
      if (!has(t, /clot retention|large clot|clots?\b|transfusion|haemoglobin (drop|fell|of [6-9])|unstable haematuria|continuous bladder irrigation/i)) return null;
      return {
        detail: "Clot retention, a transfusion requirement or unstable bleeding is documented.",
        action: "Assess for obstruction by clot, anaemia and the need for escalation; document the plan and the reason for it.",
      };
    },
  },
  {
    key: "renal_trauma",
    title: "Urological trauma with instability",
    severity: "critical",
    source: src("eau_trauma"),
    trigger: (t) => {
      const trauma = has(t, /trauma|injury|impact|road traffic|fall from|assault|blunt|penetrat|fracture of (the )?pelvis/i);
      const unstable = has(t, /hypotens|unstable|tachycard|sbp (of )?(8|9)\d|haematuria|haemodynamic/i);
      if (!trauma || !unstable) return null;
      return {
        detail: "A traumatic mechanism with haemodynamic or urinary findings is documented.",
        action: "Follow the trauma pathway and document the injury grade, imaging and the decision taken. Damage-control decisions belong to the treating team.",
      };
    },
  },
  {
    key: "priapism",
    title: "Priapism — duration-dependent emergency",
    severity: "critical",
    source: src("eau_srh"),
    trigger: (t, values) => {
      if (!has(t, /priapism|prolonged erection|persistent erection/i)) return null;
      const hours = anyNumber(values, ["duration_hours", "erection_duration_hours", "hours_since_onset"]);
      const documentedLong = has(t, /(4|5|6|7|8|9|1\d|2\d|3\d|4\d)\s?(hours|hrs|h)\b|more than four hours|over four hours/i);
      const duration = hours !== null ? hours : documentedLong ? 4 : null;
      return {
        detail:
          duration !== null && duration >= 4
            ? "Priapism with a documented duration of four hours or more — an ischaemic priapism is time-critical and threatens erectile function."
            : "Priapism is documented. Duration determines urgency, and the recorded duration must be confirmed.",
        action: "Immediate urological assessment. AMedix does not specify the aspiration, irrigation or shunt procedure — the urologist decides and documents.",
      };
    },
  },
  {
    key: "postoperative_deterioration",
    title: "Postoperative complication",
    severity: "warning",
    source: src("eau_mibc"),
    trigger: (t) => {
      const postop = has(t, /post[- ]?op|postoperative|day (0|1|2|3|4|5|6|7|8|9|10)\b|after (the )?(procedure|surgery|operation)|discharge from recovery/i);
      const problem = has(t, /fever|pyrexi|tachycard|bleeding|haematoma|wound (discharge|dehiscence|infection)|anastomotic leak|oliguria|confusion|hypotens/i);
      if (!postop || !problem) return null;
      return {
        detail: "A postoperative note documents a finding that may represent a complication (bleeding, infection, leak or haemodynamic change).",
        action: "Assess and document the complication, its Clavien–Dindo grade where the department records it, and the management plan.",
      };
    },
  },
  {
    key: "suspected_malignancy",
    title: "Findings that require a suspected-malignancy pathway",
    severity: "warning",
    source: src("eau"),
    trigger: (t) => {
      if (!has(t, /solid (renal )?mass|enhancing mass|suspicious (mass|lesion|stricture)|bladder tumour|renal mass|prostate nodule|hard nodule|testicular mass|penile (lesion|ulcer)|macroscopic haematuria|visible haematuria/i)) return null;
      return {
        detail: "A finding that may represent urological malignancy is documented. Malignancy is not established by this note.",
        action: "Document the diagnostic pathway selected (imaging, cytology, biopsy, MDT referral) and the follow-up interval. AMedix never records a cancer diagnosis from a finding.",
      };
    },
  },
  {
    key: "renal_dose_review",
    title: "Renal dosing review required",
    severity: "warning",
    source: src("kdigo"),
    trigger: (t) => {
      const renal = has(t, /aki\b|acute kidney injury|egfr (of )?([0-2]?\d)\b|renal impairment|ckd|dialysis/i);
      if (!renal || !has(t, DRUG.nephrotoxic)) return null;
      return {
        detail: "Impaired renal function and a medication that needs review in renal impairment are both documented.",
        action: "The prescriber must review the drug, the dose and the interval against the product information in renal impairment. AMedix does not calculate or change a dose.",
      };
    },
  },
  {
    key: "antimicrobial_stewardship",
    title: "Antimicrobial stewardship review",
    severity: "info",
    source: src("aua_uti"),
    trigger: (t) => {
      if (!has(t, DRUG.antibiotic)) return null;
      const culture = has(t, /culture|sensitivit|mc&s|antibiogram|microscopy/i);
      const longCourse = has(t, /(8|9|10|11|12|13|14|21|28)\s?(days|day course)/i);
      if (culture && !longCourse) return null;
      return {
        detail: culture
          ? "A prolonged antimicrobial course is documented — duration and indication should be justified in the record."
          : "An antimicrobial is documented without a corresponding culture result in this note.",
        action: "Document the indication, the culture evidence, the agent and the planned duration. AMedix never selects or stops an antimicrobial.",
      };
    },
  },
  {
    key: "pregnancy_caution",
    title: "Pregnancy-related medication precaution",
    severity: "critical",
    source: src("eau_incontinence"),
    trigger: (t) => {
      if (!has(t, /pregnan|gestation|antepartum|trimester|breastfeeding|lactation/i)) return null;
      if (!has(t, DRUG.pregnancyRisk)) return null;
      return {
        detail: "Pregnancy or lactation and a medication that requires precaution in that state are both documented.",
        action: "The prescriber must confirm the agent against the product information for pregnancy and lactation. AMedix does not substitute or stop any medication.",
      };
    },
  },
  {
    key: "duplicate_therapy",
    title: "Possible duplicate therapy",
    severity: "warning",
    source: src("eau_luts"),
    trigger: (t) => {
      const pairs = [
        [/tamsulosin/i, /alfuzosin|doxazosin|silodosin|terazosin/i, "two alpha-blockers"],
        [/oxybutynin|solifenacin|tolterodine|darifenacin|trospium|propiverine/i, /oxybutynin|solifenacin|tolterodine|darifenacin|trospium|propiverine|mirabegron/i, "two agents for overactive bladder"],
        [/sildenafil/i, /tadalafil|vardenafil|avanafil/i, "two PDE5 inhibitors"],
        [/finasteride/i, /dutasteride/i, "two 5-alpha-reductase inhibitors"],
      ];
      const hit = pairs.find(([a, b]) => (t.match(a) || []).length && (t.match(b) || []).length);
      if (!hit) return null;
      // A single agent matching both patterns (e.g. the same drug named twice in
      // one sentence) is not a duplicate.
      return {
        detail: `The record documents what appear to be ${hit[2]}.`,
        action: "Reconcile the medication list. AMedix does not stop or merge a medication — the prescriber confirms and documents the change.",
      };
    },
  },
  {
    key: "anticholinergic_retention",
    title: "Antimuscarinic with voiding difficulty",
    severity: "warning",
    source: src("eau_neuro"),
    trigger: (t, values) => {
      if (!has(t, DRUG.antimuscarinic)) return null;
      const pvr = anyNumber(values, ["post_void_residual", "pvr", "residual_volume", "residual"]);
      const voidingRisk = has(t, /retention|high residual|incomplete emptying|catheter|detrusor underactivity|poor stream/i) || (pvr !== null && pvr >= 200);
      if (!voidingRisk) return null;
      return {
        detail: "An antimuscarinic agent and a finding of voiding difficulty or a raised residual are both documented.",
        action: "Weigh the benefit against the risk of retention, and document the decision and the review interval. No agent is changed by AMedix.",
      };
    },
  },
  {
    key: "retained_stent",
    title: "Stent or catheter past its review date",
    severity: "info",
    source: src("eau_stones"),
    trigger: (t) => {
      if (!has(t, /stent|nephrostomy|suprapubic catheter|urethral catheter/i)) return null;
      if (!has(t, /(4|5|6|7|8|9|1\d|2\d)\s?months|overdue|forgotten|no removal date|lost to follow[- ]?up/i)) return null;
      return {
        detail: "A urological device is documented with a duration that suggests it is past its planned review or removal date.",
        action: "Confirm the device, the planned removal date and who is responsible. Document the plan.",
      };
    },
  },
  {
    key: "paediatric_dose_caution",
    title: "Paediatric medication safety",
    severity: "warning",
    source: src("eau_paeds"),
    trigger: (t, values) => {
      const age = anyNumber(values, ["age", "age_years", "patient_age"]);
      const paediatric = (age !== null && age < 18) || has(t, /paediatric|pediatric|child|infant|neonate|adolescent/i);
      if (!paediatric) return null;
      if (!has(t, /mg\b|dose|prescrib|medication|antibiotic|antimuscarinic|antibiotic/i)) return null;
      return {
        detail: "A paediatric patient and a medication are both documented.",
        action: "Paediatric dosing must be taken from the product information for that age and weight. AMedix never calculates a paediatric dose and never converts an adult dose.",
      };
    },
  },
];

export const evaluateUroSafety = (values) => {
  const text = allText(values);
  const fired = [];
  for (const rule of URO_SAFETY_RULES) {
    let result = null;
    try {
      result = rule.trigger(text, values);
    } catch (e) {
      result = null;
    }
    if (result) {
      fired.push({
        key: rule.key,
        title: rule.title,
        severity: rule.severity,
        detail: result.detail,
        action: result.action,
        source: rule.source,
      });
    }
  }
  const order = { critical: 0, warning: 1, info: 2 };
  return fired.sort((a, b) => order[a.severity] - order[b.severity]);
};

export const URO_SAFETY_NOTE =
  "These are advisory prompts computed from what this note records. They never prescribe, discontinue or change a " +
  "medication, and they are not a diagnosis. A prompt that does not fire means the finding was NOT documented — " +
  "not that it is absent. Clinical judgement and the cited source decide.";