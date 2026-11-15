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
};

export const specialtyHeroArt = (specialty) =>
  (specialty && SPECIALTY_HERO_ART[specialty]) || null;