// Welcome-banner artwork for the Doctor Portal Overview.
// One high-resolution image per specialty, shown behind the doctor's greeting.
// A doctor whose specialty has no artwork keeps the plain blue banner.
export const SPECIALTY_HERO_ART = {
  Cardiology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/944d4018a_generated_image.png",
  Neurology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/eaeaa9cbf_generated_image.png",
  "Emergency Medicine": "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/a37c61f94_generated_image.png",
  Orthopedics: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/253b344ee_generated_image.png",
  Nephrology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/0f7e5915e_generated_image.png",
  Ophthalmology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/0804f86aa_generated_image.png",
  Gastroenterology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/e145fece9_generated_image.png",
  Pediatrics: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/18018820b_generated_image.png",
  "General Surgery": "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/b79c870c8_generated_image.png",
  Endocrinology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/ddcce0047_generated_image.png",
  "Allergy & Immunology": "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/5facb7c83_generated_image.png",
  "Anesthesiology & Intensive Care": "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/afd9b50c9_generated_image.png",
  Dermatology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/0f9e43531_generated_image.png",
  "ENT (Otolaryngology)": "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/2704756b9_generated_image.png",
  "Family Medicine": "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/0645449b8_generated_image.png",
  "Obstetrics & Gynecology": "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/05f282bc6_generated_image.png",
  Oncology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/03251bd04_generated_image.png",
  "Plastic Surgery": "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/726f2e118_generated_image.png",
  Pulmonology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/c56725173_generated_image.png",
  Radiology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/3456803d9_generated_image.png",
  Rheumatology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/d0b2b320c_generated_image.png",
  Hematology: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/0742248f7_generated_image.png",
  Neurosurgery: "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/5b701f05c_generated_image.png",
};

export const specialtyHeroArt = (specialty) =>
  (specialty && SPECIALTY_HERO_ART[specialty]) || null;