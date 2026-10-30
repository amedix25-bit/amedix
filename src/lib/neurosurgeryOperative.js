// NEUROSURGERY — the operation record.
//
// One operative record used by both neurosurgical operation notes: the
// pre-operative diagnosis and indication, consent, the team, anaesthesia,
// positioning, approach, the steps, the anatomical findings, implants and their
// traceability, specimens, blood loss, drains, complications, closure, the
// destination and the immediate post-operative instructions — plus a block of
// procedure-specific fields that appears for the procedure actually performed.
//
// DESIGN RULES
//   - Nothing defaults to "none": an implant block left blank is not "no
//     implant", and a drain left blank is not "no drain".
//   - An emergency operation records the consent exception explicitly rather
//     than showing an empty consent field.
//   - Field labels avoid the platform's retired wording, so the record survives
//     the note section policy.

export const NOT_DOCUMENTED = "Not documented";

export const NSG_URGENCY = ["Elective", "Semi-elective", "Urgent", "Emergency"];

export const NSG_CONSENT = [
  "Confirmed — consent and site marking documented",
  "Emergency — life-saving, exception documented",
  "Best-interest decision — documented with the reason",
  "Not documented",
];

export const NSG_ANAESTHESIA = ["General", "Awake craniotomy", "Sedation", "Spinal", "Local"];

export const NSG_ASA = ["ASA I", "ASA II", "ASA III", "ASA IV", "ASA V", "Not documented"];

export const NSG_COUNTS = [
  "Correct — swabs, instruments and needles accounted for",
  "Incorrect — documented and action taken",
  "Not documented",
];

export const NSG_COMPLICATION = [
  "None documented",
  "Haemorrhage",
  "Dural tear or CSF leak",
  "Nerve or vessel injury",
  "Ischaemic event",
  "Implant or hardware problem",
  "Anaesthetic event",
  "Other — documented",
  NOT_DOCUMENTED,
];

export const NSG_DESTINATION = [
  "Neurosurgical ward",
  "ICU / high-dependency",
  "Recovery — routine observation",
  "Transferred to another facility",
  NOT_DOCUMENTED,
];

export const NSG_IMPLANT_TRACEABILITY = [
  "Documented in the implant record — manufacturer, model, lot and size",
  "Partially documented",
  "Not documented",
];

export const NSG_OBS_FREQUENCY = [
  "Every 15 minutes",
  "Hourly",
  "Every 2 hours",
  "Every 4 hours",
  "Per the unit's post-operative protocol",
  NOT_DOCUMENTED,
];

