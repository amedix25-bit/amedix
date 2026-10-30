import { sel, chk, multi, lat, num, scale, txt, section } from "../shared.js";

export default {
  key: "musculoskeletal",
  label: "Musculoskeletal Examination",
  description: "Joints, spine, muscles and functional assessment",
  sections: [
    section("inspection", "Inspection", [
      sel("region", "Region examined", ["Cervical spine", "Shoulder", "Elbow", "Wrist / hand", "Lumbar spine", "Hip", "Knee", "Ankle / foot", "Multiple regions"], { detailOn: ["Multiple regions"] }),
      lat("laterality", "Laterality"),
      chk("deformity", "Deformity", { detailOn: true }),
      chk("swelling", "Swelling / effusion", { detailOn: true }),
      chk("erythema", "Erythema", { detailOn: true }),
      chk("muscle_wasting", "Muscle wasting", { detailOn: true }),
      chk("scars_sinuses", "Scars / sinuses", { detailOn: true }),
      sel("posture", "Posture", ["Normal", "Kyphotic", "Lordotic", "Scoliotic", "Abnormal — other"], { detailOn: ["Abnormal — other"] }),
      sel("gait", "Gait", ["Normal", "Antalgic", "Stiff", "Unable to weight-bear"]),
    ]),
    section("palpation", "Palpation", [
      chk("tenderness", "Tenderness", { detailOn: true, detailLaterality: true }),
      chk("effusion", "Joint effusion", { detailOn: true }),
      chk("warmth", "Local warmth", { detailOn: true }),
      chk("crepitus", "Crepitus", { detailOn: true }),
      chk("synovial_thickening", "Synovial thickening", { detailOn: true }),
      num("tm_measurement", "Swelling circumference / measurement", { unit: "cm", step: 0.1 }),
    ]),
    section("range_of_movement", "Range of Movement", [
      multi("limited_active", "Joints with limited ACTIVE movement", ["None", "Cervical spine", "Shoulder", "Elbow", "Wrist / hand", "Lumbar spine", "Hip", "Knee", "Ankle / foot"]),
      multi("limited_passive", "Joints with limited PASSIVE movement", ["None", "Cervical spine", "Shoulder", "Elbow", "Wrist / hand", "Lumbar spine", "Hip", "Knee", "Ankle / foot"]),
      chk("painful_movement", "Pain on movement", { detailOn: true }),
    ], {
      abnormalFields: [
        txt("specific_movements", "Specific movements / degrees limited"),
      ],
      notesLabel: "Range of movement findings",
    }),
    section("power_function", "Power and Function", [
      scale("upper_limb_power", "Upper limb power (0–5)", 0, 5, ["0", "1", "2", "3", "4", "5"], { bilateral: true }),
      scale("lower_limb_power", "Lower limb power (0–5)", 0, 5, ["0", "1", "2", "3", "4", "5"], { bilateral: true }),
      sel("functional_status", "Functional status", ["Fully independent", "Independent with aid", "Needs assistance", "Fully dependent"]),
    ], { mode: "free" }),
    section("special_tests", "Special Tests", [
      multi("tests_performed", "Tests performed", ["None", "Thomas test", "Trendelenburg test", "McMurray test", "Lachman test", "Anterior / posterior drawer", "Tinel's sign", "Phalen's test", "Finkelstein test", "Straight leg raise", "Schober's test"]),
    ], {
      abnormalFields: [
        txt("positive_tests", "Positive test(s) and findings"),
      ],
      notesLabel: "Special test findings",
    }),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};