// ENT (Otolaryngology) ICD-11 MMS reference catalogue.
//
// EVERY code and display term below was copied verbatim from the WHO ICD-11 MMS
// Simple Tabulation, release 2025-01 — the current release published by WHO:
//   https://icdcdn.who.int/static/releasefiles/2025-01/SimpleTabulation-ICD-11-MMS-en.xlsx
//   retrieved 2026-10-28; rows extracted by code (code + official title + chapter).
//
// Deliberately not included:
//  - Inclusion / exclusion notes: the Simple Tabulation does not carry them, and
//    the app never states an exclusion it could not verify. A clinician can always
//    add a code with its source from the WHO browser.
//  - Chapter 2 neoplasm codes: a neck mass must be coded with its histology from
//    the WHO browser, so no partial neoplasm code is offered.
//  - Postcoordination detail (laterality): recorded in the note Laterality field;
//    it does not change the stem code.
//
// A code is never a diagnosis. The field records role, status and clinical basis,
// and only a clinician confirms.

export const ENT_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2025-01",
  label: "ICD-11 MMS",
  browser_url: "https://icd.who.int/browse/2025-01/mms/en",
  source_url: "https://icdcdn.who.int/static/releasefiles/2025-01/SimpleTabulation-ICD-11-MMS-en.xlsx",
  retrieved: "2026-10-28",
};

export const ENT_ICD11_DOMAINS = {
  ear: "Ear and mastoid process",
  nose: "Nose, sinuses and rhinology",
  throat: "Pharynx, tonsils, larynx and voice",
  neck: "Neck",
  sleep: "Sleep-disordered breathing",
  symptom: "Symptom code — no diagnosis established",
};

