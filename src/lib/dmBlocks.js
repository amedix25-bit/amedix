// Dermatology — structured clinical blocks.
//
// One registry for the whole specialty, so the note form, the saved record and the
// printed note read the same definitions. Every item is optional and nothing is
// pre-selected: a blank is "not documented", never a normal finding. Conditional
// items appear only where the recorded context makes them relevant.
//
// Nothing here diagnoses or treats. A block records what the clinician documented.

import { asObject, str } from "@/lib/fmFieldKit";

const YN = ["Yes", "No", "Not documented"];
const YNNA = ["Yes", "No", "Not applicable", "Not documented"];

const PRIMARY_LESIONS = [
  "Macule", "Patch", "Papule", "Plaque", "Nodule", "Tumour", "Vesicle", "Bulla",
  "Pustule", "Wheal", "Cyst", "Comedo", "Burrow", "Telangiectasia",
];

const SECONDARY_LESIONS = [
  "Scale", "Crust", "Erosion", "Ulcer", "Excoriation", "Fissure", "Atrophy",
  "Lichenification", "Scar", "Keloid", "Eschar", "Hyperpigmentation", "Hypopigmentation",
];

const SITES = [
  "Scalp", "Face", "Eyelids", "Ears", "Neck", "Trunk", "Chest", "Back", "Abdomen", "Buttocks",
  "Upper limbs", "Forearms", "Hands", "Palms", "Lower limbs", "Legs", "Feet", "Soles",
  "Nails", "Oral mucosa", "Genital skin", "Intertriginous areas", "Anogenital",
];

