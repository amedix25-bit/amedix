// Encounter safeguards for the EXISTING Emergency Medicine note types.
//
// Everything here records a DECISION or a CHECK the clinician made — never a
// medication, a dose or an intervention the app chose. Nothing in this module
// can order, prescribe, administer or mark anything as done: every field is
// documentation of what the treating team actually did, with who did it and when.
//
// These fields are additive and optional. Nothing here blocks immediate care:
// every option includes "Not documented" and the note saves without them, so a
// resuscitation is never delayed for a form.
//
// No duplication: the patient's allergy list, weight, medications and history
// already attach to the note from the unified Patient Record. These fields record
// that the clinician REVIEWED them for this encounter.

const T = (key, label, extra) => ({ key, label, type: "textarea", ...extra });
const F = (key, label, extra) => ({ key, label, type: "input", ...extra });
const S = (key, label, options, extra) => ({ key, label, type: "select", options, ...extra });
const safety = (field) => ({ ...field, safetyCritical: true });
const when = (key, ...values) => ({ showIf: { key, in: values } });
const sec = (section, fields) => fields.map((f) => ({ ...f, section }));
const ND = "Not documented";

// ---- Medication safety -----------------------------------------------------
// The app never states that a drug is safe. It records that the allergy list was
// reviewed, the contraindications considered, the interaction check done, and —
// where a dose depends on weight — that the weight was documented and the dose
// independently double-checked against a named reference.
const medicationSafetyBlock = () =>
  sec("Medication Safety at This Encounter", [
    safety(
      S(
        "ec_allergy_reviewed",
        "Allergy Record Reviewed for This Encounter",
        [
          "Reviewed against the recorded allergy list — no relevant allergy",
          "Reviewed — relevant allergy documented, medication avoided",
          "Patient unable to confirm — documented",
          "No allergy information available — documented",
          ND,
        ]
      )
    ),
    safety(
      S(
        "ec_contraindications_checked",
        "Contraindications Considered",
        [
          "Checked against the documented history and current medications — none present",
          "Contraindication present — documented, medication withheld or alternative used",
          "Not checked",
          "Not applicable — no medication given",
          ND,
        ]
      )
    ),
    safety(
      S(
        "ec_drug_interactions",
        "Relevant Medication Interactions",
        [
          "Checked against the current medication list — none relevant",
          "Interaction identified — documented and action taken",
          "Not checked",
          "Not applicable — no medication given",
          ND,
        ]
      )
    ),
    safety(
      S("ec_weight_based_dosing", "Weight-Based Dosing (adults and children)", [
        "Weight documented and dose calculated per kg — independently double-checked",
        "Weight documented — dose not weight-based",
        "Weight not documented — reason documented",
        "Not applicable — no medication given",
        ND,
      ])
    ),
    F(
      "ec_dose_reference",
      "Weight, the weight's source, and the formulary or reference the dose was taken from",
      when(
        "ec_weight_based_dosing",
        "Weight documented and dose calculated per kg — independently double-checked",
        "Weight documented — dose not weight-based",
        "Weight not documented — reason documented"
      )
    ),
    F(
      "ec_second_checker",
      "Second checker for the dose — name / role / time",
      when("ec_weight_based_dosing", "Weight documented and dose calculated per kg — independently double-checked")
    ),
    T(
      "ec_medication_safety_detail",
      "Medication safety reasoning — the drug, dose, route and what was checked before it was given",
      when(
        "ec_contraindications_checked",
        "Contraindication present — documented, medication withheld or alternative used"
      )
    ),
  ]);

// ---- Neurovascular reassessment -------------------------------------------
// Required documentation after a procedure or injury that can compromise a limb
// — recorded, never assumed normal when it is not written down.
const neurovascularBlock = () =>
  sec("Neurovascular Reassessment", [
    S("ec_neurovascular", "Neurovascular Status — Before and After", [
      "Documented before and after the procedure",
      "Documented after only",
      "Documented before only",
      ND,
      "Not applicable",
    ]),
    safety(
      F(
        "ec_neurovascular_detail",
        "Pulse, perfusion, sensation and motor findings — with times",
        when(
          "ec_neurovascular",
          "Documented before and after the procedure",
          "Documented after only",
          "Documented before only"
        )
      )
    ),
    T(
      "ec_neurovascular_escalation",
      "Deterioration and the action taken",
      when("ec_neurovascular", "Documented before and after the procedure", "Documented after only")
    ),
  ]);

