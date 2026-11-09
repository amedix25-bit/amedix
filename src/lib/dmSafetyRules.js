// Dermatology — advisory safety prompts.
//
// Each prompt compares what the note actually recorded with the requirement of the
// cited document. It states what was documented, the requirement it addresses and
// the source. It never diagnoses, never orders treatment and never changes a
// diagnosis. Nothing here blocks saving the note, and nothing here delays urgent
// clinical care: a prompt is written to be read alongside the note, not before it.
//
// WHERE THE VALUES COME FROM
//   · The note's own structured blocks (lesion, infection, reaction, acne, eczema,
//     psoriasis, autoimmune, hair/nail, follow-up) and the inputs documented in the
//     validated instruments.
//   · Nothing is parsed out of free text, nothing is estimated, and a blank is never
//     read as a negative finding.

import { dmBlockValues } from "@/lib/dmBlocks";
import { calculateDmScore, dmScoreInputs } from "@/lib/dmScores";
import { DM_REFERENCES } from "@/lib/dmReferences";
import { asObject, str, num } from "@/lib/fmFieldKit";

export const DM_SAFETY_PROVENANCE = {
  guideline: "Guideline requirement",
  local: "AMedix local decision — not a guideline claim",
};

const src = (key) => DM_REFERENCES[key] || DM_REFERENCES.aad;

const bv = (values, block) => dmBlockValues(values, block);
const f = (values, block, field) => str(bv(values, block)[field]);
const multi = (values, block, field) => {
  const v = bv(values, block)[field];
  return Array.isArray(v) ? v.map((x) => String(x)) : str(v) ? [str(v)] : [];
};
const has = (values, block, field, needle) =>
  multi(values, block, field).some((x) => x.toLowerCase().includes(needle.toLowerCase()));

// A score is usable only when every documented input is present.
const scored = (values, key) => {
  const result = calculateDmScore(key, dmScoreInputs(values, "dm_scores", key));
  return result && !result.missing?.length ? result : null;
};