export const DM_BLOCKS = {
  // ------------------------------------------------------------ history
  dm_history: {
    key: "dm_history",
    title: "Dermatological history",
    note: "The history a dermatological assessment is built on. A blank is 'not documented', never a negative finding.",
    fields: [
      { key: "presenting_complaint", label: "Presenting complaint", type: "input", placeholder: "In the patient's own words" },
      { key: "onset", label: "Onset", type: "input", placeholder: "Date or age; sudden or gradual" },
      { key: "duration", label: "Duration", type: "input", placeholder: "e.g. 3 weeks, since childhood, recurrent each winter" },
      {
        key: "progression",
        label: "Progression since onset",
        type: "select",
        options: ["Improving", "Stable", "Slowly worsening", "Rapidly worsening", "Intermittent / relapsing", "Not documented"],
      },
      { key: "sites", label: "Anatomical sites affected, as reported", type: "multi", options: SITES },
      {
        key: "distribution",
        label: "Distribution",
        type: "select",
        options: [
          "Localised", "Generalised", "Symmetrical", "Asymmetrical", "Flexural", "Extensor",
          "Sun-exposed", "Photo-distributed", "Dermatomal", "Acral", "Not documented",
        ],
      },
      { key: "symptoms", label: "Symptoms reported", type: "multi", options: ["Itch", "Pain", "Burning", "Bleeding", "Discharge", "Scaling", "Numbness", "Asymptomatic"] },
      { key: "itch_severity", label: "Itch severity as reported", type: "select", options: ["None", "Mild", "Moderate", "Severe — disturbs sleep", "Not documented"] },
      { key: "previous_episodes", label: "Previous episodes / recurrences", type: "text", placeholder: "How often, when, and what settled it" },
      { key: "aggravating", label: "Aggravating factors", type: "text", placeholder: "Heat, sweat, sunlight, water, friction, stress, specific products" },
      { key: "relieving", label: "Relieving factors", type: "text", placeholder: "Emollients, cool compresses, avoidance, medication" },
      { key: "seasonal", label: "Seasonal variation", type: "select", options: ["Worse in summer", "Worse in winter", "No seasonal pattern", "Not documented"] },
      { key: "previous_treatments", label: "Previous treatments and response", type: "text", placeholder: "Product, potency, duration and what happened — including over-the-counter and traditional remedies" },
      { key: "atopy", label: "Atopic history — asthma, allergic rhinitis, eczema", type: "select", options: YN },
      { key: "allergies", label: "Drug and contact allergies with reaction type", type: "text", placeholder: "Agent, reaction, when — or state that none are known" },
      { key: "derm_history", label: "Previous dermatological diagnoses", type: "text" },
      { key: "skin_cancer_history", label: "Previous skin cancer or premalignant lesion", type: "select", options: YN },
      { key: "skin_cancer_detail", label: "Details of previous skin cancer / lesions", type: "text", placeholder: "Type, site, year, treatment", showIf: { key: "skin_cancer_history", equals: "Yes" } },
      { key: "biopsies", label: "Previous biopsies, excisions or skin surgery", type: "text", placeholder: "Site, year, result if known" },
      { key: "autoimmune_history", label: "Known autoimmune or connective tissue disease", type: "text" },
      { key: "immunosuppression", label: "Immunosuppression", type: "select", options: ["None known", "HIV", "Transplant", "Systemic immunosuppressant", "Biologic", "Chemotherapy", "Haematological malignancy", "Not documented"] },
      { key: "family_history", label: "Family history of skin disease", type: "text", placeholder: "Condition, relative — including melanoma and psoriasis" },
      { key: "medications", label: "Current medications", type: "text", placeholder: "Include new drugs started in the weeks before the eruption" },
      { key: "occupation", label: "Occupation and occupational exposures", type: "input", placeholder: "Wet work, solvents, metals, dyes, latex, food" },
      { key: "sun_exposure", label: "Sun exposure, sunburn history and tanning bed use", type: "text", placeholder: "Cumulative exposure, sunburns, outdoor work, sunbeds" },
      { key: "skincare", label: "Skincare products, cosmetics and hair dye", type: "text", placeholder: "Products used, and on which area" },
      { key: "travel", label: "Travel and exposures", type: "input", placeholder: "Tropical travel, fresh water, animals, insects" },
    ],
  },

  // ------------------------------------------------------------ examination
  dm_exam: {
    key: "dm_exam",
    title: "Dermatological findings",
    note: "Record the lesion morphology and its distribution. Only the features actually examined should be completed; an unanswered item is not a negative finding.",
    fields: [
      { key: "general_skin", label: "General skin examination", type: "select", options: ["Generalised eruption", "Localised lesions only", "Localised plus incidental findings", "No abnormality found", "Not documented"] },
      { key: "primary_lesions", label: "Primary lesions present", type: "multi", options: PRIMARY_LESIONS },
      { key: "secondary_lesions", label: "Secondary lesions present", type: "multi", options: SECONDARY_LESIONS },
      { key: "sites_examined", label: "Sites examined", type: "multi", options: SITES },
      { key: "sites_spared", label: "Sites specifically spared / uninvolved", type: "multi", options: SITES },
      { key: "laterality", label: "Laterality", type: "select", options: ["Right", "Left", "Bilateral", "Midline", "Not documented"] },
      { key: "number", label: "Number of lesions", type: "select", options: ["Single", "2–5", "6–20", "More than 20", "Innumerable / confluent", "Not documented"] },
      { key: "size", label: "Size of the index lesion(s)", type: "input", placeholder: "e.g. 8 × 6 mm; if several, give the range" },
      { key: "colour", label: "Colour", type: "multi", options: ["Erythematous", "Violaceous", "Brown", "Black", "Blue", "Grey", "Yellow", "White", "Flesh-coloured", "Haemorrhagic"] },
      { key: "shape", label: "Shape", type: "select", options: ["Round", "Oval", "Irregular", "Annular", "Serpiginous", "Linear", "Polygonal", "Reticular", "Not documented"] },
      { key: "border", label: "Border", type: "select", options: ["Well demarcated", "Ill defined", "Regular", "Irregular", "Raised", "Undermined", "Not documented"] },
      { key: "surface", label: "Surface", type: "multi", options: ["Smooth", "Rough", "Scaly", "Crusted", "Verrucous", "Ulcerated", "Exudative", "Moist", "Keratinised"] },
      { key: "consistency", label: "Consistency / feel on palpation", type: "select", options: ["Soft", "Firm", "Hard", "Fluctuant", "Fixed to underlying tissue", "Not palpated"] },
      { key: "arrangement", label: "Arrangement", type: "select", options: ["Grouped", "Discrete / scattered", "Linear", "Annular", "Herpetiform", "Koebnerised", "Not documented"] },
      { key: "symmetry", label: "Symmetry", type: "select", options: ["Symmetrical", "Asymmetrical", "Not documented"] },
      { key: "blanching", label: "Blanches on pressure", type: "select", options: YN },
      { key: "tenderness", label: "Tenderness on palpation", type: "select", options: ["Non-tender", "Tender", "Markedly tender", "Not assessed"] },
      { key: "mucosal", label: "Mucosal involvement", type: "select", options: ["None seen", "Oral mucosa", "Genital mucosa", "Ocular / conjunctival", "Multiple mucosal sites", "Not examined"] },
      { key: "hair_scalp", label: "Hair and scalp examination", type: "text", placeholder: "Density, hair pull test, scarring, scale, follicular openings" },
      { key: "nail_exam", label: "Nail examination", type: "text", placeholder: "Pitting, ridging, onycholysis, discolouration, nail fold changes" },
      { key: "lymph_nodes", label: "Regional lymph nodes", type: "select", options: ["Not examined", "No palpable nodes", "Palpable — mobile", "Palpable — fixed / matted"] },
      { key: "lymph_node_detail", label: "Lymph node detail", type: "text", placeholder: "Which nodal basin, size, consistency", showIf: { key: "lymph_nodes", in: ["Palpable — mobile", "Palpable — fixed / matted"] } },
      { key: "systemic_signs", label: "Systemic signs", type: "multi", options: ["Fever", "Malaise", "Weight loss", "Lymphadenopathy", "Joint pain", "Oral ulceration", "None observed", "Not assessed"] },
      { key: "dermoscopy", label: "Dermoscopy performed", type: "select", options: YN },
      { key: "dermoscopy_findings", label: "Dermoscopic findings", type: "text", placeholder: "Pattern, pigment network, vessels, structures — in the terms the dermatoscope shows", showIf: { key: "dermoscopy", equals: "Yes" } },
    ],
  },

  // ------------------------------------------------------------ acne
  dm_acne: {
    key: "dm_acne",
    title: "Acne module",
    note: "Record the acne pattern, severity and scarring, plus what has already been tried — an unrecorded treatment history is not an absence of previous treatment.",
    fields: [
      { key: "pattern", label: "Acne pattern", type: "multi", options: ["Comedonal", "Inflammatory (papulopustular)", "Nodulocystic", "Conglobate", "Fulminans", "Hormonal pattern", "Acne mechanica", "Cosmetic acne"] },
      { key: "sites", label: "Sites", type: "multi", options: ["Face", "Jawline", "Chest", "Back", "Shoulders", "Buttocks"] },
      { key: "lesion_counts", label: "Documented lesion counts", type: "input", placeholder: "e.g. 12 papules, 4 pustules, 3 nodules on the face" },
      { key: "scarring", label: "Scarring", type: "select", options: ["None", "Atrophic — icepick", "Atrophic — boxcar", "Atrophic — rolling", "Hypertrophic", "Keloid", "Mixed", "Not documented"] },
      { key: "pigmentation", label: "Post-inflammatory hyperpigmentation", type: "select", options: ["Absent", "Present", "Marked", "Not documented"] },
      { key: "psychological_impact", label: "Psychological impact as reported", type: "select", options: ["None reported", "Mild", "Moderate", "Severe — affecting daily life", "Not documented"] },
      { key: "prior_topicals", label: "Previous topical treatments and duration", type: "text", placeholder: "Agent, strength, how long, response and tolerance" },
      { key: "prior_systemics", label: "Previous systemic treatments", type: "text", placeholder: "Antibiotic, duration, response; isotretinoin course and cumulative dose if given" },
      { key: "hormonal_review", label: "Hormonal features in female patients", type: "multi", options: ["Irregular menses", "Hirsutism", "Androgenic alopecia", "Sudden onset", "None documented"] },
      { key: "pregnancy_status", label: "Pregnancy status (before any teratogenic therapy)", type: "select", options: ["Not applicable", "Not pregnant — tested", "Not pregnant — patient report only", "Pregnant", "Breastfeeding", "Not documented"] },
      { key: "contraception", label: "Contraception discussed / documented", type: "select", options: YNNA },
      { key: "isotretinoin", label: "Isotretinoin being prescribed in this encounter", type: "select", options: YN },
      { key: "isotretinoin_dose", label: "Dose documented by the prescriber", type: "input", placeholder: "Record the prescriber's dose — AMedix never calculates it", showIf: { key: "isotretinoin", equals: "Yes" } },
      { key: "isotretinoin_baseline", label: "Baseline checks documented", type: "multi", options: ["Pregnancy test", "Liver function", "Lipid profile", "Full blood count", "Mood screening", "None documented"], showIf: { key: "isotretinoin", equals: "Yes" } },
      { key: "isotretinoin_counselling", label: "Counselling documented", type: "multi", options: ["Teratogenicity and pregnancy prevention", "Dry skin and lips", "Photosensitivity", "Avoid blood donation", "Mood change warning signs", "No waxing / dermabrasion during treatment", "None documented"], showIf: { key: "isotretinoin", equals: "Yes" } },
    ],
  },

  // ------------------------------------------------------------ eczema
  dm_eczema: {
    key: "dm_eczema",
    title: "Eczema and dermatitis module",
    note: "Record the subtype, the affected sites and what has been applied. Potency of a topical corticosteroid is recorded with the site it was used on, because the same potency is not appropriate everywhere.",
    fields: [
      { key: "subtype", label: "Subtype / pattern", type: "multi", options: ["Atopic dermatitis", "Allergic contact dermatitis", "Irritant contact dermatitis", "Seborrhoeic dermatitis", "Nummular (discoid)", "Dyshidrotic (pompholyx)", "Stasis dermatitis", "Asteatotic eczema", "Lichen simplex chronicus", "Lichenified atopic eczema", "Protein contact", "Photoaggravated"] },
      { key: "sites", label: "Sites affected", type: "multi", options: SITES },
      { key: "morphology", label: "Documented morphology", type: "multi", options: ["Erythema", "Papules", "Vesicles", "Oozing / crusting", "Lichenification", "Excoriations", "Fissures", "Xerosis", "Pityriasis alba"] },
      { key: "affected_percent", label: "Affected body surface area documented", type: "number", unit: "%", min: 0, max: 100 },
      { key: "itch_sleep", label: "Itch and sleep impact", type: "text", placeholder: "Itch score, night waking, effect on school or work" },
      { key: "triggers", label: "Triggers identified", type: "multi", options: ["Soaps / detergents", "Wool or synthetic fabrics", "Heat and sweat", "Water / wet work", "Food (documented reaction)", "Aeroallergens", "Stress", "Occupation", "Nickel / metals", "Fragrance / preservatives", "None identified"] },
      { key: "emollient", label: "Emollient regimen documented", type: "text", placeholder: "Product, amount, frequency, and whether it is used on all skin or only affected sites" },
      { key: "tcs_potency", label: "Topical corticosteroid potency documented", type: "multi", options: ["Mild (hydrocortisone)", "Moderate", "Potent", "Very potent", "Not prescribed in this encounter"] },
      { key: "tcs_site", label: "Site(s) the steroid was applied to", type: "input", placeholder: "e.g. trunk and limbs only — face and flexures treated with…" },
      { key: "tci", label: "Topical calcineurin inhibitor considered or prescribed", type: "select", options: ["Not indicated", "Considered — see plan", "Prescribed — tacrolimus", "Prescribed — pimecrolimus", "Not documented"] },
      { key: "antihistamine", label: "Antihistamine use", type: "select", options: ["None", "Sedating at night", "Non-sedating", "Not documented"] },
      { key: "infection", label: "Signs of secondary infection", type: "select", options: ["None seen", "Impetiginised — crusting", "Pustules", "Cellulitis / spreading erythema", "Eczema herpeticum suspected", "Not documented"] },
      { key: "patch_test", label: "Patch testing", type: "select", options: ["Not indicated", "Performed — see investigations", "Recommended", "Previously performed", "Not documented"] },
      { key: "flare_plan", label: "Written flare plan given", type: "select", options: YNNA },
      { key: "education", label: "Education documented", type: "multi", options: ["Emollient technique and quantity", "Steroid safety and fingertip unit", "Avoidance of triggers", "Wet wraps", "Bathing and soap substitutes", "No education documented"] },
    ],
  },

  // ------------------------------------------------------------ psoriasis
  dm_psoriasis: {
    key: "dm_psoriasis",
    title: "Psoriasis module",
    note: "Record the clinical type, the sites, the severity measures documented and the joint screening. PASI, BSA and DLQI are recorded through the instruments field, not re-typed here.",
    fields: [
      { key: "type", label: "Clinical type", type: "multi", options: ["Chronic plaque", "Guttate", "Inverse (flexural)", "Pustular — palmoplantar", "Pustular — generalised", "Erythrodermic", "Scalp", "Nail", "Genital"] },
      { key: "sites", label: "Sites affected", type: "multi", options: SITES },
      { key: "psoriatic_arthritis_screen", label: "Psoriatic arthritis screening documented", type: "select", options: ["Not screened", "Screened — no features", "Screened — features present", "Already under rheumatology"] },
      { key: "joint_detail", label: "Joint features documented", type: "text", placeholder: "Dactylitis, enthesitis, morning stiffness, affected joints", showIf: { key: "psoriatic_arthritis_screen", equals: "Screened — features present" } },
      { key: "nail", label: "Nail findings", type: "multi", options: ["Pitting", "Onycholysis", "Oil drop discolouration", "Subungual hyperkeratosis", "Splinter haemorrhages", "No nail involvement"] },
      { key: "scalp_detail", label: "Scalp findings", type: "input", placeholder: "Extent, scale, extension beyond hairline" },
      { key: "prior_topical", label: "Previous topical therapy and response", type: "text" },
      { key: "prior_phototherapy", label: "Previous phototherapy", type: "text", placeholder: "Type, course, cumulative dose, response" },
      { key: "prior_systemic", label: "Previous systemic or biologic therapy", type: "text", placeholder: "Agent, dates, response, reason stopped" },
      { key: "triggers", label: "Trigger factors documented", type: "multi", options: ["Streptococcal infection", "Medication withdrawal (systemic steroid)", "Stress", "Alcohol", "Smoking", "Trauma / Koebner", "HIV", "None documented"] },
      { key: "metabolic", label: "Metabolic and cardiovascular risk reviewed", type: "select", options: ["Reviewed — documented", "Not reviewed", "Referred to primary care"] },
      { key: "screening_before_systemic", label: "Pre-treatment screening documented (before systemic or biologic therapy)", type: "multi", options: ["Full blood count", "Liver function", "Renal function", "Hepatitis B and C", "HIV", "Tuberculosis screening", "Pregnancy test", "Vaccination review", "None documented"] },
    ],
  },

  // ------------------------------------------------------------ infection
  dm_infection: {
    key: "dm_infection",
    title: "Cutaneous infection module",
    note: "Record the suspected organism group, the samples taken and what the laboratory reported. A diagnosis of infection is confirmed by the documented evidence, not by the appearance alone.",
    fields: [
      { key: "category", label: "Category", type: "select", options: ["Bacterial", "Fungal — dermatophyte", "Fungal — yeast", "Viral", "Parasitic / infestation", "Mycobacterial", "Mixed", "Not determined"] },
      { key: "presentation", label: "Documented presentation", type: "multi", options: ["Impetiginised crusts", "Abscess / boil", "Cellulitis", "Folliculitis", "Annular scaly plaque", "Intertriginous erythema", "Vesicles", "Pustules", "Burrows", "Nail dystrophy", "Ulceration", "Wood's lamp fluorescence"] },
      { key: "sites", label: "Sites", type: "multi", options: SITES },
      { key: "samples", label: "Samples taken", type: "multi", options: ["Skin swab — bacterial", "Skin scrapings — KOH", "Skin scrapings — fungal culture", "Nail clippings", "Hair pluck", "Vesicle fluid / PCR", "Biopsy for histology and culture", "None taken"] },
      { key: "koh", label: "KOH microscopy", type: "select", options: ["Not performed", "Positive — hyphae seen", "Positive — spores / yeast", "Negative", "Result pending"] },
      { key: "woods_lamp", label: "Wood's lamp", type: "select", options: ["Not performed", "Positive fluorescence documented", "Negative", "Not available"] },
      { key: "culture", label: "Culture / PCR result as reported", type: "text", placeholder: "Organism and sensitivities exactly as the laboratory reported them" },
      { key: "systemic_features", label: "Systemic features", type: "multi", options: ["Fever", "Malaise", "Pain out of proportion", "Rapid spread", "Bullae", "Skin necrosis", "Crepitus", "None documented"] },
      { key: "risk_factors", label: "Risk factors documented", type: "multi", options: ["Diabetes", "Immunosuppression", "Peripheral vascular disease", "Lymphoedema", "Obesity", "Recent antibiotics", "Animal contact", "Travel", "Barefoot / occlusive footwear", "None documented"] },
      { key: "treatment_documented", label: "Treatment documented in plan", type: "text", placeholder: "Topical or systemic agent, duration, and the review point" },
      { key: "contact_tracing", label: "Contact tracing / household treatment advised", type: "select", options: YNNA },
    ],
  },

  // ------------------------------------------------------------ skin cancer
  dm_lesion_cancer: {
    key: "dm_lesion_cancer",
    title: "Skin cancer and lesion module",
    note: "Record the lesion features, the dermoscopic pattern in the terms the dermatoscope shows and the histopathology if available. The assessment and the decision belong to the dermatologist.",
    fields: [
      { key: "reason", label: "Reason assessed", type: "select", options: ["New lesion", "Changing lesion", "Suspicious on screening", "Follow-up of known lesion", "Biopsy result review", "Ugly duckling sign — outlier lesion", "Patient concern", "Other"] },
      { key: "site", label: "Anatomical site", type: "input", placeholder: "e.g. right upper back, left cheek, subungual right thumb" },
      { key: "laterality", label: "Laterality", type: "select", options: ["Right", "Left", "Midline", "Not applicable"] },
      { key: "size_mm", label: "Size", type: "input", placeholder: "Measured in mm, with the method (clinical or dermoscopic)" },
      { key: "asymmetry", label: "A — Asymmetry", type: "select", options: ["Symmetrical", "Asymmetrical in one axis", "Asymmetrical in both axes", "Not documented"] },
      { key: "border_irregular", label: "B — Border irregularity", type: "select", options: ["Regular", "Irregular", "Not documented"] },
      { key: "colour_variation", label: "C — Colour variation", type: "select", options: ["Single colour", "Two or more colours", "Not documented"] },
      { key: "diameter_6mm", label: "D — Diameter 6 mm or more", type: "select", options: ["Under 6 mm", "6 mm or more", "Not measured"] },
      { key: "evolution", label: "E — Evolution (change in size, shape, colour, symptoms)", type: "select", options: ["No change reported", "Changing", "Rapidly changing", "New", "Not documented"] },
      { key: "ugly_duckling", label: "Ugly duckling sign", type: "select", options: ["Not present", "Present — outlier among the patient's naevi", "Not assessed"] },
      { key: "symptoms", label: "Lesion symptoms", type: "multi", options: ["Asymptomatic", "Itch", "Pain", "Bleeding", "Crusting", "Ulceration", "None documented"] },
      { key: "dermoscopy_pattern", label: "Dermoscopic pattern documented", type: "text", placeholder: "e.g. atypical network, irregular dots/globules, regression, blue-white veil, vascular pattern" },
      { key: "clinical_diagnosis", label: "Clinical diagnosis documented by the clinician", type: "input", placeholder: "The dermatologist's documented impression — never generated by AMedix" },
      { key: "suspicion", label: "Index of suspicion documented", type: "select", options: ["Benign appearance", "Uncertain — monitor", "Suspicious — biopsy advised", "Highly suspicious — urgent pathway", "Not documented"] },
      { key: "biopsy", label: "Biopsy performed in this episode", type: "select", options: YN },
      { key: "biopsy_type", label: "Biopsy type", type: "select", options: ["Punch", "Incisional", "Excisional", "Shave", "Deep saucerisation", "Other"], showIf: { key: "biopsy", equals: "Yes" } },
      { key: "histopathology", label: "Histopathology reported", type: "text", placeholder: "Diagnosis, subtype, Breslow thickness, Clark level, margins, perineural or lymphovascular invasion — exactly as reported", showIf: { key: "biopsy", equals: "Yes" } },
      { key: "histology_pending", label: "Histopathology outstanding", type: "select", options: ["Not applicable", "Awaiting report", "Report received", "Recut / second opinion requested"], showIf: { key: "biopsy", equals: "Yes" } },
      { key: "staging", label: "Staging documented", type: "input", placeholder: "TNM or stage as documented by the treating team; sentinel node discussion if relevant" },
      { key: "sun_damage", label: "Background field damage", type: "select", options: ["None documented", "Actinic keratoses present", "Extensive field cancerisation", "Previous skin cancer", "Not documented"] },
      { key: "immunosuppression", label: "Immunosuppressed", type: "select", options: YN },
      { key: "mdT", label: "Multidisciplinary discussion", type: "select", options: ["Not required", "Referred to MDT", "Discussed — plan documented", "Awaiting MDT"] },
    ],
  },

  // ------------------------------------------------------------ hair and nail
  dm_hair_nail: {
    key: "dm_hair_nail",
    title: "Hair, scalp and nail module",
    note: "Record the pattern of hair loss, whether the scalp is scarred and the nail findings. The pull test and trichoscopy results are recorded as performed or not performed.",
    fields: [
      { key: "complaint", label: "Presenting problem", type: "multi", options: ["Hair shedding", "Patchy hair loss", "Diffuse thinning", "Receding hairline", "Scalp scale / itch", "Nail dystrophy", "Nail discolouration", "Nail pain", "Paronychia", "Ingrowing nail"] },
      { key: "pattern", label: "Pattern of hair loss", type: "select", options: ["Diffuse", "Patchy well defined", "Frontal / temporal recession", "Diffuse central", "Ophiasis", "Scarring — localised", "Scarring — diffuse", "Not applicable"] },
      { key: "scarring", label: "Scarring alopecia suspected", type: "select", options: YNNA },
      { key: "pull_test", label: "Hair pull test", type: "select", options: ["Not performed", "Negative", "Positive — telogen hairs", "Positive — anagen hairs", "Inconclusive"] },
      { key: "trichoscopy", label: "Trichoscopy findings", type: "text", placeholder: "Exclamation mark hairs, black dots, yellow dots, empty follicles, perifollicular scale, variability of fibre diameter" },
      { key: "scalp_signs", label: "Scalp signs", type: "multi", options: ["Erythema", "Scale", "Follicular pustules", "Follicular hyperkeratosis", "Loss of follicular openings", "Normal scalp", "Not documented"] },
      { key: "nail_findings", label: "Nail findings", type: "multi", options: ["Pitting", "Beau's lines", "Onycholysis", "Subungual hyperkeratosis", "Longitudinal melanonychia", "Splinter haemorrhages", "Nail fold erythema", "Nail plate thickening", "Paronychia", "Pterygium", "No nail abnormality"] },
      { key: "nail_units", label: "Nail units involved", type: "input", placeholder: "e.g. both great toenails, all fingernails" },
      { key: "nail_sample", label: "Nail sampling", type: "multi", options: ["Not indicated", "Clipping for histology", "Subungual debris for KOH", "Culture", "Biopsy of nail matrix"] },
      { key: "systemic_review", label: "Systemic review documented", type: "multi", options: ["Thyroid disease", "Iron deficiency / anaemia", "PCOS / androgen excess", "Recent illness or childbirth", "Crash diet or weight loss", "New medication", "None documented"] },
      { key: "labs", label: "Investigations documented", type: "text", placeholder: "Ferritin, TSH, vitamin D, androgens, zinc — with results if available" },
      { key: "treatment", label: "Treatment documented in plan", type: "text", placeholder: "Topical, intralesional, systemic; and the review interval" },
    ],
  },

  // ------------------------------------------------------------ pigmentary
  dm_pigment: {
    key: "dm_pigment",
    title: "Pigmentary disorder module",
    note: "Record whether pigment is lost or gained, the distribution and whether the diagnosis was confirmed. Photoprotection and camouflage are documented as advice given, not as a prescription.",
    fields: [
      { key: "disorder", label: "Disorder documented", type: "select", options: ["Vitiligo", "Melasma", "Post-inflammatory hyperpigmentation", "Solar lentigines", "Naevus depigmentosus", "Pityriasis alba", "Drug-induced pigmentation", "Other / undetermined"] },
      { key: "type", label: "Clinical type / distribution", type: "input", placeholder: "e.g. non-segmental generalised vitiligo, centrofacial melasma, malar pattern" },
      { key: "sites", label: "Sites affected", type: "multi", options: SITES },
      { key: "extent", label: "Extent documented", type: "input", placeholder: "Approximate percentage or the areas involved" },
      { key: "activity", label: "Disease activity", type: "select", options: ["Stable over 12 months", "Progressing over the last 6 months", "Rapidly progressing", "Repigmenting", "Not documented"] },
      { key: "woods_lamp", label: "Wood's lamp examination", type: "select", options: ["Not performed", "Performed — confirms depigmentation", "Performed — accentuates pigment", "Performed — no accentuation", "Not available"] },
      { key: "koebner", label: "Koebner phenomenon / trauma-induced lesions", type: "select", options: YNNA },
      { key: "thyroid_review", label: "Autoimmune review documented (vitiligo)", type: "select", options: ["Not applicable", "Thyroid function checked", "Thyroid antibodies checked", "Referred to endocrinology", "Not documented"] },
      { key: "trigger", label: "Trigger identified", type: "multi", options: ["Sun exposure", "Pregnancy", "Hormonal contraception", "Cosmetic product", "Trauma / inflammation", "Drug", "None identified"] },
      { key: "photoprotection", label: "Photoprotection documented", type: "select", options: YNNA },
      { key: "camouflage", label: "Camouflage discussed", type: "select", options: YNNA },
      { key: "psychological", label: "Psychological impact documented", type: "select", options: ["None reported", "Mild", "Moderate", "Severe", "Not documented"] },
      { key: "treatment", label: "Treatment documented in plan", type: "text", placeholder: "Topical, phototherapy, procedural — with the site and the review point" },
    ],
  },

  // ------------------------------------------------------------ paediatric
  dm_pediatric: {
    key: "dm_pediatric",
    title: "Paediatric dermatology module",
    note: "Record the age, the nappy or feeding context and the family history. A dose is never calculated here: children are prescribed through the existing medication system at a documented weight-based dose.",
    fields: [
      { key: "age_group", label: "Age group", type: "select", options: ["Neonate (0–28 days)", "Infant (1–12 months)", "Toddler (1–3 years)", "Child (4–11 years)", "Adolescent (12–17 years)"] },
      { key: "weight", label: "Weight documented", type: "number", unit: "kg", min: 0.5, max: 150 },
      { key: "presentation", label: "Presentation documented", type: "multi", options: ["Erythema", "Papules", "Vesicles", "Pustules", "Scale / cradle cap", "Crusting", "Weeping", "Hypopigmented patches", "Naevi", "Vascular lesion", "Hair loss"] },
      { key: "sites", label: "Sites", type: "multi", options: ["Scalp", "Face", "Nappy area", "Trunk", "Limbs", "Flexures", "Hands and feet", "Oral mucosa", "Generalised"] },
      { key: "nappy", label: "Nappy area involvement", type: "select", options: ["Not applicable", "Involved — convexities spared", "Involved — flexures involved", "Involved — satellite pustules", "Not documented"] },
      { key: "birth_history", label: "Birth and neonatal history", type: "text", placeholder: "Gestation, birth weight, neonatal problems, phototherapy" },
      { key: "feeding", label: "Feeding", type: "select", options: ["Breastfed", "Formula fed", "Mixed", "Solids introduced", "Not applicable", "Not documented"] },
      { key: "growth", label: "Growth and development", type: "select", options: ["Appropriate", "Faltering growth", "Developmental concern", "Not documented"] },
      { key: "family_atopy", label: "Family history of atopy", type: "select", options: YN },
      { key: "genetic", label: "Known genetic or syndromic diagnosis", type: "text" },
      { key: "school_impact", label: "Impact on school, sleep or play", type: "text" },
      { key: "safeguarding", label: "Safeguarding concern considered", type: "select", options: ["No concern", "Considered — documented reasoning", "Referred", "Not documented"] },
      { key: "treatment", label: "Treatment documented in plan", type: "text", placeholder: "Product, strength, frequency and duration as prescribed — no dose is calculated by AMedix" },
    ],
  },

  // ------------------------------------------------------------ autoimmune
  dm_autoimmune: {
    key: "dm_autoimmune",
    title: "Autoimmune and blistering module",
    note: "Record the mucosal, blistering and systemic findings, the samples taken and the serology reported. A blistering diagnosis is confirmed by the documented immunofluorescence and serology, not by appearance alone.",
    fields: [
      { key: "suspected", label: "Suspected group documented by the clinician", type: "select", options: ["Pemphigus", "Pemphigoid", "Dermatitis herpetiformis", "Linear IgA disease", "Epidermolysis bullosa acquisita", "Cutaneous lupus", "Dermatomyositis", "Vasculitis", "Morphoea / scleroderma", "Undetermined"] },
      { key: "blister_type", label: "Blister characteristics", type: "multi", options: ["Tense bullae", "Flaccid bullae", "Erosions", "Urticarial plaques", "Targetoid lesions", "Crusted lesions", "Haemorrhagic blisters", "No blisters documented"] },
      { key: "sites", label: "Sites", type: "multi", options: SITES },
      { key: "mucosal", label: "Mucosal involvement", type: "select", options: ["None", "Oral", "Ocular", "Genital", "Multiple sites", "Not examined"] },
      { key: "nikolsky", label: "Nikolsky sign", type: "select", options: ["Not performed", "Negative", "Positive"] },
      { key: "systemic", label: "Systemic features", type: "multi", options: ["Fever", "Weight loss", "Dysphagia", "Muscle weakness", "Photosensitivity", "Raynaud", "Joint pain", "Renal involvement", "None documented"] },
      { key: "samples", label: "Samples taken", type: "multi", options: ["Punch biopsy — histology", "Perilesional biopsy — direct immunofluorescence", "Blood for serology", "Nasal / pharyngeal swab", "None taken"] },
      { key: "dif", label: "Direct immunofluorescence result", type: "text", placeholder: "Pattern and site of deposition exactly as reported" },
      { key: "serology", label: "Serology result", type: "text", placeholder: "Antibody and titre exactly as reported" },
      { key: "severity", label: "Extent documented", type: "input", placeholder: "Percentage body surface involved, or number of lesions" },
      { key: "medication_review", label: "Drug trigger review documented", type: "select", options: ["Reviewed — no trigger identified", "Reviewed — possible drug trigger documented", "Not reviewed"] },
      { key: "referral", label: "Referral documented", type: "multi", options: ["Ophthalmology", "Oral medicine", "Dermatology specialist centre", "Rheumatology", "Nephrology", "None"] },
      { key: "treatment", label: "Treatment documented in plan", type: "text", placeholder: "Agent, monitoring and the review interval — as prescribed by the clinician" },
    ],
  },

  // ------------------------------------------------------------ other
  dm_other: {
    key: "dm_other",
    title: "Other dermatological conditions",
    note: "Record the condition-specific findings for rosacea, hidradenitis suppurativa, urticaria and angioedema, lichenoid disease, hyperhidrosis or a drug eruption.",
    fields: [
      { key: "condition", label: "Condition documented by the clinician", type: "multi", options: ["Rosacea", "Hidradenitis suppurativa", "Urticaria", "Angioedema", "Lichen planus", "Lichen sclerosus", "Hyperhidrosis", "Drug eruption", "Erythema multiforme", "Erythroderma", "Keloid / hypertrophic scar", "Pruritus without rash", "Vitiligo", "Other"] },
      { key: "rosacea_subtype", label: "Rosacea features", type: "multi", options: ["Erythematotelangiectatic", "Papulopustular", "Phymatous", "Ocular", "Flushing triggers documented"], showIf: { key: "condition", in: ["Rosacea"] } },
      { key: "hs_sites", label: "Hidradenitis sites", type: "multi", options: ["Axillae", "Groins", "Perineal / perianal", "Inframammary", "Buttocks", "Other"], showIf: { key: "condition", in: ["Hidradenitis suppurativa"] } },
      { key: "hs_lesions", label: "Hidradenitis lesion count documented", type: "input", placeholder: "Abscesses, nodules, sinus tracts, scarring — per site", showIf: { key: "condition", in: ["Hidradenitis suppurativa"] } },
      { key: "urticaria_duration", label: "Urticaria duration", type: "select", options: ["Acute — under 6 weeks", "Chronic — 6 weeks or more", "Not applicable"], showIf: { key: "condition", in: ["Urticaria", "Angioedema"] } },
      { key: "angioedema_airway", label: "Angioedema with airway or tongue involvement", type: "select", options: ["No", "Yes — emergency management documented", "Not applicable"], showIf: { key: "condition", in: ["Urticaria", "Angioedema"] } },
      { key: "urticaria_triggers", label: "Urticaria triggers and provocation", type: "multi", options: ["Physical — pressure", "Physical — cold", "Physical — heat / cholinergic", "Drug (NSAID, ACE inhibitor)", "Food", "Infection", "None identified"], showIf: { key: "condition", in: ["Urticaria", "Angioedema"] } },
      { key: "drug_suspect", label: "Suspected culprit drug(s)", type: "input", placeholder: "Agent, start date, interval to eruption", showIf: { key: "condition", in: ["Drug eruption", "Erythema multiforme", "Erythroderma"] } },
      { key: "drug_severity", label: "Reaction severity features", type: "multi", options: ["Mucosal involvement", "Blistering / skin detachment", "Facial oedema", "Fever", "Eosinophilia", "Organ involvement", "None documented"], showIf: { key: "condition", in: ["Drug eruption", "Erythema multiforme", "Erythroderma"] } },
      { key: "hyperhidrosis_site", label: "Hyperhidrosis site and impact", type: "input", placeholder: "Palms, soles, axillae; effect on work and social contact", showIf: { key: "condition", in: ["Hyperhidrosis"] } },
      { key: "lichen_site", label: "Lichenoid disease site", type: "input", placeholder: "Oral, genital, cutaneous; and the extent", showIf: { key: "condition", in: ["Lichen planus", "Lichen sclerosus"] } },
      { key: "systemic_review", label: "Systemic or malignant association reviewed", type: "select", options: ["Reviewed — none identified", "Under investigation", "Referred", "Not reviewed"] },
      { key: "treatment", label: "Treatment documented in plan", type: "text", placeholder: "Agent, site, frequency, duration and the review point" },
    ],
  },

  // ------------------------------------------------------------ follow-up
  dm_followup: {
    key: "dm_followup",
    title: "Longitudinal review",
    note: "Record what changed since the last visit. A score is only comparable when it was measured again — a previous value is never carried forward as if it were today's.",
    fields: [
      { key: "interval", label: "Interval since last review", type: "input", placeholder: "e.g. 8 weeks" },
      { key: "response", label: "Treatment response as documented", type: "select", options: ["Cleared", "Marked improvement", "Partial improvement", "No change", "Worsened", "Not applicable"] },
      { key: "adherence", label: "Adherence as reported", type: "select", options: ["Full", "Partial", "Poor", "Stopped by patient", "Not documented"] },
      { key: "adverse_effects", label: "Adverse effects documented", type: "text", placeholder: "Which agent, what effect, what was done" },
      { key: "new_lesions", label: "New or changing lesions since last review", type: "select", options: ["None", "Present — documented below", "Not assessed"] },
      { key: "new_lesion_detail", label: "Detail of new or changing lesions", type: "text", showIf: { key: "new_lesions", equals: "Present — documented below" } },
      { key: "score_trend", label: "Severity compared with the previous documented score", type: "select", options: ["Improved", "Unchanged", "Worse", "No previous score recorded"] },
      { key: "photos", label: "Clinical photographs taken at this visit", type: "select", options: ["Yes — for comparison", "No", "Patient declined"] },
      { key: "histology_outstanding", label: "Outstanding results", type: "multi", options: ["Histopathology", "Direct immunofluorescence", "Serology", "Mycology culture", "Patch test reading", "None outstanding"] },
      { key: "relapse", label: "Relapse or flare documented", type: "select", options: ["None", "Flare after stopping treatment", "Relapse while on treatment", "Not documented"] },
      { key: "plan", label: "Plan for the next interval", type: "text", placeholder: "Continue, step up, step down, monitoring due, review date" },
      { key: "next_review", label: "Next review interval", type: "input", placeholder: "e.g. 3 months, or on results" },
    ],
  },
};

export const dmBlock = (key) => DM_BLOCKS[key] || null;

// The saved value keeps its block identity, so a reader always knows which block a
// value belongs to even after the template changes.
export const dmBlockValue = (blockKey, values) => ({ __block: blockKey, ...asObject(values) });

export const dmBlockValues = (values, blockKey) => asObject(asObject(values)[blockKey]);

export const dmBlockHasContent = (values, blockKey) =>
  Object.entries(dmBlockValues(values, blockKey)).some(([k, v]) =>
    k === "__block" ? false : Array.isArray(v) ? v.length > 0 : str(v) !== "",
  );

// Printed form, in the order the block declares.
export const formatDmBlock = (value) => {
  const v = asObject(value);
  const spec = dmBlock(asObject(v).__block);
  if (!spec) return "";
  return spec.fields
    .map((f) => {
      const raw = v[f.key];
      const text = Array.isArray(raw) ? raw.join(", ") : str(raw);
      return text ? `${f.label}: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");
};