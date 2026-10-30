import { sel, chk, multi, lat, num, section } from "../shared.js";

export default {
  key: "peripheral_vascular",
  label: "Peripheral Vascular Examination",
  description: "Perfusion, pulses, trophic changes and vascular tests",
  sections: [
    section("inspection", "Inspection", [
      lat("laterality", "Laterality of findings"),
      sel("color", "Limb colour", ["Normal", "Pale", "Cyanosed", "Dusky / hyperemic", "Mottled"], { detailOn: ["Cyanosed", "Dusky / hyperemic", "Mottled"] }),
      multi("trophic_changes", "Trophic changes", ["None", "Hair loss", "Shiny / atrophic skin", "Nail dystrophy", "Ulceration", "Gangrene", "Muscle wasting"]),
      sel("edema", "Edema", ["None", "Pitting", "Non-pitting", "Weeping"], { detailOn: ["Pitting", "Non-pitting", "Weeping"] }),
      chk("varicose_veins", "Varicose veins", { detailOn: true }),
      chk("scars", "Vascular scars / grafts", { detailOn: true }),
    ]),
    section("palpation_pulses", "Palpation and Pulses", [
      sel("temperature", "Limb temperature", ["Warm", "Cold"], { bilateral: true }),
      num("cap_refill", "Capillary refill", { unit: "s", min: 0, max: 10, step: 1 }),
      sel("carotid", "Carotid pulse", ["Present and normal", "Weak", "Bounding", "Absent"]),
      sel("brachial", "Brachial pulse", ["Present", "Weak", "Absent"], { bilateral: true }),
      sel("radial", "Radial pulse", ["Present", "Weak", "Absent"], { bilateral: true }),
      sel("femoral", "Femoral pulse", ["Present", "Weak", "Absent"], { bilateral: true }),
      sel("popliteal", "Popliteal pulse", ["Present", "Weak", "Absent"], { bilateral: true }),
      sel("posterior_tibial", "Posterior tibial pulse", ["Present", "Weak", "Absent"], { bilateral: true }),
      sel("dorsalis_pedis", "Dorsalis pedis pulse", ["Present", "Weak", "Absent"], { bilateral: true }),
    ], { mode: "free" }),
    section("auscultation", "Auscultation", [
      multi("bruits", "Vascular bruits", ["None", "Carotid", "Subclavian", "Aortic", "Femoral", "Renal"]),
    ]),
    section("special_tests", "Special Tests", [
      sel("buerger", "Buerger's test", ["Negative", "Positive — angle < 20°", "Not performed"], { detailOn: ["Positive — angle < 20°"], detailLaterality: true }),
      sel("trendelenburg", "Trendelenburg / tourniquet test", ["Negative", "Positive", "Not performed"]),
      num("abi", "Ankle-brachial index", { step: 0.01, min: 0, max: 2 }),
      chk("elevation_pain", "Pain on elevation / relieved by dependency", { detailLaterality: true }),
    ]),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};