// Procedure-specific blocks. Each is shown only for the procedure performed, so
// a burr-hole note never asks for a fusion construct.
export const NSG_PROCEDURE_TYPES = [
  {
    key: "craniotomy",
    label: "Craniotomy",
    fields: [
      { key: "flap", label: "Bone flap — site, size and handling", type: "input" },
      { key: "dural_handling", label: "Dural opening and repair", type: "select", options: ["Opened and repaired primarily", "Opened — dural substitute used", "Not opened", NOT_DOCUMENTED] },
      { key: "brain_relaxation", label: "Brain relaxation measures", type: "input", placeholder: "CSF drainage, head-up, osmotherapy, hyperventilation" },
      { key: "mapping", label: "Cortical mapping or neurophysiology", type: "input" },
    ],
  },
  {
    key: "craniectomy",
    label: "Decompressive craniectomy",
    fields: [
      { key: "extent", label: "Extent of bone removal", type: "input" },
      { key: "duroplasty", label: "Duroplasty", type: "select", options: ["Performed — graft documented", "Not performed", NOT_DOCUMENTED] },
      { key: "bone_storage", label: "Bone flap storage documented", type: "select", options: ["Yes — storage documented", "Not documented", "Not applicable"] },
      { key: "herniation_at_closure", label: "Brain herniation through the defect at closure", type: "select", options: ["None", "Mild", "Marked", NOT_DOCUMENTED] },
    ],
  },
  {
    key: "burr_hole",
    label: "Burr-hole procedure",
    fields: [
      { key: "site", label: "Burr-hole site and side", type: "input" },
      { key: "drain_system", label: "Drainage system", type: "select", options: ["Subdural drain", "Subdural evacuating system", "Twist drill", "None left in place", NOT_DOCUMENTED] },
      { key: "evacuation", label: "Evacuation achieved", type: "select", options: ["Complete", "Near-complete", "Partial", NOT_DOCUMENTED] },
      { key: "drain_tunnel", label: "Drain exit site and tunnel", type: "input" },
    ],
  },
  {
    key: "ventricular_drainage",
    label: "Ventricular drainage / external ventricular drain",
    fields: [
      { key: "catheter_site", label: "Catheter entry site and side", type: "input" },
      { key: "catheter_depth", label: "Catheter depth and trajectory", type: "input" },
      { key: "opening_pressure", label: "CSF opening pressure and appearance", type: "input" },
      { key: "drain_height", label: "Drain height and volume target set", type: "input" },
      { key: "csf_sent", label: "CSF sent for laboratory examination", type: "select", options: ["Yes — microbiology and cell count", "No — reason documented", NOT_DOCUMENTED] },
    ],
  },
  {
    key: "vp_shunt",
    label: "Ventricular-peritoneal shunt",
    fields: [
      { key: "valve", label: "Valve type and manufacturer", type: "input" },
      { key: "valve_setting", label: "Valve setting at the end of the procedure", type: "input", placeholder: "e.g. programmable, setting 1.5 — documented" },
      { key: "proximal", label: "Proximal catheter site", type: "input" },
      { key: "distal", label: "Distal catheter site and peritoneal placement", type: "input" },
      { key: "patency", label: "Flow and patency confirmed", type: "select", options: ["CSF flow confirmed at both ends", "Flow confirmed proximally only", "Not documented"] },
    ],
  },
  {
    key: "tumour_resection",
    label: "Tumour resection",
    fields: [
      { key: "resection_extent", label: "Extent of resection", type: "select", options: ["Gross total", "Subtotal", "Partial", "Biopsy only", NOT_DOCUMENTED] },
      { key: "residual", label: "Residual tumour and where it was left", type: "input" },
      { key: "frozen", label: "Frozen section or immediate histology", type: "input" },
      { key: "cavity", label: "Cavity management", type: "input", placeholder: "haemostasis, sealant, post-operative cavity scan plan" },
    ],
  },
  {
    key: "spinal_decompression",
    label: "Spinal decompression",
    fields: [
      { key: "levels", label: "Levels decompressed", type: "input" },
      { key: "bone_removal", label: "Laminectomy, laminotomy or foraminotomy performed", type: "input" },
      { key: "facet", label: "Facet preservation or resection", type: "input" },
      { key: "flavum", label: "Ligamentum flavum and canal decompression achieved", type: "input" },
      { key: "dural_tear", label: "Dural tear", type: "select", options: ["None", "Repaired primarily", "Repaired with patch", "Persisting leak", NOT_DOCUMENTED] },
    ],
  },
  {
    key: "discectomy",
    label: "Discectomy",
    fields: [
      { key: "level", label: "Disc level and side", type: "input" },
      { key: "fragment", label: "Disc fragment and sequestered component", type: "input" },
      { key: "annulus", label: "Annulus handling", type: "input" },
      { key: "root", label: "Nerve root decompressed and its condition", type: "input" },
      { key: "endplate", label: "Endplate preparation", type: "input" },
    ],
  },
  {
    key: "fixation_fusion",
    label: "Spinal fixation and fusion",
    fields: [
      { key: "construct", label: "Construct", type: "input", placeholder: "levels, screws, rods, interbody cages" },
      { key: "screws", label: "Screw levels and sizes", type: "input" },
      { key: "graft", label: "Graft or interbody material", type: "input" },
      { key: "accuracy", label: "Screw position check", type: "select", options: ["Confirmed — intra-operative check", "Converted to open", "Not documented"] },
      { key: "correction", label: "Deformity correction achieved", type: "input" },
      { key: "monitoring_changes", label: "Neurophysiological monitoring changes during the procedure", type: "input" },
    ],
  },
  {
    key: "other",
    label: "Other neurosurgical procedure",
    fields: [{ key: "procedure_named", label: "Procedure performed, in full", type: "textarea" }],
  },
];

