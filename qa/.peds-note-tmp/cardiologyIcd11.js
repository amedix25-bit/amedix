// Cardiology ICD-11 MMS reference catalogue.
//
// Every code and display term below was read from the ICD-11 MMS tabulation for
// Chapter 11 — Diseases of the circulatory system (release 2026-01) and copied
// verbatim, including WHO's own wording. Codes that were not read from the
// tabulation are NOT offered: a clinician can always add a code from the WHO
// browser, and such an entry is stored as REVIEW REQUIRED until it is checked
// against the catalogue. The app never completes or guesses a code.
//
// Scope — the cardiovascular content a Cardiology note documents:
//   ischaemic · acute coronary syndrome · heart failure · hypertension ·
//   supraventricular arrhythmia · ventricular arrhythmia · conduction ·
//   cardiac arrest · mitral valve · aortic valve · other valve ·
//   myocardial disease · pericardium · infective endocarditis ·
//   pulmonary circulation · peripheral arterial disease · venous disease ·
//   congenital heart anomaly
//
// Deliberately NOT included, and stated rather than silently omitted:
//  - Structural congenital lesions beyond the two categories read below. They
//    sit in Chapter 20, and a lesion-level code must be taken from the WHO
//    browser so an incomplete congenital code is never applied to a patient.
//  - Postcoordination detail (culprit vessel, wall involved, HF phenotype added
//    to an MI, prosthetic valve detail). WHO carries these as postcoordination
//    axes, and the note records them in its own structured fields rather than
//    rewriting the stem code.
//  - Neoplasm and vasculitis codes: coded by the oncology / rheumatology
//    services.
//
// A code is never a diagnosis. The field records role, status, mapping state and
// the clinician's documented basis, and only a clinician confirms a diagnosis.

export const CARDIOLOGY_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2026-01",
  label: "ICD-11 MMS",
  chapter: "Chapter 11 — Diseases of the circulatory system",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  source_url: "https://icd.who.int/browse/2026-01/mms/en",
  retrieved: "2026-10-30",
  read_from: "ICD-11 MMS tabulation, Chapter 11 (category and subcategory entries)",
};

export const CARDIOLOGY_ICD11_DOMAINS = {
  ischaemic: "Chronic ischaemic heart disease and angina",
  acs: "Acute coronary syndrome and myocardial infarction",
  hf: "Heart failure (including phenotype by ejection fraction)",
  hypertension: "Hypertensive diseases",
  svt: "Supraventricular arrhythmia",
  vt: "Ventricular arrhythmia",
  conduction: "Conduction disorders and accessory pathways",
  arrest: "Cardiac arrest and sudden arrhythmic death",
  valve_mitral: "Mitral valve disease",
  valve_aortic: "Aortic valve disease",
  valve_other: "Multiple, prosthetic and other valve disease",
  myocardium: "Myocarditis, cardiomyopathy and myocardial disease",
  pericardium: "Pericardial disease",
  endocarditis: "Acute or subacute endocarditis",
  pulmonary: "Pulmonary circulation and pulmonary heart disease",
  arterial: "Diseases of arteries or arterioles",
  venous: "Diseases of veins and venous thromboembolism",
  congenital: "Structural developmental anomalies of the circulation",
};

