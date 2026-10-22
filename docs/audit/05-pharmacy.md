# Audit — Pharmacy Portal (`/pharmacy-portal`, `/pharmacy/pharmacist`)

## Scope reviewed
Prescription lifecycle (authorize → reserve → dispense → payment),
medication identification (DrugCatalog), dispensing, inventory + movements,
availability, payment records, prescription status, allergies,
duplicate therapies, interaction alerts, substitutions, recalls, refunds.

## Findings

### PH-01 — Dispensing safety checks (allergy re-check gap)
- **Existing:** see DR-02. At dispensing, authorization, status, inventory
  safety (quarantined/expired/recalled stock blocked), duplicate-transaction
  prevention and refill accounting are enforced server-side. There is no
  patient-allergy re-check at the moment of dispensing.
- **Reference:** WHO high-risk medication management — dispensing is a final
  safety barrier; FHIR `MedicationDispense` workflow.
- **Status:** Partial.
- **Risk:** Medium.
- **Proposed change:** as DR-02 (shared deterministic rules in
  `base44/shared/pharmacyPrescription.ts`).
- **Acceptance test:** as DR-02.

### PH-02 — Medication identification and duplicate therapy
- **Existing:** `Medication.active_ingredient` supports duplicate-therapy
  detection (name or ingredient match at prescription time, deterministic);
  `DrugCatalog` identifies products; substitutions require doctor approval
  (`pharmacyRequestSubstitution` → `respondMedicationSubstitution`) — no
  automatic substitution exists.
- **Reference:** FHIR `MedicationRequest`/`MedicationDispense`;
  pharmacovigilance practice — substitutions must be clinically authorized.
- **Status:** Satisfied for the authorization workflow and duplicate
  detection at prescribing; the interaction layer is advisory (XC-07).
- **Risk:** Low–Medium (no licensed interaction database — honest limitation
  is surfaced to the doctor).
- **Proposed change:** fold into XC-07 decision (integrate a licensed drug
  knowledge base when procurement is decided).
- **Acceptance test:** proposing a duplicate of an active medication raises a
  critical advisory requiring acknowledgment; substitution without doctor
  approval is impossible (server rejects).

### PH-03 — Subscription & payment management missing in pharmacy portal
- **Existing:** partner plans/pricing are managed by the administrator
  (`PartnerPlanSettings`, `partnerSubscriptionManage`); the pharmacy portal
  has no self-serve subscription or payment UI (known open item).
- **Reference:** commercial completeness — not a clinical standard; flagged as
  product gap, not a compliance violation.
- **Status:** Missing (product feature, out of the standards scope — recorded
  for completeness).
- **Risk:** Low (clinical flows unaffected).
- **Proposed change:** separate work item (existing open todo).
- **Acceptance test:** a pharmacy can view its plan, see payment records
  distinguishing "recorded (pending)" vs "verified (finalized)", and cancel
  end-of-period.

### PH-04 — Payment records and refund round-trip
- **Existing:** `PaymentTransaction` records dispensing payments with amount,
  method, datetime; patient notification distinguishes "payment recorded
  (pending)" from "payment verified (finalized)"; full refund/adjustment
  logic is an open item (`pharmacyPaymentManage` covers record/verify).
- **Reference:** financial-integrity good practice; ISO 27799 does not govern
  payments.
- **Status:** Partial (refund path unfinished).
- **Risk:** Low (financial record accuracy).
- **Proposed change:** complete refund/adjustment round-trip (existing open
  todo).
- **Acceptance test:** a verified payment can be adjusted with a documented
  reason; both the original and the adjustment remain in history with
  actors.

### PH-05 — Inventory traceability
- **Existing:** `PharmacyInventory` with batch numbers, expiry, quarantine,
  recall linkage (`MedicationRecall`), and `PharmacyInventoryMovement`
  entries on reserve/dispense; expiry alert workflow runs periodically.
- **Reference:** pharmacovigilance / batch traceability (recall must reach
  affected patients — the recall workflow exists; UAT of the patient-side
  notification trigger is an open todo).
- **Status:** Satisfied for dispensing traceability; recall-to-patient
  notification UAT pending (existing open item).
- **Risk:** Medium if recalls fail to notify — must be tested.
- **Proposed change:** complete the UAT (existing open todo).
- **Acceptance test:** creating a recall for a dispensed batch produces
  notifications to affected patients (verified in run history + patient
  notification records).

### PH-06 — Patient lookup at the counter
- **Existing:** `pharmacyFindPatientByCin` — CIN-based lookup only (never by
  name), audited; dispensing history/audit display is an open item.
- **Reference:** patient-identification good practice (unique identifier +
  confirmation).
- **Status:** Satisfied for identification; audit-trail display pending.
- **Risk:** Low.
- **Proposed change:** complete the open audit-trail display item.
- **Acceptance test:** a pharmacist opening a patient record by CIN creates a
  `viewed_patient_record` audit entry retrievable later.