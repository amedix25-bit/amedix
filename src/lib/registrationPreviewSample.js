import { emptyGynaeHistory } from "@/lib/gynaeObstetric";

// Sample answers for the admin registration preview. Every value is obviously
// fake and exists only in the browser's memory — the preview never writes to the
// database, so this is never stored anywhere.
export function sampleRegistration() {
  const gynae = emptyGynaeHistory();
  return {
    form: {
      first_name: "Demo",
      father_name: "Test",
      grandfather_name: "Sample",
      last_name: "Patient",
      first_name_ar: "تجريبي",
      father_name_ar: "اختبار",
      grandfather_name_ar: "نموذج",
      last_name_ar: "مريض",
      date_of_birth: "1990-05-14",
      gender: "female",
      phone: "0910000000",
      address: "Demo Street, Demo City",
      nationality: "Demo nationality",
      blood_type: "O+",
      emergency_contact_name: "Demo Contact",
      emergency_contact_phone: "0910000001",
      emergency_contact_relationship: "Sibling",
      identification_number: "DEMO-000000",
      preferred_language: "en",
    },
    lifestyle: {
      smoking_status: "never",
      alcohol_use: "none",
      substance_use: "None",
      occupation: "Demo occupation",
      occupational_exposure: "None",
      physical_activity: "moderate",
      consanguinity: "none",
      diet_types: ["balanced"],
      typical_diet: "",
      food_allergies_intolerances: "",
      sleep_patterns: ["sleeps_through_night"],
      sleep_pattern_other: "",
      sleep_concerns: "",
      living_situation_type: "immediate_family",
      living_situation: "",
      mobility_limitations: "",
      vaccination_status: "unknown",
      vaccination_records: {},
      marital_status: "married",
      urological_history: "",
    },
    // Every list section answered with an explicit "None" so the sample can walk
    // through all four steps; entries can still be added by hand to test a list.
    noneFlags: {
      familyHistory: true,
      pastHistory: true,
      medicalEvents: true,
      medications: true,
      surgeries: true,
      immunizations: true,
      chronicCare: true,
    },
    allergyRecord: "no_known_allergies",
    gynae: {
      ...gynae,
      current_pregnancy: { ...gynae.current_pregnancy, status: "not_pregnant" },
      menopause: { ...gynae.menopause, status: "postmenopausal" },
    },
  };
}