// ---- Informed refusal and capacity ----------------------------------------
// A patient may refuse any part of care. The record must show that capacity was
// considered, that the risks and alternatives were explained, and what was
// offered instead — a refusal is never treated as a completed discharge.
const consentByRefusalBlock = () =>
  sec("Consent, Capacity and Informed Refusal", [
    safety(
      S("ec_informed_refusal", "Refusal of Care or of a Specific Intervention", [
        "Not applicable — care accepted",
        "Refusal documented — capacity assessed and documented",
        "Refusal documented — capacity not assessed",
        ND,
      ])
    ),
    safety(
      S(
        "ec_capacity_assessment",
        "Decision-Making Capacity",
        [
          "Capacity documented as present",
          "Capacity documented as lacking — decision escalated per local process",
          "Formal assessment requested — documented",
          "Not assessed",
          ND,
        ],
        when("ec_informed_refusal", "Refusal documented — capacity assessed and documented", "Refusal documented — capacity not assessed")
      )
    ),
    T(
      "ec_refusal_detail",
      "What was explained — the risks of refusal, the alternatives offered, the follow-up advice given, and who was present",
      when("ec_informed_refusal", "Refusal documented — capacity assessed and documented", "Refusal documented — capacity not assessed")
    ),
  ]);

// ---- Pending results and follow-up responsibility -------------------------
// A test that is still running when the patient leaves needs a named owner and a
// route back — otherwise the result exists and nobody acts on it.
const pendingResultsBlock = () =>
  sec("Pending Results & Follow-Up Responsibility", [
    S("ec_pending_results", "Results Pending at Disposition", [
      "None pending — documented",
      "Pending — responsible clinician documented",
      "Pending — responsibility not documented",
      ND,
      "Not applicable",
    ]),
    safety(
      F(
        "ec_pending_owner",
        "Who is responsible for acting on each pending result — name / role",
        when("ec_pending_results", "Pending — responsible clinician documented", "Pending — responsibility not documented")
      )
    ),
    S(
      "ec_pending_review_pathway",
      "How and when the pending results will be reviewed",
      ["Pathway documented", ND, "Not applicable"],
      when("ec_pending_results", "Pending — responsible clinician documented", "Pending — responsibility not documented")
    ),
    S("ec_review_before_discharge", "Results Reviewed Before Discharge", [
      "Reviewed — documented",
      "Not available — discharged with a documented review pathway",
      "Not reviewed — reason documented",
      ND,
      "Not applicable",
    ]),
  ]);

// Which notes get which safeguards. A triage record documents none of the
// medication or refusal fields it could never complete.
export const EMERGENCY_SAFEGUARDS = {
  em_emergency_note: () => [...medicationSafetyBlock(), ...consentByRefusalBlock(), ...pendingResultsBlock()],
  em_ed_assessment: () => [...medicationSafetyBlock()],
  em_physician_note: () => [...medicationSafetyBlock(), ...consentByRefusalBlock(), ...pendingResultsBlock()],
  em_observation_note: () => [...medicationSafetyBlock(), ...pendingResultsBlock()],
  em_trauma_assessment: () => [...medicationSafetyBlock(), ...neurovascularBlock()],
  em_procedure_note: () => [...medicationSafetyBlock(), ...neurovascularBlock()],
  em_resuscitation_code: () => [...medicationSafetyBlock()],
  em_discharge_summary: () => [...consentByRefusalBlock(), ...pendingResultsBlock()],
  em_discharge_instructions: () => [...pendingResultsBlock()],
  em_transfer_note: () => [...pendingResultsBlock()],
};