export const IMAGING_TYPES = ["X-Ray", "CT", "MRI", "Ultrasound", "Mammography", "Other"];

export const EXAMINATIONS = {
  "X-Ray": ["Chest PA", "Chest AP", "Chest PA and Lateral", "Abdomen", "Pelvis", "Spine", "Extremity", "Other"],
  CT: ["CT Brain", "CT Chest", "CT Abdomen", "CT Pelvis", "CT Abdomen and Pelvis", "CT Chest/Abdomen/Pelvis", "Other"],
  MRI: ["MRI Brain", "MRI Spine", "MRI Knee", "MRI Shoulder", "MRI Abdomen", "Other"],
  Ultrasound: ["Abdomen", "Pelvis", "Renal", "Thyroid", "Obstetric", "Lower Limb DVT", "Other"],
  Mammography: ["Bilateral", "Unilateral", "Bilateral with Ultrasound", "Other"],
  Other: ["Other"],
};

export const CONTRAST_APPLICABLE = ["CT", "MRI"];
export const CONTRAST_OPTIONS = ["No contrast", "With contrast", "With and without contrast", "Not applicable"];
export const CONTRAST_ALLERGY_OPTIONS = ["No known allergy", "Known allergy", "Unknown"];
export const REACTION_OPTIONS = ["Yes", "No", "Unknown"];
export const PRIORITY_OPTIONS = ["Routine", "Urgent", "Emergency"];
export const YES_NO_UNKNOWN_OPTIONS = ["Yes", "No", "Unknown"];