// code | official display term | domain | primary tabulation entry (1 = yes)
const RAW = [
  // ---- Chronic ischaemic heart disease and angina ---------------------------
  "BA40|Angina pectoris|ischaemic|1",
  "BA43|Coronary thrombosis not resulting in myocardial infarction|ischaemic|1",
  "BA50|Old myocardial infarction|ischaemic|1",
  "BA51|Ischaemic cardiomyopathy|ischaemic|1",
  "BA52|Coronary atherosclerosis|ischaemic|1",
  "BA5Y|Other specified chronic ischaemic heart disease|ischaemic|1",
  "BA5Z|Chronic ischaemic heart disease, unspecified|ischaemic|1",

  // ---- Acute coronary syndrome ---------------------------------------------
  "BA41|Acute myocardial infarction|acs|1",
  "BA41.0|Acute ST elevation myocardial infarction|acs|1",
  "BA41.1|Acute non-ST elevation myocardial infarction|acs|1",
  "BA41.Z|Acute myocardial infarction, unspecified|acs|1",
  "BA42|Subsequent myocardial infarction|acs|1",
  "BA4Z|Acute ischaemic heart disease, unspecified|acs|1",
  "BE21|Thromboembolism, so stated|acs|0",

  // ---- Heart failure -------------------------------------------------------
  "BD10|Congestive heart failure|hf|1",
  "BD11|Left ventricular failure|hf|1",
  "BD11.0|Left ventricular failure with preserved ejection fraction|hf|1",
  "BD11.1|Left ventricular failure with mid range ejection fraction|hf|1",
  "BD11.2|Left ventricular failure with reduced ejection fraction|hf|1",
  "BD11.Z|Left ventricular failure, unspecified|hf|1",
  "BD12|High output syndromes|hf|1",
  "BD13|Right ventricular failure|hf|1",
  "BD14|Biventricular failure|hf|1",
  "BD1Y|Other specified heart failure|hf|1",
  "BD1Z|Heart failure, unspecified|hf|1",

  // ---- Hypertensive diseases -----------------------------------------------
  "BA00|Essential hypertension|hypertension|1",
  "BA01|Hypertensive heart disease|hypertension|1",
  "BA02|Hypertensive renal disease|hypertension|1",
  "BA03|Hypertensive crisis|hypertension|1",
  "BA04|Secondary hypertension|hypertension|1",

  // ---- Supraventricular arrhythmia -----------------------------------------
  "BC60|Atrial premature depolarization|svt|1",
  "BC61|Junctional premature depolarization|svt|1",
  "BC80|Supraventricular bradyarrhythmia|svt|1",
  "BC81|Supraventricular tachyarrhythmia|svt|1",
  "BC81.0|Ectopic atrial tachycardia|svt|1",
  "BC81.1|Junctional ectopic tachycardia|svt|1",
  "BC81.2|Macro reentrant atrial tachycardia|svt|1",
  "BC81.3|Atrial fibrillation|svt|1",
  "BC81.4|Wolff-Parkinson-White syndrome|svt|1",
  "BC81.5|Sinus node reentrant tachycardia|svt|1",
  "BC81.6|Inappropriate sinus tachycardia|svt|1",
  "BC81.7|Atrioventricular reciprocating tachycardia|svt|1",
  "BC81.8|Atrioventricular nodal reentry tachycardia|svt|1",
  "BC81.Y|Other specified supraventricular tachyarrhythmia|svt|1",
  "BC81.Z|Supraventricular tachyarrhythmia, unspecified|svt|1",
  "BC90|Rhythm disturbance at level of atrioventricular junction|svt|1",
  "BC9Y|Other specified cardiac arrhythmia|svt|1",
  "BC9Z|Cardiac arrhythmia, unspecified|svt|1",

  // ---- Ventricular arrhythmia ----------------------------------------------
  "BC70|Ventricular premature depolarization|vt|1",
  "BC71|Ventricular tachyarrhythmia|vt|1",
  "BC71.0|Ventricular tachycardia|vt|1",
  "BC71.1|Ventricular fibrillation|vt|1",
  "BC71.2|Re-entry ventricular arrhythmia|vt|1",
  "BC71.Y|Other specified ventricular tachyarrhythmia|vt|1",
  "BC71.Z|Ventricular tachyarrhythmia, unspecified|vt|1",
  "BC7Y|Other specified ventricular rhythm disturbance|vt|1",
  "BC7Z|Ventricular rhythm disturbance, unspecified|vt|1",

  // ---- Conduction disorders ------------------------------------------------
  "BC62|Accessory pathway|conduction|1",
  "BC63|Conduction disorders|conduction|1",
  "BC63.0|Atrioventricular block, first degree|conduction|1",
  "BC63.1|Atrioventricular block, second degree|conduction|1",
  "BC63.2|Complete atrioventricular block|conduction|1",
  "BC63.3|Right bundle branch block|conduction|1",
  "BC63.4|Left bundle branch block|conduction|1",
  "BC63.5|Nonspecific intraventricular conduction delay|conduction|1",
  "BC63.Y|Other specified conduction disorders|conduction|1",
  "BC63.Z|Conduction disorders, unspecified|conduction|1",

  // ---- Cardiac arrest ------------------------------------------------------
  "BC64|Sudden arrhythmic death syndrome|arrest|1",
  "BC65|Cardiac arrhythmia associated with genetic disorder|arrest|1",
  "MC82|Cardiac arrest|arrest|1",

  // ---- Mitral valve --------------------------------------------------------
  "BB60|Mitral valve stenosis|valve_mitral|1",
  "BB61|Mitral valve insufficiency|valve_mitral|1",
  "BB62|Mitral valve prolapse|valve_mitral|1",
  "BB63|Mitral valve stenosis with insufficiency|valve_mitral|1",
  "BB64|Mitral valvar abscess|valve_mitral|1",
  "BB65|Mitral valve rupture|valve_mitral|1",
  "BB6Y|Other specified mitral valve disease|valve_mitral|1",
  "BB6Z|Mitral valve disease, unspecified|valve_mitral|1",

  // ---- Aortic valve --------------------------------------------------------
  "BB70|Aortic valve stenosis|valve_aortic|1",
  "BB71|Aortic valve insufficiency|valve_aortic|1",
  "BB72|Aortic valve stenosis with insufficiency|valve_aortic|1",
  "BB73|Aortic valvar abscess|valve_aortic|1",
  "BB74|Aortic valvar prolapse|valve_aortic|1",
  "BB7Y|Other specified aortic valve disease|valve_aortic|1",
  "BB7Z|Aortic valve disease, unspecified|valve_aortic|1",

  // ---- Other valve disease -------------------------------------------------
  "BC00|Multiple valve disease|valve_other|1",
  "BC01|Prosthetic valve disease|valve_other|1",
  "BC02|Acquired abnormality of congenitally malformed valve|valve_other|1",
  "BC0Z|Heart valve diseases, unspecified|valve_other|1",

  // ---- Myocardium ----------------------------------------------------------
  "BC40|Acquired atrial abnormality|myocardium|1",
  "BC41|Acquired ventricular abnormality|myocardium|1",
  "BC42|Myocarditis|myocardium|1",
  "BC43|Cardiomyopathy|myocardium|1",
  "BC43.0|Dilated cardiomyopathy|myocardium|1",
  "BC43.1|Hypertrophic cardiomyopathy|myocardium|1",
  "BC43.2|Restrictive cardiomyopathy|myocardium|1",
  "BC43.3|Endocardial fibroelastosis|myocardium|1",
  "BC43.4|Cardiomyopathy due to drugs or other external agents|myocardium|1",
  "BC43.5|Stress-induced cardiomyopathy|myocardium|1",
  "BC43.6|Arrhythmogenic ventricular cardiomyopathy|myocardium|1",
  "BC43.7|Diabetic cardiomyopathy|myocardium|1",
  "BC43.Y|Other specified cardiomyopathy|myocardium|1",
  "BC43.Z|Cardiomyopathy, unspecified|myocardium|1",
  "BC44|Noncompaction cardiomyopathy|myocardium|1",
  "BC45|Cardiomegaly|myocardium|1",
  "BC46|Intracardiac thrombosis|myocardium|1",

  // ---- Pericardium ---------------------------------------------------------
  "BB20|Acute pericarditis|pericardium|1",
  "BB21|Chronic rheumatic pericarditis|pericardium|1",
  "BB22|Constrictive pericarditis|pericardium|1",
  "BB23|Cardiac tamponade|pericardium|1",
  "BB24|Haemopericardium|pericardium|1",
  "BB25|Pericardial effusion|pericardium|1",
  "BB2Y|Other specified pericarditis|pericardium|1",
  "BB2Z|Pericarditis, unspecified|pericardium|1",

  // ---- Endocarditis --------------------------------------------------------
  "BB40|Acute or subacute infectious endocarditis|endocarditis|1",
  "BB41|Myoendocarditis|endocarditis|1",
  "BB42|Periendocarditis|endocarditis|1",

  // ---- Pulmonary circulation ----------------------------------------------
  "BB00|Pulmonary thromboembolism|pulmonary|1",
  "BB01|Pulmonary hypertension|pulmonary|1",
  "BB02|Certain specified diseases of pulmonary vessels|pulmonary|1",
  "BB03|Acquired pulmonary venous abnormality|pulmonary|1",

  // ---- Arteries ------------------------------------------------------------
  "BD30|Acute arterial occlusion|arterial|1",
  "BD40|Atherosclerotic chronic arterial occlusive disease|arterial|1",
  "BD41|Non-atherosclerotic chronic arterial occlusive disease|arterial|1",
  "BD42|Raynaud phenomenon|arterial|1",
  "BD50|Aortic aneurysm or dissection|arterial|1",
  "BD51|Arterial aneurysm or dissection, excluding aorta|arterial|1",
  "BD52|Certain specified disorders of arteries or arterioles|arterial|1",
  "BD53|Secondary disorders of arteries or arterioles|arterial|1",
  "BD54|Diabetic foot ulcer|arterial|1",

  // ---- Veins ---------------------------------------------------------------
  "BD70|Superficial thrombophlebitis|venous|1",
  "BD71|Deep vein thrombosis|venous|1",
  "BD72|Venous thromboembolism|venous|1",
  "BD73|Acquired systemic vein abnormality|venous|1",
  "BD74|Chronic peripheral venous insufficiency of lower extremities|venous|1",

  // ---- Congenital (only the categories read from the tabulation) -----------
  "LA8A|Congenital anomaly of a ventriculo-arterial valve or adjacent regions|congenital|1",
  "LA8Y|Congenital heart block|congenital|1",
];