// code | official display term | domain | residual (1 = …Y/…Z) | search aliases
const RAW = [
  "AA00|Abscess of external ear|ear|0|",
  "AA01|Cellulitis of external ear|ear|0|",
  "AA02|Malignant otitis externa|ear|0|",
  "AA03|Otomycosis|ear|0|",
  "AA04|Perichondritis of external ear|ear|0|",
  "AA10|Seborrhoeic otitis externa|ear|0|",
  "AA11|Acute noninfectious otitis externa|ear|0|",
  "AA13|Chronic otitis externa|ear|0|",
  "AA3Z|Otitis externa, unspecified|ear|1|",
  "AA40.0|Exostosis of external auditory canal|ear|0|",
  "AA40.1|Acquired stenosis of external auditory canal|ear|0|",
  "AA42|Impacted cerumen|ear|0|ear wax",
  "AA6Z|Diseases of external ear, unspecified|ear|1|",
  "AA80|Acute serous or mucoid otitis media|ear|0|OME, glue ear, serous otitis media",
  "AA81|Acute nonserous nonsuppurative otitis media|ear|0|OME, serous otitis media",
  "AA82|Chronic serous or mucoid otitis media|ear|0|chronic OME, glue ear",
  "AA83|Noninfected otitis media with effusion|ear|0|otitis media with effusion",
  "AA8Z|Nonsuppurative otitis media, unspecified|ear|1|OME, glue ear",
  "AA90|Acute suppurative otitis media|ear|0|AOM, acute suppurative otitis media",
  "AA91|Chronic suppurative otitis media|ear|0|CSOM, chronic suppurative otitis media",
  "AA91.0|Chronic tubotympanic suppurative otitis media|ear|0|tubotympanic CSOM, safe CSOM",
  "AA91.1|Chronic atticoantral suppurative otitis media|ear|0|atticoantral CSOM, unsafe CSOM",
  "AA91.2|Other chronic suppurative otitis media|ear|0|",
  "AA9Z|Suppurative otitis media, unspecified whether acute or chronic|ear|1|suppurative otitis media",
  "AB00|Acute otitis media|ear|0|",
  "AB01|Chronic otitis media|ear|0|",
  "AB0Z|Otitis media, unspecified|ear|1|",
  "AB10.1|Patulous Eustachian tube|ear|0|",
  "AB10.3|Obstruction of Eustachian tube|ear|0|",
  "AB11.0|Acute mastoiditis|ear|0|",
  "AB11.1|Chronic mastoiditis|ear|0|",
  "AB11.3|Mastoiditis, unspecified as acute or chronic|ear|0|",
  "AB12|Cholesteatoma of middle ear|ear|0|cholesteatoma of middle ear",
  "AB13|Perforation of tympanic membrane|ear|0|TM perforation, eardrum perforation, ruptured drum",
  "AB13.0|Central perforation of tympanic membrane|ear|0|central perforation",
  "AB13.1|Attic perforation of tympanic membrane|ear|0|attic perforation",
  "AB13.2|Other marginal perforations of tympanic membrane|ear|0|marginal perforation",
  "AB14|Acute myringitis|ear|0|",
  "AB15|Chronic myringitis|ear|0|",
  "AB16|Tympanosclerosis|ear|0|tympanosclerosis",
  "AB17|Adhesive middle ear disease|ear|0|",
  "AB18|Discontinuity or dislocation of ear ossicles|ear|0|ossicular discontinuity",
  "AB19|Acquired abnormalities of ear ossicles not related to discontinuity or dislocation|ear|0|ossicular fixation",
  "AB30|Acute vestibular syndrome|ear|0|AVS, acute vestibular syndrome",
  "AB30.0|Vestibular neuritis|ear|0|vestibular neuritis",
  "AB30.1|Labyrinthitis|ear|0|labyrinthitis",
  "AB31|Episodic vestibular syndrome|ear|0|EVS, episodic vertigo",
  "AB31.0|Meniere disease|ear|0|Meniere disease, endolymphatic hydrops",
  "AB31.1|Vestibular migraine|ear|0|vestibular migraine",
  "AB31.2|Benign positional paroxysmal vertigo|ear|0|BPPV, positional vertigo",
  "AB31.3|Superior canal dehiscence syndrome|ear|0|superior canal dehiscence",
  "AB31.6|Vestibular paroxysmia|ear|0|vestibular paroxysmia",
  "AB32|Chronic vestibular syndrome|ear|0|",
  "AB32.0|Persistent Postural-Perceptual Dizziness|ear|0|PPPD, persistent postural perceptual dizziness",
  "AB34.1|Other peripheral vertigo|ear|0|peripheral vertigo",
  "AB35|Labyrinthine fistula|ear|0|",
  "AB50|Congenital hearing impairment|ear|0|",
  "AB50.0|Congenital conductive hearing loss|ear|0|",
  "AB50.1|Congenital sensorineural hearing loss|ear|0|",
  "AB50.2|Congenital mixed conductive and sensorineural hearing loss|ear|0|",
  "AB51|Acquired hearing impairment|ear|0|hearing loss, deafness",
  "AB51.0|Acquired conductive hearing loss|ear|0|conductive hearing loss",
  "AB51.1|Acquired sensorineural hearing loss|ear|0|sensorineural hearing loss, SNHL",
  "AB51.2|Acquired mixed conductive and sensorineural hearing loss|ear|0|mixed hearing loss",
  "AB52|Deafness not otherwise specified|ear|0|deafness",
  "AB53|Ototoxic hearing loss|ear|0|ototoxic hearing loss",
  "AB54|Presbycusis|ear|0|presbycusis, age-related hearing loss",
  "AB55|Sudden idiopathic hearing loss|ear|0|SSNHL, sudden sensorineural hearing loss",
  "AB56|Hereditary hearing loss|ear|0|hereditary hearing loss",
  "AB57|Auditory synaptopathy or neuropathy|ear|0|auditory neuropathy",
  "AB90|Recurrent cholesteatoma of postmastoidectomy cavity|ear|0|",
  "AB93|Chronic inflammation of postmastoidectomy cavity|ear|0|",
  "CA00|Acute nasopharyngitis|nose|0|common cold, nasopharyngitis",
  "CA01|Acute sinusitis|nose|0|acute sinusitis, acute rhinosinusitis",
  "CA02|Acute pharyngitis|throat|0|sore throat, pharyngitis",
  "CA02.0|Acute bacterial pharyngitis|throat|0|bacterial pharyngitis, strep throat",
  "CA02.1|Acute viral pharyngitis|throat|0|viral pharyngitis",
  "CA03|Acute tonsillitis|throat|0|tonsillitis",
  "CA03.0|Streptococcal tonsillitis|throat|0|strep tonsillitis, GAS tonsillitis",
  "CA04|Acute laryngopharyngitis|throat|0|laryngopharyngitis",
  "CA05|Acute laryngitis or tracheitis|throat|0|laryngitis",
  "CA05.0|Acute laryngitis|throat|0|acute laryngitis",
  "CA05.2|Acute laryngotracheitis|throat|0|croup, laryngotracheitis",
  "CA06|Acute obstructive laryngitis or epiglottitis|throat|0|epiglottitis, croup",
  "CA06.0|Acute obstructive laryngitis|throat|0|croup, acute obstructive laryngitis",
  "CA08|Vasomotor or allergic rhinitis|nose|0|rhinitis, allergic rhinitis",
  "CA08.0|Allergic rhinitis|nose|0|hay fever, allergic rhinitis",
  "CA08.00|Allergic rhinitis due to pollen|nose|0|seasonal allergic rhinitis, pollinosis",
  "CA08.02|Allergic rhinitis due to house dust mite|nose|0|dust mite allergy rhinitis",
  "CA08.03|Other allergic rhinitis|nose|0|",
  "CA08.1|Non-allergic rhinitis|nose|0|non-allergic rhinitis",
  "CA08.2|Mixed rhinitis|nose|0|mixed rhinitis",
  "CA08.3|Vasomotor rhinitis|nose|0|vasomotor rhinitis",
  "CA09|Chronic rhinitis, nasopharyngitis or pharyngitis|nose|0|chronic rhinitis",
  "CA09.0|Chronic rhinitis|nose|0|chronic rhinitis",
  "CA09.1|Chronic nasopharyngitis|nose|0|chronic nasopharyngitis",
  "CA09.2|Chronic pharyngitis|throat|0|chronic pharyngitis",
  "CA0A|Chronic rhinosinusitis|nose|0|CRS, chronic rhinosinusitis",
  "CA0B|Silent sinus syndrome|nose|0|silent sinus syndrome",
  "CA0C|Cyst or mucocele of nose or nasal sinus|nose|0|mucocele of sinus",
  "CA0D|Deviated nasal septum|nose|0|DNS, deviated nasal septum",
  "CA0E|Hypertrophy of nasal turbinates|nose|0|turbinate hypertrophy, nasal obstruction",
  "CA0J|Nasal polyp|nose|0|nasal polyp, polyposis",
  "CA0J.0|Polypoid sinus degeneration|nose|0|polypoid sinus degeneration",
  "CA0F|Chronic diseases of tonsils or adenoids|throat|0|chronic tonsillar disease",
  "CA0F.0|Hypertrophy of tonsils|throat|0|tonsillar hypertrophy, enlarged tonsils",
  "CA0F.1|Hypertrophy of adenoids|throat|0|adenoid hypertrophy, enlarged adenoids",
  "CA0F.3|Hypertrophy of tonsils with hypertrophy of adenoids|throat|0|adenotonsillar hypertrophy",
  "CA0G|Chronic laryngitis or laryngotracheitis|throat|0|chronic laryngitis",
  "CA0H|Diseases of vocal cords or larynx, not elsewhere classified|throat|0|vocal cord lesion, laryngeal disease",
  "CA0H.0|Paralysis of vocal cords or larynx|throat|0|vocal cord palsy, vocal fold paralysis, VCP",
  "CA0H.1|Polyp of vocal cord or larynx|throat|0|vocal cord polyp",
  "CA0H.2|Nodules of vocal cords|throat|0|vocal cord nodules, singers nodules",
  "CA0H.4|Laryngeal spasm|throat|0|laryngospasm",
  "CA0K.0|Retropharyngeal or parapharyngeal abscess|throat|0|parapharyngeal abscess, retropharyngeal abscess",
  "DA04|Diseases of salivary glands|throat|0|salivary gland disease",
  "DA04.3|Abscess of salivary gland|throat|0|salivary abscess",
  "DA04.5|Mucocele of salivary gland|throat|0|mucocele, ranula",
  "DA09.61|Periapical abscess with sinus|throat|0|dental abscess, periapical abscess",
  "DA09.62|Periapical abscess without sinus|throat|0|",
  "1B51|Streptococcal pharyngitis|throat|0|strep throat, GAS pharyngitis, streptococcal pharyngitis",
  "1B12.2|Tuberculosis of ear|ear|0|tuberculous otitis media, TB ear",
  "7A41|Obstructive sleep apnoea|sleep|0|OSA, obstructive sleep apnoea, snoring with apnoea",
  "MD93|Dysphagia|symptom|0|dysphagia, difficulty swallowing",
  "MC41|Tinnitus|symptom|0|tinnitus, ringing in the ears",
  "MA82.10|Hoarseness|symptom|0|hoarseness, dysphonia, voice change",
  "MD20|Epistaxis|symptom|0|nosebleed, epistaxis",
  "MD35|Symptom or complaint of the sinus|symptom|0|sinus pain, sinus pressure",
  "MD11.9|Nasal congestion|symptom|0|nasal obstruction, blocked nose, congestion",
  "MD11.B|Stridor|symptom|0|stridor, noisy breathing",
  "ME61|Subcutaneous swelling, mass or lump of uncertain or unspecified nature|neck|0|neck lump, neck mass, swelling",
  "ME86.C|Symptom or complaint of the neck|neck|0|neck pain, neck discomfort, throat lump",
  "DD90.0|Globus|symptom|0|globus, lump in throat",
];

export const ENT_ICD11 = RAW.map((row) => {
  const [code, display, domain, residual, aliases] = row.trim().split("|");
  const isResidual = residual === "1";
  const scope = ENT_ICD11_DOMAINS[domain] || "ENT";
  return {
    code,
    display,
    domain,
    residual: isResidual,
    aliases,
    specificity: code.includes(".") ? "Subcategory — most specific" : "Block (stem) — select a subcategory when known",
    definition: isResidual
      ? scope + ". Residual code — use only when the specific type is not documented."
      : scope,
    release: ENT_ICD11_MMS.release,
  };
});

export const ENT_ICD11_BY_CODE = Object.fromEntries(ENT_ICD11.map((item) => [item.code, item]));

// Catalogue slice for a note type that documents only some domains.
export const entCatalogFor = (domains) => {
  const wanted = [].concat(domains);
  return ENT_ICD11.filter((item) => wanted.includes(item.domain));
};

export const isResidualEntCode = (code) => Boolean(ENT_ICD11_BY_CODE[code]?.residual);