// Dermatology — WHO ICD-11 MMS coding context and condition index.
//
// SCOPE AND HONESTY RULES
//   · WHO ICD-11 MMS only. No ICD-10 entry point and no crosswalk exists here.
//   · NO CODE IS WRITTEN IN THIS FILE. Every entry is a clinical search term that is
//     resolved at the moment of use against the AMedix-wide ICD-11 dataset (the same
//     shared infrastructure every specialty and hospital portal uses). A code is
//     stored only when the dataset returns that entry; a condition the dataset does
//     not hold is recorded with no code and flagged for coding review. A code is
//     never generated, completed or guessed — and never confirmed by software.
//   · The index is a shortcut into the classification, not a static diagnosis
//     dropdown: the clinician can always search the whole dataset by the words used
//     in clinic, including official Arabic titles where the dataset carries them.
//   · Detail a code cannot carry — severity, subtype, body site, laterality, organism
//     — is recorded beside the code in the entry's detail fields, never appended to it.

export const DM_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  label: "ICD-11 MMS",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  chapter_note:
    "Dermatology codes sit mainly in Chapter 14 (diseases of the skin) but reach into neoplasms, infectious diseases, immune system and congenital chapters. The chapter is read from the dataset entry itself and is never chosen by AMedix.",
};

// Every diagnosis carries one of these documented statuses. A code alone never
// confirms a diagnosis — the status is the clinician's statement.
export const DM_ICD_STATUSES = [
  "Suspected",
  "Differential diagnosis",
  "Provisional",
  "Confirmed",
  "Ruled out",
  "Historical",
  "Resolved",
];

export const DM_ICD_ROLES = ["Primary", "Secondary"];

export const DM_ICD_DETAIL_FIELDS = [
  {
    key: "subtype",
    label: "Subtype / variant recorded by the clinician",
    type: "input",
    placeholder: "e.g. plaque, guttate, palmoplantar, nummular, follicular",
  },
  {
    key: "severity",
    label: "Severity recorded by the clinician",
    type: "input",
    placeholder: "e.g. mild / moderate / severe, or the score documented (PASI, DLQI, EASI)",
  },
  {
    key: "body_site",
    label: "Body site / distribution",
    type: "input",
    placeholder: "e.g. scalp and extensor elbows, acral, intertriginous, generalised",
  },
  {
    key: "laterality",
    label: "Laterality",
    type: "select",
    options: ["Right", "Left", "Bilateral", "Midline", "Not applicable", "Not documented"],
    hint: "Recorded beside the code — never appended to it.",
  },
  { key: "duration", label: "Duration / onset", type: "input", placeholder: "e.g. 6 weeks, since childhood, recurrent" },
  {
    key: "organism",
    label: "Organism / histology detail",
    type: "input",
    placeholder: "e.g. dermatophyte on KOH, HSV-1 PCR, superficial spreading melanoma, Breslow 0.8 mm",
  },
  {
    key: "basis",
    label: "Clinical basis documented",
    type: "input",
    placeholder: "Findings, dermoscopy, histopathology or test result that support this entry",
  },
];

export const DM_ICD_CODING_NOTE =
  "WHO ICD-11 MMS only — ICD-10 is never used and no crosswalk is applied. A code is stored only when the workspace's ICD-11 dataset returns that entry, with the release recorded; anything else is recorded as unresolved and flagged for coding review. A morphological finding or a symptom is not coded as a diagnosis, and no code is ever confirmed by AMedix.";

export const DM_ICD_CLUSTER_NOTE =
  "Leave empty unless the WHO Coding Tool produced a postcoordinated cluster. A cluster is copied exactly as the WHO browser shows it, never assembled here and never extended with a stem the classification does not provide.";

export const DM_ICD_SEARCH_GUIDANCE =
  "Search by disease name, synonym, clinical term, abbreviation, ICD-11 code, or official Arabic title where the dataset carries one. A term the dataset does not return is recorded as an unresolved diagnosis with the wording the clinician used — never replaced by a near match.";

const group = (key, title, terms) => ({ key, title, terms });