export const CARDIOLOGY_ICD11 = RAW.map((line) => {
  const [code, display, domain, primary] = line.split("|");
  const domainLabel = CARDIOLOGY_ICD11_DOMAINS[domain] || domain;
  const isPrimary = primary === "1";
  return {
    code,
    display,
    domain,
    domain_label: domainLabel,
    primary: isPrimary,
    system: CARDIOLOGY_ICD11_MMS.system,
    system_uri: CARDIOLOGY_ICD11_MMS.system_uri,
    release: CARDIOLOGY_ICD11_MMS.release,
    version: `${CARDIOLOGY_ICD11_MMS.label} ${CARDIOLOGY_ICD11_MMS.release}`,
    source: CARDIOLOGY_ICD11_MMS.source_url,
    browser: CARDIOLOGY_ICD11_MMS.browser_url,
    verified_date: CARDIOLOGY_ICD11_MMS.retrieved,
    precise: true,
    specificity: code.includes(".")
      ? "Subcategory — most specific"
      : "Block (stem) — select a subcategory when known",
    aliases: `${display} ${domainLabel}`,
    definition: isPrimary
      ? `WHO ICD-11 MMS category in ${domainLabel}. Inclusion and exclusion notes are not reproduced — confirm the exact category against the WHO browser before relying on a residual (…Y / …Z) code.`
      : `WHO carries this as a NON-primary tabulation entry. Document it together with the underlying condition, never instead of it. Category in ${domainLabel}.`,
  };
});

// Only the domains a given note can code, so a heart-failure note never suggests
// a conduction code.
export const cardiologyCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return CARDIOLOGY_ICD11;
  return CARDIOLOGY_ICD11.filter((i) => wanted.includes(i.domain));
};

export const CARDIOLOGY_ICD11_COUNT = CARDIOLOGY_ICD11.length;