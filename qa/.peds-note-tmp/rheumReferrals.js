// Structured Rheumatology referrals. A referral is a documented clinical
// question sent to a named service — never a free-text note. Each entry keeps
// the service, urgency, the question asked, the supporting findings, the
// therapy that affects the receiving team's decisions, what is requested back
// and its status, so the loop with the receiving specialty stays traceable.
export const REFERRAL_SPECIALTIES = [
  { key: "nephrology", label: "Nephrology" },
  { key: "dermatology", label: "Dermatology" },
  { key: "ophthalmology", label: "Ophthalmology" },
  { key: "pulmonology", label: "Pulmonology" },
  { key: "cardiology", label: "Cardiology" },
  { key: "neurology", label: "Neurology" },
  { key: "infectious_diseases", label: "Infectious Diseases" },
  { key: "orthopaedics", label: "Orthopaedics" },
  { key: "physiotherapy", label: "Physiotherapy & Rehabilitation" },
  { key: "gastroenterology", label: "Gastroenterology & Hepatology" },
  { key: "haematology", label: "Haematology" },
  { key: "endocrinology", label: "Endocrinology & Bone Metabolism" },
  { key: "vascular_surgery", label: "Vascular Surgery" },
  { key: "obstetrics", label: "Obstetrics & Gynaecology" },
  { key: "oral_medicine", label: "Oral Medicine" },
  { key: "pain_medicine", label: "Pain Medicine" },
  { key: "psychiatry", label: "Psychiatry & Psychology" },
  { key: "general_medicine", label: "General Internal Medicine" },
  { key: "other", label: "Other Specialty" },
];

export const REFERRAL_URGENCIES = ["Routine", "Urgent", "Emergency — same day"];

export const REFERRAL_STATUSES = [
  "Documented — letter to be issued",
  "Letter issued",
  "Accepted by receiving service",
  "Seen by receiving service",
  "Declined / redirected elsewhere",
];

export const specialtyLabel = (key) =>
  (REFERRAL_SPECIALTIES.find((s) => s.key === key) || {}).label || key || "";

let counter = 0;
export const newReferral = () => ({
  id: `ref-${Date.now()}-${++counter}`,
  specialty: "",
  other_specialty: "",
  urgency: "Routine",
  question: "",
  findings: "",
  therapy: "",
  request: "",
  status: REFERRAL_STATUSES[0],
});

// What each service is commonly asked in rheumatology — a starting point for
// the clinical question, never an automatic answer.
export const REFERRAL_GUIDANCE = {
  nephrology: "Proteinuria, haematuria, rising creatinine, hypertension or suspected lupus nephritis — state whether a renal biopsy opinion is needed.",
  dermatology: "Psoriasis severity, cutaneous lupus, vasculitic rash or a drug eruption — state the therapy the patient is taking.",
  ophthalmology: "Uveitis, scleritis, episcleritis, retinal toxicity screening on hydroxychloroquine, or sudden visual change.",
  pulmonology: "Interstitial lung disease, pleural disease, pulmonary hypertension or pre-biologic respiratory assessment.",
  cardiology: "Pericarditis, myocarditis, valvular involvement, heart failure, or cardiovascular risk optimisation.",
  neurology: "Mononeuritis multiplex, peripheral neuropathy, CNS lupus, myelopathy or suspected drug-related neuropathy.",
  infectious_diseases: "Suspected or confirmed infection on immunosuppression, latent TB management, or hepatitis B reactivation risk.",
  orthopaedics: "Destructive joint disease, tendon rupture, fracture or a surgical opinion — state the disease-modifying therapy.",
  physiotherapy: "Function, range of motion, strength, gait and a graded exercise programme during active or quiescent disease.",
  gastroenterology: "Hepatic abnormality, inflammatory bowel disease overlap, or gastrointestinal vasculitis.",
  haematology: "Cytopenias, antiphospholipid syndrome, thrombosis or a suspected haematological malignancy.",
  endocrinology: "Osteoporosis and fracture risk, glucocorticoid-induced bone loss, or diabetes affecting therapy choice.",
  vascular_surgery: "Large-vessel vasculitis, arterial stenosis, aneurysm or critical limb ischaemia.",
  obstetrics: "Pre-conception planning, pregnancy on DMARDs or biologics, and postpartum flare management.",
  oral_medicine: "Oral ulcers, sicca, or suspected Sjögren's-related dental and mucosal disease.",
  pain_medicine: "Persistent pain despite controlled disease activity, or a regional pain intervention.",
  psychiatry: "Depression, anxiety, sleep disturbance or chronic pain coping — part of comprehensive rheumatology care.",
  general_medicine: "Comorbidity optimisation, polypharmacy review, or an undifferentiated systemic presentation.",
  other: "Document the service and the question asked.",
};

export const formatReferrals = (list) => {
  if (!Array.isArray(list) || list.length === 0) return "";
  return list
    .map((r) => {
      const service = r.specialty === "other" ? r.other_specialty || "Other" : specialtyLabel(r.specialty);
      const parts = [
        r.question ? `Question: ${String(r.question).trim()}` : "",
        r.findings ? `Findings: ${String(r.findings).trim()}` : "",
        r.therapy ? `Therapy: ${String(r.therapy).trim()}` : "",
        r.request ? `Requested: ${String(r.request).trim()}` : "",
      ].filter(Boolean);
      return `Referral — ${service || "Service not selected"} (${r.urgency || "Routine"})${parts ? `; ${parts.join("; ")}` : ""}${r.status ? ` — ${r.status}` : ""}`;
    })
    .join("\n");
};