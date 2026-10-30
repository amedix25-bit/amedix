// ISNCSCI / ASIA impairment scale engine.
//
// WHAT THIS CALCULATES — AND WHAT IT REFUSES TO
//   It sums the documented key-muscle grades (UEMS, LEMS, total motor score), the
//   light-touch and pin-prick scores, derives the sensory and motor levels per
//   side, the neurological level of injury (the most rostral of the four), and
//   the AIS grade by the published rule. Every number shown is a sum of what the
//   examiner entered.
//
//   It REFUSES to classify when the input is incomplete: if any key muscle or
//   dermatome is untested or not testable, no motor/sensory total is shown and no
//   AIS grade is produced. The standard resolves "not testable" muscles by a
//   substitution rule that depends on the examiner's findings; guessing that
//   substitution inside the app would put a fabricated number in a clinical
//   record, so the panel names what is missing instead.
//
// LIMITATIONS CARRIED WITH EVERY RESULT
//   - The examination must be performed as the International Standards require
//     (supine, standard key muscles and dermatomes, standard grading).
//   - AIS E describes a normal examination in a patient with a previously
//     documented deficit; a normal examination in someone never injured is not
//     an AIS E.
//   - The scale describes impairment, not function, pain, spasticity or
//     prognosis.
//   - In young or uncooperative children the examination may be untestable; the
//     result is then not classifiable rather than abnormal.

export const ISNCSCI_LIMITATIONS = [
  "Valid only when examined as the International Standards require: supine, the standard key muscles and dermatomes, the standard 0–5 and 0–2 grading.",
  "AIS E is a normal examination in a patient with a previously documented spinal cord deficit — never the label for a normal examination in an uninjured patient.",
  "Describes sensory and motor impairment only: not pain, spasticity, bladder function, function or prognosis.",
  "A 'not testable' key muscle must be resolved by the standard substitution rule by the examiner; totals and the AIS grade are withheld here until it is.",
  "In young or uncooperative children the examination may be untestable — record that, rather than recording zero.",
];

export const ISNCSCI_MOTOR = [
  { key: "c5", level: "C5", label: "C5 — Elbow flexors (biceps, brachialis)" },
  { key: "c6", level: "C6", label: "C6 — Wrist extensors (ECRL, ECRB)" },
  { key: "c7", level: "C7", label: "C7 — Elbow extensors (triceps)" },
  { key: "c8", level: "C8", label: "C8 — Finger flexors (FDP, middle finger)" },
  { key: "t1", level: "T1", label: "T1 — Finger abductors (abductor digiti minimi)" },
  { key: "l2", level: "L2", label: "L2 — Hip flexors (iliopsoas)" },
  { key: "l3", level: "L3", label: "L3 — Knee extensors (quadriceps)" },
  { key: "l4", level: "L4", label: "L4 — Ankle dorsiflexors (tibialis anterior)" },
  { key: "l5", level: "L5", label: "L5 — Long toe extensors (EHL)" },
  { key: "s1", level: "S1", label: "S1 — Ankle plantar flexors (gastrocnemius, soleus)" },
];

export const ISNCSCI_UPPER = ISNCSCI_MOTOR.slice(0, 5);
export const ISNCSCI_LOWER = ISNCSCI_MOTOR.slice(5);

export const ISNCSCI_DERMATOMES = [
  "C2", "C3", "C4", "C5", "C6", "C7", "C8",
  "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12",
  "L1", "L2", "L3", "L4", "L5", "S1", "S2", "S3", "S4–5",
];

// Anatomical order used to compare the four levels and to count segments.
const ORDER = [
  "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8",
  "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12",
  "L1", "L2", "L3", "L4", "L5", "S1", "S2", "S3", "S4–5",
];
const idx = (level) => ORDER.indexOf(level);

export const ISNCSCI_GRADES = ["5", "4", "3", "2", "1", "0", "NT"];
export const ISNCSCI_SENSORY = ["2", "1", "0", "NT"];
export const ISNCSCI_SACRAL_STATE = ["Present", "Absent", "Not tested"];

const grade = (v) => {
  const s = String(v ?? "").trim();
  if (s === "NT" || s === "") return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};

const sensory = (v) => {
  const s = String(v ?? "").trim();
  if (s === "NT" || s === "") return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};

const sumOf = (obj, keys) => {
  let total = 0;
  for (const k of keys) {
    const n = grade(obj?.[k]);
    if (n === null) return null;
    total += n;
  }
  return total;
};

const sensoryTotal = (obj) => {
  let total = 0;
  for (const d of ISNCSCI_DERMATOMES) {
    const n = sensory(obj?.[d]);
    if (n === null) return null;
    total += n;
  }
  return total;
};

