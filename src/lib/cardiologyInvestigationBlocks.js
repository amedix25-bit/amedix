// Structured cardiology investigations and validated scores, as note sections.
//
// Kept in its own module so the cardiology template additions stay readable: this
// file owns the four blocks that document an investigation (ECG, echocardiogram,
// laboratory trends) and the clinical-score block, and cardiologyDocuments.js
// decides which note type receives which block.
//
// Every block is one structured field. The measurements, the score variables and
// the review of abnormal results are stored as structured values — not as a
// sentence — so they stay comparable over time, appear in the note's PDF and can
// be audited against the original instrument.

const sec = (section, fields) => fields.map((f) => ({ ...f, section }));

export const structuredEcg = () =>
  sec("Structured ECG Documentation", [
    {
      key: "cardio_ecg",
      label: "12-lead ECG — structured documentation",
      type: "cardio_ecg",
    },
  ]);

// `omit` lets the Echocardiography Report skip the fields its own template
// already collects, so nothing is asked twice. `showIf` makes the whole block
// conditional — in the consultation it appears only once an echocardiogram has
// actually been reviewed, so no note shows an empty measurement panel.
export const structuredEcho = (omit = [], showIf = null) =>
  sec("Echocardiography — Structured Findings", [
    {
      key: "cardio_echo",
      label: "Echocardiogram — structured measurements and valve assessment",
      type: "cardio_echo",
      omit,
      ...(showIf ? { showIf } : {}),
    },
  ]);

export const structuredLabs = () =>
  sec("Cardiac Biomarkers and Trends", [
    {
      key: "cardio_labs",
      label: "Cardiac biomarkers, renal function, electrolytes and lipids — structured documentation and trends",
      type: "cardio_labs",
    },
  ]);

export const scoresBlock = () =>
  sec("Clinical Scores and Classification", [
    {
      key: "cardiology_scores",
      label:
        "Validated scores — HEART, GRACE, TIMI, CHA₂DS₂-VA, HAS-BLED, DAPT, PRECISE-DAPT, ACC/AHA stage",
      type: "cardio_scores",
    },
  ]);