// Accepts the stored value, which is the procedure label shown in the select.
export const procedureFor = (keyOrLabel) =>
  NSG_PROCEDURE_TYPES.find((p) => p.key === keyOrLabel || p.label === keyOrLabel) || null;

const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const I = (key, label, extra) => ({ key, label, type: "input", ...extra });
const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const TIME = (key, label, extra) => ({ key, label, type: "time", ...extra });
const NUM = (key, label, extra) => ({ key, label, type: "number", ...extra });

export const operativeSections = (procedureType) => [
  {
    title: "Pre-Operative Record",
    fields: [
      I("preop_diagnosis", "Pre-operative diagnosis", { critical: true }),
      T("indication", "Indication for surgery — what the operation is intended to achieve", { rows: 2 }),
      S("consent", "Consent and site marking", NSG_CONSENT, {
        critical: true,
        hint: "An emergency operation records the exception and who made the decision. The field is never left blank and never blocks treatment.",
      }),
      I("consent_by", "Consent taken by, and from whom"),
      S("urgency", "Urgency", NSG_URGENCY),
      I("preop_deficit", "Pre-operative neurological status, including the deficit being treated"),
    ],
  },
  {
    title: "Team & Anaesthesia",
    fields: [
      I("surgeon", "Primary surgeon"),
      I("assistant", "Assistant surgeon"),
      I("scrub", "Scrub practitioner"),
      I("anaesthetist", "Anaesthetist"),
      S("anaesthesia", "Anaesthesia", NSG_ANAESTHESIA),
      S("asa", "ASA physical status", NSG_ASA),
      I("airway_technique", "Airway technique and lines", { placeholder: "e.g. reinforced ETT, arterial line, central access" }),
      S("antibiotic_prophylaxis", "Antibiotic prophylaxis", [
        "Given — agent and time documented",
        "Not given — reason documented",
        NOT_DOCUMENTED,
      ]),
      S("monitoring", "Intra-operative neurophysiological monitoring", [
        "Not used",
        "Motor evoked potentials",
        "Somatosensory evoked potentials",
        "Cortical mapping — language",
        "Combined monitoring",
        NOT_DOCUMENTED,
      ]),
    ],
  },
  {
    title: "Procedure, Approach & Positioning",
    fields: [
      I("procedure", "Procedure performed — the operation in full", { critical: true }),
      S(
        "procedure_type",
        "Procedure type",
        NSG_PROCEDURE_TYPES.map((p) => p.label),
        { critical: true }
      ),
      I("side", "Side"),
      I("levels", "Levels or region operated"),
      I("approach", "Surgical approach"),
      I("positioning", "Positioning, head fixation and table configuration"),
      S("navigation", "Neuronavigation or intra-operative imaging", [
        "Used",
        "Not used",
        "Not available",
        NOT_DOCUMENTED,
      ]),
      TIME("start_time", "Time started"),
      TIME("end_time", "Time finished"),
      T("steps", "Operative steps, in sequence", { rows: 4, critical: true }),
    ],
  },
  {
    title: "Findings, Anatomy & Specimens",
    fields: [
      T("findings", "Operative findings — pathology, anatomy, vessels, nerves, unexpected findings", { rows: 3 }),
      T("structures", "Anatomical structures identified and preserved", { rows: 2 }),
      I("specimens", "Specimens sent and where to", { placeholder: "histology, microbiology, frozen section, CSF" }),
    ],
  },
  {
    title: "Implants, Blood Loss & Drains",
    fields: [
      S("implants", "Implants or devices left in the patient", ["None", "Yes — documented", NOT_DOCUMENTED]),
      I("implant_detail", "Implant detail — manufacturer, model, size, lot or UDI"),
      S("implant_traceability", "Implant traceability", NSG_IMPLANT_TRACEABILITY),
      NUM("blood_loss", "Estimated blood loss (mL)", { min: 0 }),
      I("blood_products", "Blood products given"),
      S("drain", "Drain or catheter left in place", [
        "None",
        "Subdural drain",
        "Wound drain",
        "External ventricular drain",
        "Lumbar drain",
        NOT_DOCUMENTED,
      ]),
      I("drain_detail", "Drain detail — site, type, setting and planned removal"),
      I("drain_output", "Drain output at the end of the procedure"),
      S("counts", "Swab, instrument and needle count", NSG_COUNTS),
    ],
  },
  {
    title: "Complications & Closure",
    fields: [
      S("complication", "Complication during the procedure", NSG_COMPLICATION),
      T("complication_detail", "Complication detail and what was done about it", { rows: 2 }),
      I("haemostasis", "Haemostasis at closure"),
      I("closure", "Closure — layers, dura, bone flap, skin"),
      S("vte", "VTE prophylaxis decision for after theatre", [
        "Mechanical only — pharmacological timing documented",
        "Pharmacological started — timing documented",
        "Deferred — timing documented",
        NOT_DOCUMENTED,
      ]),
    ],
  },
  {
    title: "Recovery & Immediate Post-Operative Record",
    fields: [
      S("postop_neuro", "Neurological status at the end of the procedure", [
        "Unchanged",
        "Improved",
        "New deficit — documented",
        "Unable to assess",
        NOT_DOCUMENTED,
      ]),
      S("destination", "Post-operative destination", NSG_DESTINATION, { critical: true }),
      S("obs_frequency", "Neurological observation frequency ordered", NSG_OBS_FREQUENCY),
      S("postop_ct", "Post-operative CT", [
        "Not indicated — reason documented",
        "Planned within 6 hours",
        "Planned within 24 hours",
        "Performed — reviewed",
        NOT_DOCUMENTED,
      ]),
      T("immediate_management", "Immediate post-operative instructions — position, fluids, analgesia, anti-epileptic decision, drain management", { rows: 3 }),
      I("family_informed", "Who was informed of the outcome, and when"),
      I("responsible_clinician", "Clinician responsible for the post-operative care", { critical: true }),
      I("handover", "Handed over to — name, grade and time"),
    ],
  },
];