// Most caudal segment at which sensation is normal (2) and every segment above
// it on that side is also normal — the standard definition of a sensory level.
const sensoryLevel = (lt, pp, side) => {
  let level = null;
  for (const d of ISNCSCI_DERMATOMES) {
    const l = sensory(lt?.[`${side}_${d}`]);
    const p = sensory(pp?.[`${side}_${d}`]);
    if (l === 2 && p === 2) level = d;
    else break;
  }
  return level;
};

// Most caudal key muscle graded 3 or more with every more rostral key muscle on
// that side graded 5. A muscle graded 3 or 4 ends the chain but is itself the
// motor level.
const motorLevel = (motor, side) => {
  let last = null;
  for (const m of ISNCSCI_MOTOR) {
    const g = grade(motor?.[`${side}_${m.key}`]);
    if (g === null) break;
    if (g >= 3) last = m.level;
    if (g !== 5) break;
  }
  return last;
};

const caudal = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  return idx(a) >= idx(b) ? a : b;
};
const rostral = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  return idx(a) <= idx(b) ? a : b;
};

export function computeIsncsci(value) {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const motor = v.motor || {};
  const lt = v.light_touch || {};
  const pp = v.pin_prick || {};
  const sacral = v.sacral || {};

  const upperKeys = ISNCSCI_UPPER.map((m) => m.key);
  const lowerKeys = ISNCSCI_LOWER.map((m) => m.key);

  const missing = [];
  const checkMotor = (side) => {
    const missingKeys = ISNCSCI_MOTOR.filter((m) => grade(motor[`${side}_${m.key}`]) === null).map(
      (m) => `${side === "r" ? "right" : "left"} ${m.level}`
    );
    if (missingKeys.length) missing.push(...missingKeys);
  };
  const checkSensory = (side, obj, label) => {
    const missingSeg = ISNCSCI_DERMATOMES.filter((d) => sensory(obj[`${side}_${d}`]) === null);
    if (missingSeg.length) missing.push(`${label} (${side === "r" ? "right" : "left"}): ${missingSeg.join(", ")}`);
  };
  checkMotor("r");
  checkMotor("l");
  checkSensory("r", lt, "light touch");
  checkSensory("l", lt, "light touch");
  checkSensory("r", pp, "pin prick");
  checkSensory("l", pp, "pin prick");
  if (String(sacral.dap || "") === "" || String(sacral.dap || "") === "Not tested") {
    missing.push("deep anal pressure");
  }

  const uemsR = sumOf(motor, upperKeys.map((k) => `r_${k}`));
  const uemsL = sumOf(motor, upperKeys.map((k) => `l_${k}`));
  const lemsR = sumOf(motor, lowerKeys.map((k) => `r_${k}`));
  const lemsL = sumOf(motor, lowerKeys.map((k) => `l_${k}`));
  const uems = uemsR === null || uemsL === null ? null : uemsR + uemsL;
  const lems = lemsR === null || lemsL === null ? null : lemsR + lemsL;
  const motorTotal = uems === null || lems === null ? null : uems + lems;

  const ltR = sensoryTotal(Object.fromEntries(ISNCSCI_DERMATOMES.map((d) => [d, lt[`r_${d}`]])));
  const ltL = sensoryTotal(Object.fromEntries(ISNCSCI_DERMATOMES.map((d) => [d, lt[`l_${d}`]])));
  const ppR = sensoryTotal(Object.fromEntries(ISNCSCI_DERMATOMES.map((d) => [d, pp[`r_${d}`]])));
  const ppL = sensoryTotal(Object.fromEntries(ISNCSCI_DERMATOMES.map((d) => [d, pp[`l_${d}`]])));
  const lightTouchTotal = ltR === null || ltL === null ? null : ltR + ltL;
  const pinPrickTotal = ppR === null || ppL === null ? null : ppR + ppL;

  const sensoryLevelR = sensoryLevel(lt, pp, "r");
  const sensoryLevelL = sensoryLevel(lt, pp, "l");

  // Above C5 there is no key muscle: the standards set the motor level to the
  // sensory level for a cervical injury that spares all key muscles.
  const aboveKeyMuscles = (sensoryLevel, level) =>
    sensoryLevel && idx(sensoryLevel) < idx("C5") && (!level || idx(level) > idx(sensoryLevel))
      ? sensoryLevel
      : level;

  const motorLevelR = aboveKeyMuscles(sensoryLevelR, motorLevel(motor, "r"));
  const motorLevelL = aboveKeyMuscles(sensoryLevelL, motorLevel(motor, "l"));

  const nli = [sensoryLevelR, sensoryLevelL, motorLevelR, motorLevelL]
    .filter(Boolean)
    .reduce((acc, l) => rostral(acc, l), null);

  // Sacral sparing — the S4–5 sensory scores and the deep anal pressure, with
  // voluntary anal contraction recorded separately as motor sparing.
  const sacralSensory = [
    sensory(lt["r_S4–5"]),
    sensory(lt["l_S4–5"]),
    sensory(pp["r_S4–5"]),
    sensory(pp["l_S4–5"]),
  ]
    .filter((n) => n !== null)
    .some((n) => n >= 1);
  const dap = String(sacral.dap || "");
  const vac = String(sacral.vac || "");
  const sacralSparing = sacralSensory || dap === "Present" || vac === "Present";

  let ais = null;
  let aisRule = "";
  const examComplete = missing.length === 0;

  if (examComplete && motorTotal !== null) {
    const allNormal =
      ISNCSCI_MOTOR.every((m) => grade(motor[`r_${m.key}`]) === 5 && grade(motor[`l_${m.key}`]) === 5) &&
      ISNCSCI_DERMATOMES.every((d) => sensory(lt[`r_${d}`]) === 2 && sensory(lt[`l_${d}`]) === 2 &&
        sensory(pp[`r_${d}`]) === 2 && sensory(pp[`l_${d}`]) === 2);

    const motorMoreThanThreeBelow = ["r", "l"].some((side) => {
      const ml = side === "r" ? motorLevelR : motorLevelL;
      if (!ml) return false;
      return ISNCSCI_MOTOR.some((m) => {
        const g = grade(motor[`${side}_${m.key}`]);
        return g !== null && g >= 1 && idx(m.level) > idx(ml) + 3;
      });
    });

    if (allNormal) {
      ais = "E";
      aisRule =
        "AIS E — motor and sensory examination normal. This is only AIS E where a deficit was previously documented; record that previous deficit.";
    } else if (!sacralSparing && dap === "Absent" && vac !== "Present") {
      // Completeness is decided by sacral sparing alone — a complete injury is
      // AIS A even when no normal segment above the lesion was recorded.
      ais = "A";
      aisRule = "AIS A — no sacral sparing: S4–5 sensation absent and deep anal pressure absent.";
    } else if (nli && (vac === "Present" || motorMoreThanThreeBelow)) {
      const below = ISNCSCI_MOTOR.filter((m) => idx(m.level) > idx(nli));
      const perSide = below.length;
      const preserved = ["r", "l"].reduce(
        (n, side) => n + below.filter((m) => (grade(motor[`${side}_${m.key}`]) ?? 0) >= 3).length,
        0
      );
      const totalBelow = perSide * 2;
      if (totalBelow > 0 && preserved >= totalBelow / 2) {
        ais = "D";
        aisRule = `AIS D — motor incomplete: ${preserved} of ${totalBelow} key muscles below the NLI graded 3 or more (at least half).`;
      } else {
        ais = "C";
        aisRule = `AIS C — motor incomplete: ${preserved} of ${totalBelow} key muscles below the NLI graded 3 or more (less than half).`;
      }
    } else if (nli) {
      ais = "B";
      aisRule = "AIS B — sensory incomplete: sacral sensation preserved with no motor preservation more than three levels below the motor level.";
    }
  }

  const levelSummary = {
    sensory_right: sensoryLevelR,
    sensory_left: sensoryLevelL,
    motor_right: motorLevelR,
    motor_left: motorLevelL,
    nli,
  };

  const result = {
    uems,
    lems,
    motorTotal,
    lightTouchTotal,
    pinPrickTotal,
    sacral_sparing: sacralSparing,
    ais,
    ais_rule: aisRule,
    levels: levelSummary,
    complete: examComplete,
    missing,
    limitations: ISNCSCI_LIMITATIONS,
  };
  return result;
}