// Condition index. These are SEARCH TERMS, not codes and not a closed list.
export const DM_ICD11_GROUPS = [
  group("acne", "Acne and follicular disorders", [
    "acne vulgaris", "comedonal acne", "inflammatory acne", "nodulocystic acne", "acne conglobata",
    "acne keloidalis nuchae", "hidradenitis suppurativa", "folliculitis", "pseudofolliculitis barbae",
    "acne scarring", "drug induced acne", "rosacea", "perioral dermatitis",
  ]),
  group("eczema", "Eczema and dermatitis", [
    "atopic dermatitis", "atopic eczema", "contact dermatitis", "allergic contact dermatitis",
    "irritant contact dermatitis", "seborrhoeic dermatitis", "nummular dermatitis", "dyshidrotic eczema",
    "stasis dermatitis", "asteatotic eczema", "lichen simplex chronicus", "prurigo nodularis",
    "hand eczema", "napkin dermatitis", "photoallergic dermatitis",
  ]),
  group("psoriasis", "Psoriasis and papulosquamous disorders", [
    "psoriasis vulgaris", "plaque psoriasis", "guttate psoriasis", "inverse psoriasis", "pustular psoriasis",
    "erythrodermic psoriasis", "scalp psoriasis", "nail psoriasis", "psoriatic arthritis",
    "lichen planus", "pityriasis rosea", "pityriasis rubra pilaris", "seborrhoeic dermatitis",
  ]),
  group("infection", "Cutaneous infections and infestations", [
    "impetigo", "cellulitis", "erysipelas", "folliculitis", "furuncle", "carbuncle", "ecthyma",
    "staphylococcal scalded skin syndrome", "necrotising fasciitis", "erythrasma", "tinea corporis",
    "tinea cruris", "tinea pedis", "tinea capitis", "tinea unguium", "onychomycosis", "candidiasis",
    "pityriasis versicolor", "herpes simplex", "herpes zoster", "varicella", "molluscum contagiosum",
    "viral wart", "hand foot and mouth disease", "scabies", "pediculosis", "cutaneous leishmaniasis",
    "cutaneous larva migrans", "syphilis", "cutaneous tuberculosis", "leprosy",
  ]),
  group("skin_cancer", "Skin cancer and premalignant lesions", [
    "melanoma", "superficial spreading melanoma", "nodular melanoma", "lentigo maligna melanoma",
    "acral lentiginous melanoma", "basal cell carcinoma", "squamous cell carcinoma of skin",
    "keratoacanthoma", "actinic keratosis", "bowen disease", "cutaneous squamous cell carcinoma in situ",
    "merkel cell carcinoma", "dermatofibrosarcoma protuberans", "cutaneous lymphoma", "mycosis fungoides",
    "kaposi sarcoma", "atypical fibroxanthoma", "dysplastic naevus", "congenital melanocytic naevus",
    "actinic cheilitis",
  ]),
  group("hair_nail", "Hair and nail disorders", [
    "androgenetic alopecia", "alopecia areata", "alopecia totalis", "alopecia universalis",
    "telogen effluvium", "anagen effluvium", "trichotillomania", "frontal fibrosing alopecia",
    "lichen planopilaris", "folliculitis decalvans", "traction alopecia", "cicatricial alopecia",
    "hirsutism", "psoriatic nail dystrophy", "onycholysis", "paronychia", "ingrowing nail",
    "subungual haematoma", "longitudinal melanonychia", "nail psoriasis", "onychodystrophy",
  ]),
  group("pigmentary", "Pigmentary disorders", [
    "vitiligo", "segmental vitiligo", "melasma", "post-inflammatory hyperpigmentation",
    "solar lentigo", "ephelides", "cafe au lait macule", "ash leaf macule", "naevus of ota",
    "naevus depigmentosus", "pityriasis alba", "drug induced hyperpigmentation", "ochronosis",
    "Riehl melanosis", "periorbital hyperpigmentation",
  ]),
  group("autoimmune", "Autoimmune and blistering disease", [
    "pemphigus vulgaris", "pemphigus foliaceus", "bullous pemphigoid", "dermatitis herpetiformis",
    "linear IgA disease", "epidermolysis bullosa acquisita", "epidermolysis bullosa",
    "cutaneous lupus erythematosus", "discoid lupus erythematosus", "subacute cutaneous lupus",
    "dermatomyositis", "systemic sclerosis", "morphoea", "cutaneous vasculitis",
    "immunoglobulin a vasculitis", "urticarial vasculitis", "scleroderma", "graft versus host disease",
    "sarcoidosis of skin",
  ]),
  group("reaction", "Drug eruptions and urticaria", [
    "maculopapular drug eruption", "morbilliform drug eruption", "drug hypersensitivity syndrome",
    "DRESS syndrome", "Stevens-Johnson syndrome", "toxic epidermal necrolysis",
    "acute generalised exanthematous pustulosis", "fixed drug eruption", "photodrug eruption",
    "urticaria", "chronic spontaneous urticaria", "angioedema", "anaphylaxis", "erythema multiforme",
    "erythema nodosum", "leukocytoclastic vasculitis", "serum sickness",
  ]),
  group("pediatric", "Paediatric dermatology", [
    "atopic dermatitis", "infantile haemangioma", "port wine stain", "milia", "seborrhoeic dermatitis",
    "cradle cap", "napkin dermatitis", "diaper candidiasis", "molluscum contagiosum", "hand foot and mouth disease",
    "impetigo", "tinea capitis", "alopecia areata", "vitiligo", "ichthyosis vulgaris", "mastocytosis",
    "urticaria pigmentosa", "scabies", "erythema toxicum neonatorum", "transient neonatal pustular melanosis",
  ]),
  group("other", "Other dermatological conditions", [
    "rosacea", "hidradenitis suppurativa", "lichen sclerosus", "lichen planus", "hyperhidrosis",
    "morphoea", "keloid", "hypertrophic scar", "pruritus", "generalised pruritus", "chronic pruritus of unknown origin",
    "erythroderma", "stevens-johnson syndrome", "bullous pemphigoid", "photosensitivity", "polymorphic light eruption",
    "melasma", "vitiligo", "acanthosis nigricans", "xerosis", "pressure ulcer", "venous ulcer",
    "stasis ulcer", "diabetic foot ulcer", "cutaneous adverse event of targeted therapy",
  ]),
];

export const DM_ICD11_CONDITION_COUNT = DM_ICD11_GROUPS.reduce((n, g) => n + g.terms.length, 0);