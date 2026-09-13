import { sel, chk, multi, num, section } from "../shared";

export default {
  key: "pediatric",
  label: "Pediatric Examination",
  description: "Child-focused assessment — growth, development and systems",
  sections: [
    section("general", "General Assessment", [
      sel("appearance", "General appearance", ["Well and playful", "Unwell but consolable", "Toxic / very unwell"]),
      sel("activity", "Activity level", ["Age-appropriate", "Lethargic", "Irritable", "Unresponsive"]),
      sel("hydration", "Hydration", ["Well hydrated", "Mildly dehydrated", "Severely dehydrated"], { detailOn: ["Mildly dehydrated", "Severely dehydrated"] }),
      chk("pallor", "Pallor"),
      chk("jaundice", "Jaundice", { detailOn: true }),
      chk("cyanosis", "Cyanosis", { detailOn: true }),
    ]),
    section("growth", "Growth and Vital Signs", [
      num("weight", "Weight", { unit: "kg", step: 0.01, min: 0, max: 200 }),
      num("height", "Height / length", { unit: "cm", step: 0.1, min: 0, max: 220 }),
      num("head_circ", "Head circumference", { unit: "cm", step: 0.1, min: 0, max: 70 }),
      num("temperature", "Temperature", { unit: "°C", step: 0.1, min: 30, max: 45 }),
      num("pulse", "Heart rate", { unit: "bpm", min: 20, max: 260 }),
      num("resp_rate", "Respiratory rate", { unit: "/min", min: 5, max: 120 }),
      sel("percentiles", "Growth chart position", ["On expected percentile", "Crossing down percentiles", "Below expected", "Above expected"]),
    ], { mode: "free" }),
    section("head_ent", "Head and ENT", [
      sel("fontanelle", "Anterior fontanelle (infants)", ["Normal and flat", "Bulging", "Sunken", "Closed / not applicable"], { detailOn: ["Bulging", "Sunken"] }),
      sel("ears", "Ears", ["Normal", "Otitis media", "Discharge", "Foreign body"], { detailOn: ["Otitis media", "Discharge", "Foreign body"] }),
      sel("throat", "Throat / tonsils", ["Normal", "Inflamed", "Exudate", "Enlarged tonsils"], { detailOn: ["Inflamed", "Exudate", "Enlarged tonsils"] }),
      chk("dental", "Dental caries / hygiene issues", { detailOn: true }),
    ]),
    section("chest_cardio", "Chest and Cardiovascular", [
      sel("resp_effort", "Respiratory effort", ["Normal", "Mild distress", "Moderate distress", "Severe distress / grunting"], { detailOn: ["Mild distress", "Moderate distress", "Severe distress / grunting"] }),
      sel("breath_sounds", "Breath sounds", ["Normal / vesicular", "Reduced", "Bronchial", "Added sounds"], { detailOn: ["Reduced", "Bronchial", "Added sounds"], detailLaterality: true }),
      multi("added_sounds", "Added sounds", ["None", "Crackles", "Wheeze", "Stridor", "Grunting"]),
      sel("heart_sounds", "Heart sounds", ["Normal", "Abnormal"], { detailOn: ["Abnormal"] }),
      chk("murmur", "Murmur", { detailOn: true }),
    ]),
    section("abdomen", "Abdomen", [
      sel("contour", "Contour", ["Normal", "Distended", "Scaphoid"]),
      chk("tenderness", "Tenderness", { detailOn: true }),
      chk("organomegaly", "Organomegaly", { detailOn: true }),
      sel("umbilicus", "Umbilicus", ["Normal", "Hernia", "Discharge / infection"], { detailOn: ["Hernia", "Discharge / infection"] }),
      sel("hernia_sites", "Other hernias", ["None", "Inguinal", "Epigastric"], { detailOn: ["Inguinal", "Epigastric"], detailLaterality: true }),
    ]),
    section("neuro_development", "Neurological and Development", [
      sel("tone", "Muscle tone", ["Normal", "Hypertonia", "Hypotonia"], { detailOn: ["Hypertonia", "Hypotonia"] }),
      sel("reflexes", "Primitive reflexes (infants)", ["Normal for age", "Abnormal", "Not applicable"]),
      sel("milestones", "Developmental milestones", ["Age-appropriate", "Delayed"], { detailOn: ["Delayed"] }),
      sel("gait_play", "Gait / play behaviour", ["Age-appropriate", "Abnormal"], { detailOn: ["Abnormal"] }),
      chk("microcephaly", "Head size concerns (micro / macrocephaly)", { detailOn: true }),
    ]),
    section("skin", "Skin", [
      sel("rash", "Rash", ["Absent", "Present"], { detailOn: ["Present"] }),
      chk("napkin_dermatitis", "Napkin / diaper dermatitis"),
      chk("birthmarks", "Birthmarks", { detailOn: true }),
      chk("signs_nutrition", "Signs of nutritional deficiency", { detailOn: true }),
    ]),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};