export const DM_SAFETY_RULES = [
  // ------------------------------------------------------------ malignancy
  {
    key: "melanoma_urgent",
    level: "critical",
    title: "Lesion documented as highly suspicious — urgent pathway",
    source: "nccn",
    when: (values) => {
      if (f(values, "dm_lesion_cancer", "suspicion") !== "Highly suspicious — urgent pathway") return null;
      return "The lesion is documented as highly suspicious, which the cited guidance routes to urgent assessment and biopsy rather than observation.";
    },
    ask: "Document the dermoscopic features, the biopsy arranged and its timing, and who will review the histopathology result. Urgent referral is never delayed by completing this note.",
  },
  {
    key: "melanoma_change",
    level: "high",
    title: "Rapidly changing lesion with suspicious features",
    source: "nccn",
    when: (values) => {
      const evolution = f(values, "dm_lesion_cancer", "evolution");
      if (evolution !== "Rapidly changing") return null;
      const features =
        f(values, "dm_lesion_cancer", "colour_variation") === "Two or more colours" ||
        f(values, "dm_lesion_cancer", "border_irregular") === "Irregular" ||
        f(values, "dm_lesion_cancer", "ugly_duckling").startsWith("Present") ||
        f(values, "dm_lesion_cancer", "symptoms") !== "";
      if (!features) return null;
      return "A rapidly changing lesion is documented together with at least one other recorded suspicious feature (colour variation, irregular border, ugly-duckling sign or lesion symptoms).";
    },
    ask: "Document the dermoscopic assessment and the decision taken — biopsy, monitoring with a stated interval and method, or discharge with instructions.",
  },
  {
    key: "histology_outstanding",
    level: "high",
    title: "Histopathology outstanding on a lesion that was biopsied",
    source: "aad",
    when: (values) => {
      if (f(values, "dm_lesion_cancer", "biopsy") !== "Yes") return null;
      const pending = ["Awaiting report", "Recut / second opinion requested"].includes(
        f(values, "dm_lesion_cancer", "histology_pending"),
      );
      if (!pending) return null;
      return "A biopsy is documented in this episode and the histopathology is recorded as outstanding.";
    },
    ask: "Document who will review the report, how the patient is told the result, and the review interval. An outstanding report needs an owner, not only a status.",
  },
  {
    key: "nodes_fixed",
    level: "high",
    title: "Palpable fixed or matted regional lymph nodes",
    source: "nccn",
    when: (values) => {
      if (f(values, "dm_exam", "lymph_nodes") !== "Palpable — fixed / matted") return null;
      return "Regional lymph nodes are documented as palpable and fixed or matted.";
    },
    ask: "Document the nodal basin examined, the imaging or sampling arranged, and the referral made. Node status is part of skin-cancer staging and is never assumed.",
  },

  // ------------------------------------------------------------ severe reactions
  {
    key: "sjs_ten",
    level: "critical",
    title: "Possible Stevens-Johnson syndrome / toxic epidermal necrolysis",
    source: "bad",
    when: (values) => {
      const blistering = has(values, "dm_other", "drug_severity", "Blistering / skin detachment");
      const mucosal = has(values, "dm_other", "drug_severity", "Mucosal involvement");
      if (!blistering && !mucosal) return null;
      const culprit = f(values, "dm_other", "drug_suspect");
      return `A drug eruption is documented with ${blistering ? "blistering or skin detachment" : "mucosal involvement"}${culprit ? ` (suspected drug recorded: ${culprit})` : ""}.`;
    },
    ask: "Document the culprit drug and the date it was stopped, the body surface area detached, fluid and wound management, mucosal and ophthalmology review, analgesia, and the escalation made. This presentation is managed as an emergency; the note follows the patient.",
  },
  {
    key: "erythroderma",
    level: "critical",
    title: "Erythroderma documented",
    source: "bad",
    when: (values) => {
      if (!has(values, "dm_other", "condition", "Erythroderma")) return null;
      const extent = num(bv(values, "dm_eczema").affected_percent);
      const bsa = scored(values, "bsa");
      const figure = bsa ? ` Recorded body surface involvement: ${bsa.value}%.` : extent !== null ? ` Recorded affected surface: ${extent}%.` : "";
      return `Erythroderma is recorded as the documented condition.${figure}`;
    },
    ask: "Document temperature and haemodynamic observations, fluid and protein losses, the cause being investigated (drug, psoriasis, eczema, lymphoma), the skin biopsy arranged, and the admission or escalation decision.",
  },
  {
    key: "angioedema_airway",
    level: "critical",
    title: "Angioedema with airway or tongue involvement",
    source: "eadv",
    when: (values) => {
      if (f(values, "dm_other", "angioedema_airway") !== "Yes — emergency management documented") {
        return f(values, "dm_other", "angioedema_airway") === "Yes" ? "Angioedema with airway or tongue involvement is documented." : null;
      }
      return "Angioedema with airway or tongue involvement is documented.";
    },
    ask: "Document the airway assessment, the treatment given and its timing, the observations, and the admission decision. Emergency care is never delayed to complete this record.",
  },
  {
    key: "necrotic_infection",
    level: "critical",
    title: "Cutaneous infection with features of necrotising soft-tissue infection",
    source: "bad",
    when: (values) => {
      const markers = ["Pain out of proportion", "Skin necrosis", "Crepitus", "Rapid spread"].filter((m) =>
        has(values, "dm_infection", "systemic_features", m),
      );
      if (!markers.length) return null;
      return `Recorded features: ${markers.join(", ")}.`;
    },
    ask: "Document the observations, the surgical opinion sought and its timing, the antimicrobials given, and the resuscitation. This is a surgical emergency and the note is completed alongside it.",
  },

  // ------------------------------------------------------------ blistering disease
  {
    key: "blistering_without_dif",
    level: "high",
    title: "Blistering disease suspected without direct immunofluorescence sampling",
    source: "bad",
    when: (values) => {
      const suspected = f(values, "dm_autoimmune", "suspected");
      if (!["Pemphigus", "Pemphigoid", "Linear IgA disease", "Epidermolysis bullosa acquisita"].includes(suspected)) return null;
      const dif = multi(values, "dm_autoimmune", "samples").some((s) => s.includes("direct immunofluorescence"));
      if (dif) return null;
      return `${suspected} is documented as the suspected group and no perilesional direct immunofluorescence sample is recorded.`;
    },
    ask: "Document whether perilesional immunofluorescence was taken, or why it was not possible, and how the diagnosis will be established. Appearance alone does not confirm a blistering disease.",
  },
  {
    key: "blistering_mucosal",
    level: "high",
    title: "Mucosal involvement in a blistering disorder",
    source: "bad",
    when: (values) => {
      const mucosal = f(values, "dm_autoimmune", "mucosal");
      if (!mucosal || mucosal === "None" || mucosal === "Not examined") return null;
      return `Mucosal involvement is documented as: ${mucosal}.`;
    },
    ask: "Document the ophthalmology and oral medicine review arranged, the topical measures and the analgesia. Ocular involvement can scar within days.",
  },

  // ------------------------------------------------------------ drugs
  {
    key: "isotretinoin_pregnancy",
    level: "critical",
    title: "Isotretinoin with pregnancy status not established",
    source: "aad",
    when: (values) => {
      if (f(values, "dm_acne", "isotretinoin") !== "Yes") return null;
      const status = f(values, "dm_acne", "pregnancy_status");
      if (status === "Not pregnant — tested" || status === "Not applicable") return null;
      if (status === "Pregnant") return "Isotretinoin is recorded during a pregnancy.";
      return `Isotretinoin is recorded and the pregnancy status documented is: ${status || "not recorded"}.`;
    },
    ask: "Document the pregnancy test result and date, the contraception discussed, and the counselling given before the prescription. Isotretinoin is teratogenic, and this documentation belongs in the record before treatment starts.",
  },
  {
    key: "isotretinoin_baseline",
    level: "high",
    title: "Isotretinoin without documented baseline checks",
    source: "aad",
    when: (values) => {
      if (f(values, "dm_acne", "isotretinoin") !== "Yes") return null;
      const checks = multi(values, "dm_acne", "isotretinoin_baseline");
      const expected = ["Pregnancy test", "Liver function", "Lipid profile"];
      const missing = expected.filter((c) => !checks.includes(c));
      if (!missing.length) return null;
      return `Isotretinoin is recorded; the following baseline checks are not documented: ${missing.join(", ")}.`;
    },
    ask: "Document the baseline results or the reason a check was not performed, and the monitoring plan for the course.",
  },
  {
    key: "systemic_screening_missing",
    level: "high",
    title: "Systemic or biologic therapy screening not documented",
    source: "aad",
    when: (values) => {
      const screening = multi(values, "dm_psoriasis", "screening_before_systemic");
      if (!screening.length) return null;
      if (!screening.includes("None documented")) return null;
      return "Pre-treatment screening for systemic or biologic therapy is recorded as 'None documented'.";
    },
    ask: "Document the screening performed or planned — blood counts, liver and renal function, hepatitis and HIV status, tuberculosis screening, pregnancy test and vaccination review — before the agent is started.",
  },

  // ------------------------------------------------------------ severity
  {
    key: "severe_psoriasis",
    level: "medium",
    title: "Psoriasis severity documented as high",
    source: "aad",
    when: (values) => {
      const pasi = scored(values, "pasi");
      const bsa = scored(values, "bsa");
      const pasiHigh = pasi && typeof pasi.value === "number" && pasi.value >= 10;
      const bsaHigh = bsa && typeof bsa.value === "number" && bsa.value >= 10;
      if (!pasiHigh && !bsaHigh) return null;
      const parts = [];
      if (pasiHigh) parts.push(`PASI ${pasi.value}`);
      if (bsaHigh) parts.push(`BSA ${bsa.value}%`);
      return `${parts.join(" and ")} documented with the instrument's own inputs.`;
    },
    ask: "Document the impact on daily life (DLQI where recorded), the joint screening, and whether topical, phototherapy or systemic options were discussed. A severity score describes disease; it does not choose treatment.",
  },
  {
    key: "dlqi_impact",
    level: "medium",
    title: "Quality-of-life impact documented as very large",
    source: "bad",
    when: (values) => {
      const dlqi = scored(values, "dlqi");
      if (!dlqi || typeof dlqi.value !== "number" || dlqi.value < 11) return null;
      return `DLQI ${dlqi.value} recorded from all ten answered items.`;
    },
    ask: "Document what the patient reported, the psychological support or referral offered, and how treatment intensity was weighed against the impact recorded.",
  },
  {
    key: "infected_eczema",
    level: "critical",
    title: "Eczema herpeticum or spreading infection suspected",
    source: "aad",
    when: (values) => {
      const infection = f(values, "dm_eczema", "infection");
      if (infection === "Eczema herpeticum suspected") {
        return "Eczema herpeticum is documented as suspected in the eczema module.";
      }
      if (infection === "Cellulitis / spreading erythema") {
        return "Spreading erythema or cellulitis is documented alongside eczema.";
      }
      return null;
    },
    ask: "Document the antiviral or antimicrobial started and its timing, the eye review if periocular, the observations, and the review interval. Eczema herpeticum is treated as an emergency.",
  },
  {
    key: "scarring_alopecia_biopsy",
    level: "medium",
    title: "Scarring alopecia without a documented biopsy decision",
    source: "aad",
    when: (values) => {
      if (f(values, "dm_hair_nail", "scarring") !== "Yes") return null;
      const sampled = multi(values, "dm_hair_nail", "nail_sample").length > 0;
      const trichoscopy = f(values, "dm_hair_nail", "trichoscopy");
      if (sampled && trichoscopy) return null;
      return "Scarring alopecia is documented; a biopsy of the scalp is not recorded, and trichoscopy is not documented.";
    },
    ask: "Document the trichoscopy findings and whether a scalp biopsy was taken or planned. Scarring alopecia is irreversible once the follicle is lost, so the assessment and its timing belong in the record.",
  },

  // ------------------------------------------------------------ infection control
  {
    key: "untested_infection",
    level: "medium",
    title: "Fungal or bacterial infection treated without a documented sample",
    source: "bad",
    when: (values) => {
      const category = f(values, "dm_infection", "category");
      if (!["Fungal — dermatophyte", "Fungal — yeast", "Bacterial"].includes(category)) return null;
      const samples = multi(values, "dm_infection", "samples");
      if (samples.length && !samples.includes("None taken")) return null;
      return `${category} infection is documented and no sample (swab, scrapings, clippings or culture) is recorded.`;
    },
    ask: "Document the sample taken, or the clinical basis for treating without one. Confirmation before systemic treatment is what the cited guideline addresses, and repeat courses without confirmation are where resistance is missed.",
  },
  {
    key: "hs_drainage",
    level: "medium",
    title: "Hidradenitis suppurativa with active lesions documented",
    source: "eadv",
    when: (values) => {
      if (!has(values, "dm_other", "condition", "Hidradenitis suppurativa")) return null;
      const lesions = f(values, "dm_other", "hs_lesions");
      if (lesions) return "Hidradenitis suppurativa is documented with lesion counts recorded for this visit.";
      return null;
    },
    ask: "Document whether any lesion was incised or drained, the medical therapy in place, and the pain and impact recorded. Comparing lesion counts at each visit is what makes the response measurable.",
  },
];

const asRecord = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export const buildDmSafetyPrompts = ({ values = {} } = {}) =>
  DM_SAFETY_RULES.map((rule) => {
    let basis = null;
    try {
      basis = rule.when(values);
    } catch {
      basis = null;
    }
    if (!basis) return null;
    const reference = src(rule.source);
    return {
      key: rule.key,
      level: rule.level,
      title: rule.title,
      basis,
      ask: rule.ask,
      provenance: "guideline",
      provenanceLabel: DM_SAFETY_PROVENANCE.guideline,
      source: {
        organization: reference.issuing_organization,
        title: reference.title,
        url: reference.source_url,
        status: reference.status,
      },
    };
  }).filter(Boolean);

export const dmSafetyPrompt = (values, key) =>
  buildDmSafetyPrompts({ values }).find((p) => p.key === key) || null;

export const dmSafetyState = (value) => asRecord(value);