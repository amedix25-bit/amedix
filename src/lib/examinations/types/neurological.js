import { sel, chk, multi, lat, txt, area, cn, power, reflex, section } from "../shared";

export default {
  key: "neurological",
  label: "Neurological Examination",
  description: "Full neuro assessment — mental status, cranial nerves, motor, reflexes, sensory, coordination, gait",
  sections: [
    section("mental_status", "Mental Status", [
      sel("appearance", "Appearance and behaviour", ["Normal", "Abnormal"], { detailOn: ["Abnormal"] }),
      sel("orientation", "Orientation", ["Fully oriented", "Disoriented"], { detailOn: ["Disoriented"] }),
      sel("speech", "Speech", ["Normal", "Dysarthric", "Dysphasic"], { detailOn: ["Dysarthric", "Dysphasic"] }),
      sel("mood", "Mood", ["Normal", "Depressed", "Elevated", "Anxious", "Labile"]),
      sel("insight", "Insight", ["Intact", "Partial", "Absent"]),
    ]),
    section("higher_functions", "Higher Mental Functions", [
      sel("attention", "Attention / concentration (serial 7s)", ["Intact", "Impaired"]),
      sel("recent_memory", "Recent memory", ["Intact", "Impaired"]),
      sel("remote_memory", "Remote memory", ["Intact", "Impaired"]),
      sel("judgement", "Judgement", ["Intact", "Impaired"]),
      sel("comprehension", "Comprehension", ["Intact", "Impaired"]),
      txt("other_cognitive", "Other cognitive notes"),
    ]),
    section("cranial_nerves", "Cranial Nerves (I–XII)", [
      cn("cn1", "I", "Olfactory — smell"),
      cn("cn2", "II", "Optic — acuity, fields, fundus"),
      cn("cn3", "III", "Oculomotor"),
      cn("cn4", "IV", "Trochlear"),
      cn("cn5", "V", "Trigeminal — facial sensation, mastication"),
      cn("cn6", "VI", "Abducens"),
      cn("cn7", "VII", "Facial — facial movement, taste"),
      cn("cn8", "VIII", "Vestibulocochlear — hearing, balance"),
      cn("cn9", "IX", "Glossopharyngeal"),
      cn("cn10", "X", "Vagus — palate, gag, vagal"),
      cn("cn11", "XI", "Accessory — shoulder shrug, head turn"),
      cn("cn12", "XII", "Hypoglossal — tongue"),
    ], { mode: "free" }),
    section("motor", "Motor Examination", [
      sel("posture", "Posture", ["Normal", "Hemiplegic", "Decorticate", "Decerebrate"]),
      multi("involuntary_movements", "Involuntary movements", ["None", "Tremor", "Chorea", "Athetosis", "Dystonia", "Myoclonus", "Tics"], { detailLaterality: true }),
      chk("wasting", "Muscle wasting", { detailOn: true, detailLaterality: true }),
      chk("fasciculations", "Fasciculations", { detailOn: true, detailLaterality: true }),
    ]),
    section("bulk_tone", "Muscle Bulk and Tone", [
      sel("bulk", "Muscle bulk", ["Normal", "Wasted", "Hypertrophied"], { bilateral: true }),
      sel("tone", "Muscle tone", ["Normal", "Increased — spastic", "Increased — rigid", "Decreased — flaccid"], { bilateral: true }),
      chk("clonus", "Sustained clonus", { detailOn: true, detailLaterality: true }),
    ]),
    section("power", "Muscle Power (MRC 0–5)", [
      power("shoulder_abduction", "Shoulder abduction"),
      power("elbow_flexion", "Elbow flexion"),
      power("elbow_extension", "Elbow extension"),
      power("wrist_extension", "Wrist extension"),
      power("finger_abduction", "Finger abduction / grip"),
      power("hip_flexion", "Hip flexion"),
      power("knee_extension", "Knee extension"),
      power("knee_flexion", "Knee flexion"),
      power("ankle_dorsiflexion", "Ankle dorsiflexion"),
      power("ankle_plantarflexion", "Ankle plantarflexion"),
    ], { mode: "free" }),
    section("reflexes", "Reflexes", [
      reflex("biceps", "Biceps (C5–6)"),
      reflex("triceps", "Triceps (C7–8)"),
      reflex("supinator", "Supinator (C5–6)"),
      reflex("knee", "Knee — patellar (L3–4)"),
      reflex("ankle", "Ankle — Achilles (S1)"),
      sel("plantar_response", "Plantar response", ["Normal — flexor", "Extensor — Babinski positive", "Equivocal"], { bilateral: true }),
    ], { mode: "free" }),
    section("sensory", "Sensory Examination", [
      multi("modalities", "Modalities tested", ["Light touch", "Pinprick", "Temperature", "Vibration", "Joint position sense"]),
      lat("laterality", "Laterality of sensory findings"),
      sel("pattern", "Sensory pattern", ["Normal", "Glove and stocking", "Dermatomal", "Hemisensory loss", "Sensory level / cord lesion", "Patchy"], { detailOn: ["Dermatomal", "Sensory level / cord lesion", "Patchy"] }),
      txt("distribution", "Distribution / dermatomes involved"),
    ], {
      abnormalFields: [
        sel("anal_tone", "Anal tone (when indicated)", ["Not assessed", "Normal", "Reduced"]),
      ],
      notesLabel: "Sensory findings",
    }),
    section("coordination", "Coordination", [
      sel("finger_nose", "Finger-to-nose", ["Normal", "Dysmetric / intention tremor"], { bilateral: true }),
      sel("rapid_alternating", "Rapid alternating movements", ["Normal", "Dysdiadochokinesia"], { bilateral: true }),
      sel("heel_shin", "Heel-to-shin", ["Normal", "Impaired"], { bilateral: true }),
      sel("romberg", "Romberg's test", ["Negative", "Positive", "Unable to test"]),
    ]),
    section("gait", "Gait", [
      sel("gait_type", "Gait", ["Normal", "Hemiplegic", "Spastic / scissoring", "Cerebellar ataxic", "Sensory ataxic", "Shuffling / Parkinsonian", "High-stepping", "Waddling", "Antalgic", "Unable to walk"], { detailOn: ["Hemiplegic", "Spastic / scissoring", "Cerebellar ataxic", "Sensory ataxic", "Shuffling / Parkinsonian", "High-stepping", "Waddling", "Antalgic"] }),
      sel("stance", "Stance", ["Narrow and stable", "Broad-based", "Unable to stand unaided"]),
      sel("arm_swing", "Arm swing", ["Normal", "Reduced"], { detailLaterality: true }),
    ]),
    section("special_tests", "Special Tests / Findings", [
      multi("meningeal_signs", "Meningeal signs", ["None", "Neck stiffness", "Kernig's sign", "Brudzinski's sign"]),
      chk("straight_leg_raise", "Straight leg raise positive", { detailLaterality: true }),
      sel("fundus", "Fundoscopy", ["Normal discs", "Papilloedema", "Optic atrophy", "Not performed"]),
    ], {
      abnormalFields: [],
      notesLabel: "Special tests / findings notes",
    }),
    section("additional_notes", "Additional Notes", [
      area("notes", "Additional notes"),
    ], { mode: "free" }),
  ],
};