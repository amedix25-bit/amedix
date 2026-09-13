import { sel, chk, multi, lat, num, section } from "../shared";

export default {
  key: "dermatological",
  label: "Dermatological Examination",
  description: "Skin lesions, distribution, hair, nails and mucosa",
  sections: [
    section("morphology", "Lesion Morphology", [
      multi("primary_lesions", "Primary lesions", ["None", "Macule", "Papule", "Plaque", "Vesicle", "Bulla", "Pustule", "Nodule", "Wheal", "Cyst", "Telangiectasia"]),
      multi("secondary_changes", "Secondary changes", ["None", "Scale", "Crust", "Excoriation", "Fissure", "Erosion", "Ulcer", "Atrophy", "Lichenification", "Scar"]),
      lat("laterality", "Laterality"),
    ]),
    section("distribution", "Distribution and Pattern", [
      sel("distribution", "Distribution", ["Localized", "Generalized", "Dermatomal", "Acral", "Flexural", "Extensor", "Sun-exposed", "Symmetrical"], { detailOn: ["Localized", "Dermatomal"], detailLaterality: true }),
      sel("arrangement", "Arrangement / pattern", ["Discrete", "Grouped", "Confluent", "Linear", "Annular", "Targetoid", "Retiform"]),
      num("lesion_count", "Approximate number of lesions", { min: 0, max: 100000 }),
    ]),
    section("lesion_details", "Individual Lesion Details", [
      num("lesion_size", "Size of main lesion", { unit: "cm", step: 0.1, min: 0, max: 50 }),
      sel("lesion_color", "Colour", ["Erythematous", "Hyperpigmented", "Hypopigmented", "Violaceous", "Skin-colored", "Yellowish"], { detailOn: ["Violaceous", "Yellowish"] }),
      sel("consistency", "Consistency", ["Soft", "Firm", "Hard", "Fluctuant"]),
      sel("surface", "Surface", ["Smooth", "Rough / scaly", "Verrucous", "Ulcerated", "Crusted"]),
      sel("border", "Border", ["Well-defined", "Ill-defined", "Raised", "Punched-out"]),
      chk("photos_taken", "Clinical photographs taken"),
    ], {
      abnormalFields: [
        chk("regional_lymph_nodes", "Regional lymph nodes enlarged", { detailOn: true }),
      ],
      notesLabel: "Lesion description",
    }),
    section("hair_nails_mucosa", "Hair, Nails and Mucosa", [
      sel("hair", "Hair", ["Normal", "Alopecia — localized", "Alopecia — diffuse", "Hirsutism"], { detailOn: ["Alopecia — localized", "Alopecia — diffuse", "Hirsutism"], detailLaterality: true }),
      sel("nails", "Nails", ["Normal", "Pitting", "Onycholysis", "Dystrophic", "Thickened", "Clubbing"], { detailOn: ["Pitting", "Onycholysis", "Dystrophic", "Thickened"] }),
      sel("oral_mucosa", "Oral mucosa", ["Normal", "Ulcerated", "White patch", "Pigmented"], { detailOn: ["Ulcerated", "White patch", "Pigmented"] }),
      sel("genital_mucosa", "Genital mucosa (when relevant)", ["Not examined", "Normal", "Lesion seen"], { detailOn: ["Lesion seen"] }),
    ]),
    section("symptoms", "Associated Symptoms", [
      sel("itch", "Itch", ["Absent", "Mild", "Moderate", "Severe"]),
      chk("pain", "Pain / tenderness", { detailOn: true }),
      chk("systemic_symptoms", "Systemic symptoms", { detailOn: true }),
      sel("duration", "Duration", ["Days", "Weeks", "Months", "Years"]),
    ], { mode: "free" }),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};