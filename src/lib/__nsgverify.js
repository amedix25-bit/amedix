import { NEUROSURGERY_DOCS } from "@/lib/neurosurgeryDocuments";
import { noteSourcesFor, guidelineBasisLabels } from "@/lib/neurosurgeryReferences";
import { formatNeurosurgicalExam } from "@/lib/neurosurgeryExam";
import { computeIsncsci, ISNCSCI_MOTOR, ISNCSCI_DERMATOMES } from "@/lib/neurosurgeryIsncsci";
import { calculateScore, indicatedScores, formatNeurosurgeryScores } from "@/lib/neurosurgeryScores";
import { buildNeurosurgerySafetyPrompts } from "@/lib/neurosurgerySafetyRules";
import { codingInstructionsFor } from "@/lib/neurosurgeryCoding";

let pass = 0;
const fails = [];
const ok = (c, m) => (c ? pass++ : fails.push(m));

// ---- documents ------------------------------------------------------------
const keys = NEUROSURGERY_DOCS.map((d) => d.key);
ok(new Set(keys).size === keys.length, "unique note keys");
ok(keys.length === 17, `17 note types (${keys.length})`);

NEUROSURGERY_DOCS.forEach((doc) => {
  const fk = doc.fields.map((f) => f.key);
  ok(new Set(fk).size === fk.length, `${doc.key}: duplicate field key`);
  ok(doc.fields.some((f) => f.type === "nsg_guidance"), `${doc.key}: guidance block`);
  ok(doc.fields.some((f) => f.type === "icd11_diagnoses"), `${doc.key}: ICD-11 block`);
  ok(guidelineBasisLabels(doc.key).length > 0, `${doc.key}: guidelineBasis resolved`);
  ok(codingInstructionsFor(doc.key).length > 0, `${doc.key}: coding instructions`);
  ok(noteSourcesFor(doc.key).documents.length > 0, `${doc.key}: attributed sources`);
  const operative = /operative|discharge/.test(doc.key);
  if (!operative) {
    ok(doc.fields.some((f) => f.key === "differential" && f.required), `${doc.key}: required differential`);
    ok(doc.fields.some((f) => f.type === "nsg_exam"), `${doc.key}: structured neurological examination`);
  }
});

["nsg_consultation", "nsg_spine", "nsg_cerebrovascular", "nsg_neuro_oncology", "nsg_aneurysm_avm", "nsg_spinal_cord", "nsg_spinal_tumour", "nsg_functional", "nsg_peripheral_nerve", "nsg_icp"].forEach(
  (k) => {
    const doc = NEUROSURGERY_DOCS.find((d) => d.key === k);
    ok(doc?.fields.some((f) => f.type === "nsg_scores"), `${k}: scores block`);
  }
);
ok(
  NEUROSURGERY_DOCS.find((d) => d.key === "nsg_neurotrauma")?.fields.some((f) => f.type === "nsg_isncsci"),
  "neurotrauma: ISNCSCI block"
);
ok(
  NEUROSURGERY_DOCS.find((d) => d.key === "nsg_spinal_cord")?.fields.some((f) => f.type === "nsg_isncsci"),
  "spinal cord: ISNCSCI block"
);

// ---- ISNCSCI --------------------------------------------------------------
const build = (motorFor, sensoryFor, sacral) => {
  const motor = {};
  ISNCSCI_MOTOR.forEach((m) => {
    motor[`r_${m.key}`] = motorFor(m);
    motor[`l_${m.key}`] = motorFor(m);
  });
  const lt = {};
  const pp = {};
  ISNCSCI_DERMATOMES.forEach((d) => {
    const v = sensoryFor(d);
    lt[`r_${d}`] = v;
    lt[`l_${d}`] = v;
    pp[`r_${d}`] = v;
    pp[`l_${d}`] = v;
  });
  return { motor, light_touch: lt, pin_prick: pp, sacral: sacral || { dap: "Absent", vac: "Absent" } };
};

const allZero = computeIsncsci(build(() => "0", () => "0", { dap: "Absent", vac: "Absent" }));
ok(allZero.complete, "complete examination detected");
ok(allZero.ais === "A", `AIS A for no sacral sparing (${allZero.ais})`);
ok(allZero.motorTotal === 0, "motor total 0");

const normal = computeIsncsci(build(() => "5", () => "2", { dap: "Present", vac: "Present" }));
ok(normal.motorTotal === 100, `motor total 100 (${normal.motorTotal})`);
ok(normal.lightTouchTotal === 112 && normal.pinPrickTotal === 112, "sensory totals 112");
ok(normal.ais === "E", `AIS E for normal examination (${normal.ais})`);

const missing = build(() => "3", () => "1", { dap: "Absent", vac: "Absent" });
delete missing.motor.r_c5;
const incomplete = computeIsncsci(missing);
ok(!incomplete.complete, "incomplete examination detected");
ok(incomplete.ais === null, "no AIS grade for incomplete examination");
ok(incomplete.missing.some((m) => /right C5/.test(m)), "missing item named");

const incompleteMotor = (fromC8) =>
  build((m) => {
    if (["c5", "c6", "c7"].includes(m.key)) return "5";
    if (fromC8 === "zero" && ["c8", "t1"].includes(m.key)) return "0";
    if (fromC8 === "zero") return "4";
    if (fromC8 === "two") return "2";
    return "4";
  }, (d) => (d === "S4–5" ? "1" : "2"), { dap: "Present", vac: "Present" });