const arr = (v) => (Array.isArray(v) ? v : []);
const text = (v) => String(v ?? "").trim();

export const operativeFlags = (value = {}) => {
  const v = value || {};
  const specific = v.specific && typeof v.specific === "object" ? v.specific : {};
  return {
    documented: Boolean(text(v.procedure) || text(v.procedure_type)),
    implant_untraceable:
      /^Yes/i.test(text(v.implants)) &&
      (/Not documented/i.test(text(v.implant_traceability)) || !text(v.implant_traceability)),
    consent_missing: !text(v.consent) || /Not documented/i.test(text(v.consent)),
    counts_not_confirmed: /Not documented|Incorrect/i.test(text(v.counts)),
    drain_without_detail: /drain|catheter/i.test(text(v.drain)) && !text(v.drain_detail),
    no_postop_neuro: !text(v.postop_neuro) || /Not documented/i.test(text(v.postop_neuro)),
    specific_documented: Object.values(specific).some((x) => text(x)),
  };
};

export const formatOperativeRecord = (value) => {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const lines = [];

  operativeSections(v.procedure_type).forEach((section) => {
    const body = section.fields
      .map((f) => {
        const val = Array.isArray(v[f.key]) ? arr(v[f.key]).join("; ") : text(v[f.key]);
        return val ? `${f.label}: ${val}` : null;
      })
      .filter(Boolean);
    if (body.length) lines.push(`${section.title}\n${body.map((b) => `- ${b}`).join("\n")}`);
  });

  const procedure = procedureFor(v.procedure_type);
  const specific = v.specific && typeof v.specific === "object" ? v.specific : {};
  if (procedure) {
    const body = procedure.fields
      .map((f) => (text(specific[f.key]) ? `${f.label}: ${text(specific[f.key])}` : null))
      .filter(Boolean);
    if (body.length) {
      lines.push(`${procedure.label} — procedure-specific record\n${body.map((b) => `- ${b}`).join("\n")}`);
    } else {
      lines.push(
        `${procedure.label} — procedure-specific record\n- Not documented: no ${procedure.label.toLowerCase()} detail was recorded.`
      );
    }
  }

  if (!lines.length) return "Operation record not documented in this note.";
  return lines.join("\n\n");
};