export function formatIsncsci(value) {
  const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const r = computeIsncsci(v);
  const lines = [
    `ISNCSCI motor score: ${r.motorTotal === null ? "not calculable — examination incomplete" : `${r.motorTotal}/100 (UEMS ${r.uems ?? "—"}/50, LEMS ${r.lems ?? "—"}/50)`}`,
    `Light touch: ${r.lightTouchTotal === null ? "not calculable" : `${r.lightTouchTotal}/112`} · Pin prick: ${r.pinPrickTotal === null ? "not calculable" : `${r.pinPrickTotal}/112`}`,
    `Sensory level: right ${r.levels.sensory_right || "not determinable"} · left ${r.levels.sensory_left || "not determinable"}`,
    `Motor level: right ${r.levels.motor_right || "not determinable"} · left ${r.levels.motor_left || "not determinable"}`,
    `Neurological level of injury (most rostral): ${r.levels.nli || "not determinable"}`,
    `Sacral sparing: ${r.sacral_sparing ? "present as documented" : "not documented as present"}`,
    `AIS grade: ${r.ais ? `${r.ais} — ${r.ais_rule}` : "not classified — the examination is incomplete or the levels cannot be determined"}`,
  ];
  if (r.missing.length) lines.push(`Not documented: ${r.missing.join("; ")} — no total is estimated.`);
  lines.push("Limitations:", ...r.limitations.map((l) => `- ${l}`));
  if (String(v.clinician_note || "").trim()) lines.push(`Clinician note: ${String(v.clinician_note).trim()}`);
  return lines.join("\n");
}