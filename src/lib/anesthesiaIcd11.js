// ICD-11 MMS search catalogue for Anesthesiology & Perioperative Medicine.
//
// Every code here is an entry that already exists in AMedix's own verified
// terminology record (TerminologyCode, ICD-11-MMS). Nothing is generated,
// inferred or guessed: a concept that is not listed is entered by the clinician
// with the code and official term read from the WHO ICD-11 browser, and the
// picker flags it as manually entered so it is never presented as a catalogue
// match.
//
// This catalogue is a documentation aid only. It records the patient's
// UNDERLYING CONDITIONS for their perioperative relevance. It is not an ASA
// Physical Status classification and never assigns one: ASA Physical Status is
// a separate functional classification, assigned and justified by the
// anesthesiologist. Selecting a code never confirms a diagnosis.

import { ICD11_MMS, SPECIFICITY } from "@/lib/rheumIcd11";

export { ICD11_MMS, SPECIFICITY };

export const ANESTHESIA_ICD11_NOTE =
  "Codes are drawn from the app's verified ICD-11 MMS terminology record. A condition that is not listed is entered by the clinician from the WHO ICD-11 browser (https://icd.who.int/browse/2024-01/mms/en) with its official code and term.";

export const ANESTHESIA_ICD11 = [
  {
    code: "BA00",
    display: "Essential hypertension",
    specificity: SPECIFICITY.SUB,
    definition:
      "Persistently elevated arterial blood pressure without an identified secondary cause. Relevant to anesthesia through intraoperative lability, the hypotensive response to neuraxial blockade and long-term target-organ effects.",
    aliases: "hypertension high blood pressure htn",
  },
  {
    code: "BA41-BA4Z",
    display: "Ischaemic heart diseases",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Atherosclerotic disease of the coronary circulation, including angina and prior myocardial infarction. Relevant to perioperative cardiac risk, the stress response to induction and emergence, and continuation of antiplatelet therapy planning.",
    aliases: "ihd cad coronary ischaemic ischemic angina myocardial infarction mi coronary stent",
  },
  {
    code: "8B1Z",
    display: "Cerebrovascular disease, unspecified",
    specificity: SPECIFICITY.SUB,
    definition:
      "Disease of the cerebral vasculature, including previous stroke or transient ischaemic attack. Relevant through cerebral autoregulation, blood-pressure targets, positioning and perioperative neurological monitoring.",
    aliases: "stroke cva tia cerebrovascular previous stroke",
  },
  {
    code: "CA22",
    display: "Chronic obstructive pulmonary disease",
    specificity: SPECIFICITY.SUB,
    definition:
      "Persistent airflow limitation with respiratory symptoms. Relevant through reduced respiratory reserve, risk of postoperative pulmonary complications, opioid sensitivity and the need for lung-protective ventilation strategies.",
    aliases: "copd emphysema chronic bronchitis airflow limitation",
  },
  {
    code: "CA23",
    display: "Asthma",
    specificity: SPECIFICITY.SUB,
    definition:
      "Chronic airway inflammation with variable expiratory airflow limitation and bronchial hyper-responsiveness. Relevant through the risk of intraoperative bronchospasm, the choice of airway device and volatile agent, and avoidance of non-selective beta blockade.",
    aliases: "asthma reactive airway bronchospasm wheeze",
  },
  {
    code: "CA40",
    display: "Pneumonia",
    specificity: SPECIFICITY.SUB,
    definition:
      "Infection of the lung parenchyma. A recent or active pneumonia is relevant to the timing of elective anesthesia, gas exchange and secretion management.",
    aliases: "pneumonia chest infection lower respiratory tract infection",
  },
  {
    code: "5B80",
    display: "Obesity",
    specificity: SPECIFICITY.SUB,
    definition:
      "Excess body fat with adverse health effects. Relevant through airway difficulty, rapid oxygen desaturation, obstructive sleep apnoea, dosing by adjusted or lean body weight, positioning and thromboprophylaxis.",
    aliases: "obesity bariatric high bmi morbid obesity",
  },
  {
    code: "5A00",
    display: "Hypothyroidism",
    specificity: SPECIFICITY.SUB,
    definition:
      "Deficiency of thyroid hormone. Relevant through delayed drug metabolism, hypothermia, bradycardia, reduced cardiac output and the risk of myxoedema in severe untreated disease.",
    aliases: "hypothyroid thyroid underactive myxoedema",
  },
  {
    code: "5A20",
    display: "Hyperthyroidism",
    specificity: SPECIFICITY.SUB,
    definition:
      "Excess thyroid hormone. Relevant through tachycardia, arrhythmia, hyperthermia, the risk of thyroid storm during the perioperative stress response and altered drug requirements.",
    aliases: "hyperthyroid thyrotoxicosis graves thyroid storm",
  },
  {
    code: "5A00-5A14",
    display: "Diabetes mellitus",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Disorders of glucose regulation including diabetes mellitus. Relevant through perioperative glycaemic control, autonomic neuropathy and silent ischaemia, gastroparesis and aspiration risk, renal impairment, wound healing and insulin or oral agent holding plans.",
    aliases: "diabetes diabetic mellitus t2dm t1dm glucose hyperglycaemia",
  },
  {
    code: "5C80",
    display: "Hyperlipidaemia",
    specificity: SPECIFICITY.SUB,
    definition:
      "Elevated circulating lipids. Relevant mainly through associated atherosclerotic disease and continuation of statin therapy.",
    aliases: "hyperlipidaemia hyperlipidemia cholesterol high lipids statin",
  },
  {
    code: "GB61",
    display: "Chronic kidney disease",
    specificity: SPECIFICITY.SUB,
    definition:
      "Long-standing reduction in kidney structure or function. Relevant through altered clearance of anesthetic and analgesic drugs, fluid and electrolyte balance, acid-base status, anaemia, and the need for a functioning fistula or shunt to be protected.",
    aliases: "ckd chronic kidney disease renal failure dialysis esrd",
  },
  {
    code: "3A00",
    display: "Iron deficiency anaemia",
    specificity: SPECIFICITY.SUB,
    definition:
      "Anaemia due to insufficient iron for haemoglobin synthesis. Relevant through reduced oxygen-carrying capacity, transfusion planning and optimisation before elective surgery.",
    aliases: "anaemia anemia iron deficiency low haemoglobin hb",
  },
  {
    code: "3A51",
    display: "Sickle cell disorder",
    specificity: SPECIFICITY.SUB,
    definition:
      "Inherited haemoglobinopathy with sickling of red cells. Relevant through sickling risk with hypoxaemia, hypothermia, dehydration, acidosis and stasis, and the need for warm, well-hydrated, well-oxygenated perioperative care.",
    aliases: "sickle cell scd anaemia haemoglobinopathy",
  },
  {
    code: "8A61",
    display: "Epilepsy",
    specificity: SPECIFICITY.SUB,
    definition:
      "An enduring predisposition to recurrent unprovoked seizures. Relevant through continuation of anticonvulsant therapy, interaction with anesthetic agents, and the risk of perioperative seizures.",
    aliases: "epilepsy seizures anticonvulsant antiepileptic",
  },
  {
    code: "6B00",
    display: "Generalised anxiety disorder",
    specificity: SPECIFICITY.SUB,
    definition:
      "Persistent excessive anxiety with physiological arousal. Relevant to premedication planning, the patient's experience of anesthesia and the interpretation of tachycardia and hypertension.",
    aliases: "anxiety anxious nervous panic",
  },
  {
    code: "1B10",
    display: "Tuberculosis",
    specificity: SPECIFICITY.SUB,
    definition:
      "Infection with Mycobacterium tuberculosis. Relevant through infection-prevention measures in the anesthetizing location, respiratory isolation requirements and lung function.",
    aliases: "tuberculosis tb mycobacterium",
  },
  {
    code: "2A00-2F5Z",
    display: "Malignant neoplasms",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Malignant disease. Relevant through site and stage of disease, treatments given (surgery, radiotherapy, chemotherapy and their organ toxicity), airway involvement, frailty and goals of care.",
    aliases: "cancer malignancy tumour neoplasm oncology carcinoma",
  },
  {
    code: "5A00-5A2Z",
    display: "Diseases of thyroid gland",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Thyroid disease, including goitre and structural thyroid enlargement. Relevant through airway compression or tracheal deviation, position for airway management and the functional thyroid status.",
    aliases: "goitre goiter thyroid swelling thyroid disease",
  },
  {
    code: "6A00-6E8Z",
    display: "Mental, behavioural or neurodevelopmental disorders",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "A block code covering mental, behavioural and neurodevelopmental disorders. Relevant through capacity and consent, premedication, drug interactions, postoperative delirium risk and communication needs.",
    aliases: "psychiatric mental behavioural neurodevelopmental cognitive",
  },
  {
    code: "FA20",
    display: "Rheumatoid arthritis",
    specificity: SPECIFICITY.BLOCK,
    definition:
      "Chronic inflammatory polyarthritis with possible cervical spine and temporomandibular involvement. Relevant through atlantoaxial instability and airway manipulation, positioning, and continuation of disease-modifying therapy.",
    aliases: "rheumatoid arthritis cervical spine atlantoaxial tmj",
  },
];