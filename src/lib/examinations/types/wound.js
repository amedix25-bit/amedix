import { sel, chk, multi, num, section, area } from "../shared";

export default {
  key: "wound",
  label: "Wound / Ulcer Assessment",
  description: "Surgical wound, ulcer and stoma site assessment",
  sections: [
    section("inspection", "Inspection", [
      sel("wound_type", "Type", ["Surgical incision", "Laceration", "Ulcer", "Burn", "Abscess cavity", "Stoma site", "Other"], { detailOn: ["Other"] }),
      sel("site", "Site", ["Not documented", "Abdominal wall", "Groin", "Perineum", "Limb", "Neck", "Chest", "Back", "Other"], { detailOn: ["Other"] }),
      num("length", "Length", { unit: "cm", step: 0.1, min: 0, max: 100 }),
      num("width", "Width", { unit: "cm", step: 0.1, min: 0, max: 100 }),
      num("depth", "Depth", { unit: "cm", step: 0.1, min: 0, max: 30 }),
      sel("healing", "Healing", ["Healing by primary intention", "Healing by secondary intention", "Delayed healing", "Dehisced", "Not applicable"]),
    ]),
    section("bed", "Wound Bed & Edges", [
      multi("bed", "Wound bed", ["Clean granulating", "Sloughy", "Necrotic", "Fibrinous", "Hypergranulating", "Epithelialising"]),
      sel("edges", "Edges", ["Well approximated", "Separated", "Undermined", "Rolled", "Callous", "Maceration"]),
      sel("exudate", "Exudate", ["None", "Serous", "Haemoserous", "Purulent", "Faecal"]),
      sel("exudate_amount", "Exudate amount", ["None", "Minimal", "Moderate", "Heavy"]),
      chk("odour", "Offensive odour", { detailOn: true }),
      chk("bleeding", "Bleeding", { detailOn: true }),
    ], {
      abnormalFields: [
        area("infection_signs", "Signs of infection — erythema, warmth, induration, discharge"),
        chk("probe_to_fascia", "Probe reaches fascia / deep tissue"),
      ],
      notesLabel: "Wound bed findings",
    }),
    section("surrounding_skin", "Surrounding Skin & Investigations", [
      multi("skin", "Surrounding skin", ["Intact", "Erythema", "Induration", "Cellulitis", "Maceration", "Excoration", "Sinus / fistula"]),
      sel("dressing", "Current dressing", ["None", "Simple adhesive", "Absorbent", "Negative pressure (VAC)", "Other"], { detailOn: ["Other"] }),
      chk("swab_sent", "Wound swab sent for culture", { detailOn: true }),
    ]),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [area("findings", "Describe findings")],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};