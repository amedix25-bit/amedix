// Patient education delivered during a rheumatology encounter. The content is
// the standard safety and self-management advice given with DMARDs, biologics
// and glucocorticoids; what is recorded is what was actually discussed and
// understood, so an undocumented topic is never presented as delivered.
export const EDUCATION_TOPICS = [
  {
    key: "medication_safety",
    label: "Medication safety",
    core: true,
    points: [
      "Methotrexate is taken ONCE a week, never daily; folic acid is taken as advised.",
      "Do not start any new medicine, including over-the-counter or herbal products, without checking with the rheumatology team.",
      "Avoid trimethoprim and co-trimoxazole while on methotrexate.",
      "Use effective contraception when on methotrexate, leflunomide or other teratogenic therapy; stop and call the team if pregnancy is suspected.",
      "Bring the medication list, or the medicine boxes, to every visit.",
    ],
  },
  {
    key: "sick_day_rules",
    label: "Sick-day rules (holding therapy when unwell)",
    core: true,
    points: [
      "When feverish or unwell with an infection, hold methotrexate, leflunomide, biologics and JAK inhibitors and contact the team.",
      "Do not stop glucocorticoids suddenly; the dose is reduced only as instructed.",
      "Restart disease-modifying therapy only after the team confirms it is safe.",
    ],
  },
  {
    key: "infection_precautions",
    label: "Infection precautions",
    core: true,
    points: [
      "Immunosuppressive therapy raises the risk of serious infection; report fever, rigors, productive cough, dysuria or a spreading rash promptly.",
      "Avoid close contact with people who have chickenpox, shingles, measles or tuberculosis until advice is given.",
      "Practise hand hygiene and avoid live vaccines without checking first.",
      "Tell any treating doctor or dentist which rheumatology medicines are being taken.",
    ],
  },
  {
    key: "vaccination",
    label: "Vaccination",
    core: true,
    points: [
      "Influenza and pneumococcal vaccination are recommended; COVID-19 vaccination should be kept up to date.",
      "Shingles (zoster) vaccination may be advised — the type depends on the therapy being taken.",
      "Live vaccines are avoided on most immunosuppressive therapy; inactivated vaccines are preferred.",
      "Vaccinate household contacts where advised.",
    ],
  },
  {
    key: "bone_health",
    label: "Bone health",
    core: true,
    points: [
      "Glucocorticoids and reduced activity increase fracture risk; bone protection is reviewed at each visit.",
      "Take calcium and vitamin D as advised, and do weight-bearing exercise within the limits of the disease.",
      "Report sudden back pain or a new fracture after minimal trauma.",
      "Smoking and excess alcohol both worsen bone loss.",
    ],
  },
  {
    key: "physical_activity",
    label: "Physical activity & joint protection",
    core: true,
    points: [
      "Exercise is treatment: it reduces pain and preserves strength, function and bone density.",
      "Start gently and build up; a mix of aerobic activity, strengthening and flexibility work is best.",
      "During an active flare, rest the inflamed joint and maintain gentle range-of-motion exercise.",
      "Use pacing and joint-protection techniques for daily tasks; discuss aids and work adaptation if needed.",
    ],
  },
  {
    key: "cardiovascular_risk",
    label: "Cardiovascular risk reduction",
    core: true,
    points: [
      "Inflammatory arthritis raises cardiovascular risk; blood pressure, lipids, glucose and weight are reviewed regularly.",
      "Do not smoke; ask for support to stop.",
      "Aim for a heart-healthy diet, regular activity and moderation in alcohol.",
      "Report chest pain, breathlessness or calf swelling urgently.",
    ],
  },
  {
    key: "warning_signs",
    label: "Warning signs requiring urgent care",
    core: true,
    points: [
      "Fever above 38 °C, rigors, or feeling suddenly very unwell on immunosuppressive therapy.",
      "Chest pain, breathlessness at rest, or coughing blood.",
      "Sudden vision loss, a painful red eye, or new double vision.",
      "New weakness, numbness, difficulty walking, or loss of bladder or bowel control.",
      "A rash that does not fade under pressure, or a rapidly spreading rash.",
      "Severe headache with neck stiffness, confusion or a seizure.",
      "Reduced urine output, facial or leg swelling, or blood in the urine.",
      "Do not wait for the next appointment — seek urgent medical assessment.",
    ],
  },
  {
    key: "pregnancy_contraception",
    label: "Pregnancy & contraception",
    core: false,
    points: [
      "Plan pregnancy in advance: several medicines must be changed before conception.",
      "Effective contraception is essential on teratogenic therapy.",
      "Contact the team as soon as pregnancy is suspected or planned.",
    ],
  },
  {
    key: "eye_skin_care",
    label: "Eye & skin care",
    core: false,
    points: [
      "Report eye redness, pain, light sensitivity or visual change — do not treat with drops from elsewhere.",
      "Hydroxychloroquine therapy requires the retinal screening schedule that has been set.",
      "Use sun protection and report new or changing skin lesions.",
      "Report hair loss, rash, mouth ulcers or nail change.",
    ],
  },
  {
    key: "fatigue_self_management",
    label: "Fatigue, mood & self-management",
    core: false,
    points: [
      "Fatigue is a symptom of the disease, not a failure of effort; pacing and sleep routines help.",
      "Discuss low mood, anxiety or sleep problems — they are treatable and affect disease control.",
      "Keep a symptom diary and bring it to the next review.",
    ],
  },
  {
    key: "flare_action_plan",
    label: "Flare action plan",
    core: false,
    points: [
      "Recognise the early signs of a flare for this patient: increasing pain, stiffness, swelling, fatigue.",
      "Know who to contact and how to get an urgent review.",
      "Do not increase or restart steroids or disease-modifying therapy without instruction.",
    ],
  },
];

export const coreTopics = () => EDUCATION_TOPICS.filter((t) => t.core).map((t) => t.key);

export const emptyEducation = () => ({ items: [], materials: "", warning_signs: "" });

const normalize = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? { ...emptyEducation(), ...value } : emptyEducation();

export const educationEntry = (value, topicKey) =>
  (normalize(value).items || []).find((i) => i.topic_key === topicKey) || { topic_key: topicKey, discussed: false, understood: false };

export const toggleEducation = (value, topicKey, patch) => {
  const safe = normalize(value);
  const items = Array.isArray(safe.items) ? [...safe.items] : [];
  const index = items.findIndex((i) => i.topic_key === topicKey);
  const base = index >= 0 ? items[index] : { topic_key: topicKey, discussed: false, understood: false };
  const next = { ...base, ...patch };
  if (index >= 0) items[index] = next;
  else items.push(next);
  return { ...safe, items };
};

export const formatEducation = (value) => {
  const safe = normalize(value);
  const discussed = (safe.items || []).filter((i) => i.discussed);
  if (discussed.length === 0 && !safe.materials && !safe.warning_signs) return "";
  const lines = discussed.map((i) => {
    const topic = EDUCATION_TOPICS.find((t) => t.key === i.topic_key);
    const label = topic ? topic.label : i.topic_key;
    const confirmation = i.understood ? "understanding confirmed by teach-back" : "understanding not yet confirmed";
    return `• ${label} — discussed, ${confirmation}`;
  });
  if (safe.materials) lines.push(`Written materials given: ${String(safe.materials).trim()}`);
  if (safe.warning_signs) lines.push(`Warning signs requiring urgent care: ${String(safe.warning_signs).trim()}`);
  return lines.join("\n");
};