const aisD = computeIsncsci(incompleteMotor("zero"));
ok(aisD.ais === "D", `AIS D for at least half preserved (${aisD.ais})`);
const aisC = computeIsncsci(incompleteMotor("two"));
ok(aisC.ais === "C", `AIS C for less than half preserved (${aisC.ais})`);

// ---- scores ---------------------------------------------------------------
const sm = calculateScore("spetzler_martin", {
  size: "Medium — 3 to 6 cm",
  eloquence:
    "Eloquent — sensorimotor, language or visual cortex, hypothalamus, thalamus, brainstem, cerebellar peduncles, deep nuclei",
  drainage: "Deep",
});
ok(sm.total === 4, `Spetzler–Martin grade IV (${sm.total})`);
ok(/Grade IV/.test(sm.display), "Spetzler–Martin display");

const rot = calculateScore("rotterdam_ct", { cisterns: "Absent", shift: "More than 5 mm", epidural: "Present", sah: "Absent" });
ok(rot.total === 4, `Rotterdam 4 (${rot.total})`);

const mjoa = calculateScore("mj_joa", {
  upper: "5 — Able to feed with chopsticks or spoon and button clothes",
  lower: "7 — Able to walk normally",
  sensory: "3 — Normal",
  sphincter: "3 — Normal",
});
ok(mjoa.total === 18 && /Mild/.test(mjoa.display), "mJOA 18 mild");

const empty = calculateScore("nurick", {});
ok(empty.total === null && empty.missing.length === 1, "score not calculated when incomplete");

ok(indicatedScores({ vascular_study: "Arteriovenous malformation identified" }).includes("spetzler_martin"), "AVM indicates Spetzler–Martin");
ok(!indicatedScores({}).includes("house_brackmann"), "facial scale not surfaced without facial findings");

const savedScores = formatNeurosurgeryScores({ entries: { rotterdam_ct: { cisterns: "Absent", shift: "More than 5 mm", epidural: "Present", sah: "Absent" } }, clinical_use: "Discussed with the family" });
ok(/Limitation:/.test(savedScores), "limits printed with the saved score");
ok(/Source: Maas/.test(savedScores), "source printed with the saved score");

// ---- examination formatter ------------------------------------------------
const examText = formatNeurosurgicalExam({
  consciousness: "Drowsy — rousable",
  orientation: "Not oriented to time only",
  pupils: { right_size: "3 mm", right_reactivity: "Brisk", left_size: "5 mm", left_reactivity: "Fixed" },
  cranial_nerves: { status: "Abnormality documented below", detail: "III left pupil dilated" },
  motor: { right_arm: "5 — Normal power", left_arm: "2 — Movement with gravity eliminated" },
  sensory: { level: "T4", modality: "Pin prick", side: "Bilateral", detail: "reduced below T4" },
  reflexes: { knee: "3+ — Brisk, symmetrical", plantar: "Extensor — bilateral", clonus: "Absent" },
  coordination: { finding: "Impaired — left", detail: "dysdiadochokinesia" },
  gait: "Spastic",
  meningeal: { neck: "Present", kernig: "Absent" },
  spine: { tenderness: "Lumbar", dermatome: "L5 right", myotome: "L5 — EHL 3/5" },
});
ok(/Pupils: right 3 mm, brisk; left 5 mm, fixed — asymmetry of 2 mm recorded/.test(examText), "pupils with asymmetry");
ok(/Dermatomal level: L5 right/.test(examText), "dermatomal level printed");
ok(/Meningeal signs: neck stiffness present; Kernig absent/.test(examText), "meningeal signs printed");
ok(formatNeurosurgicalExam({}) === "Neurological examination not documented in this note.", "empty examination is not normal");

// ---- safety prompts -------------------------------------------------------
const promptsFor = (values, concerns = []) => buildNeurosurgerySafetyPrompts({ values, concerns }).map((p) => p.key);
ok(promptsFor({ nsg_exam: { pupils: { left_reactivity: "Fixed", right_size: "3 mm", left_size: "6 mm" } } }).includes("fixed_pupil"), "fixed pupil prompt");
ok(promptsFor({ nsg_exam: { consciousness: "Responds to pain" } }).includes("deteriorating_consciousness"), "depressed consciousness prompt");
ok(promptsFor({ cord_syndrome: "Central cord syndrome" }).includes("cord_syndrome"), "cord syndrome prompt");
ok(promptsFor({ neurogenic_shock: "Confirmed" }).includes("neurogenic_shock"), "neurogenic shock prompt");
ok(promptsFor({ facial_nerve: "Involved — graded below" }).includes("facial_nerve"), "facial nerve prompt");
ok(promptsFor({ nsg_exam: { meningeal: { neck: "Present" } } }).includes("meningism"), "meningism prompt");
ok(promptsFor({}) .length === 0, "no prompt without documented findings");

console.log(`PASS ${pass}`);
if (fails.length) {
  console.log(`FAILURES (${fails.length}):`);
  fails.forEach((f) => console.log(" - " + f));
} else {
  console.log("ALL CHECKS PASSED");
}