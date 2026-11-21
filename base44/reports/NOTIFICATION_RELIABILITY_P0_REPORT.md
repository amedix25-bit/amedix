# AMedix — Notification, Alert & Medication Reminder Reliability (P0)

Date: 2026-11-21 · Scope: every existing portal and notification type · Status: repaired, partially measured

This report separates what was **measured** in this session (real function invocations, real database reads, automated checks) from what was **established by code inspection**, and lists what was **not performed**.

---

## 1. Root causes found

### RC-1 — Doctor Portal: notifications handed a patient CIN to a tab switcher (blank page)
`DoctorNotificationsBell` called `onNavigate(n.patient_cin)`, and the Doctor Portal passed its `setActiveTab` as that handler. The content area therefore received a CIN (e.g. `RCD-T4T-5XR`) instead of a tab key, matched no render branch and went blank. Every one of the 18 live doctor notifications was affected; the types without a patient CIN (e.g. `referral_received`, `prescription_dispensed`) landed on an empty search context instead of their own list.

**Confirmed by data:** live `DoctorNotification` types are `patient_access_granted`, `patient_access_revoked`, `imaging_result_shared`, `prescription_dispensed`, `referral_received`.

### RC-2 — Patient Portal: notification targets that are not tabs
Only three legacy aliases were normalised (`mylabresults`, `medications`, `prescriptions`). The scheduler wrote `target: "reminders"`, which is not a tab — clicking a medication reminder opened a blank content area. Any other unknown target did the same.

**Confirmed by data:** live patient targets include `reminders`, `medications`, `prescriptions`, `mylabresults`, `radiology` (127 records).

### RC-3 — Laboratory Portal: notification rows were not clickable
Only the "View PDF" button did anything; the row itself neither marked read nor navigated to the request. Live lab targets are `patient_profile` and `result`.

### RC-4 — No destination contract
Each portal invented its own mapping inline, so a new notification type could silently point nowhere.

### RC-5 — Reminder scheduler could flood and could not express a real schedule
`createMedicationReminders` alerted every slot with `slot <= now` and no catch-up window, so after an outage — or for a reminder created in the afternoon — every past dose of the day alerted at once. The reminder record had no start date, stop date, days of week, dose text, instructions, timezone or snooze state. Its notification target (`reminders`) caused RC-2.

### RC-6 — No in-app alarm
The only mechanism was an hourly notification; nothing surfaced at the scheduled minute while the portal was open.

---

## 2. Changes made

| Area | Change |
|---|---|
| New | `src/lib/notificationDestinations.js` — one contract: valid tab sets per portal, legacy-target mapping, patient resolver, doctor resolver (tab + CIN + label), category/priority taxonomy for all 10 required categories. |
| New | `src/components/common/UnavailableSection.jsx` — explained fallback instead of an empty area. |
| New | `src/components/patient/medications/MedicationAlarmCenter.jsx` — in-app alarm at the scheduled minute: chime, optional browser notification (generic text, no medication name), Taken / Snooze 10 min / Skip, records through the existing `logMedicationDose`. Never marks a dose as taken. |
| Fixed | `DoctorNotificationsBell` + `DoctorTopBar` + `DoctorDashboard` — click resolves to Prescriptions / Imaging / Referrals / Find Patient (CIN prefilled); never sends a non-tab value to the switcher; shows destination label and an Urgent badge. |
| Fixed | `NotificationsBar` (patient) — every click resolves through the shared map; unknown targets fall back to Home; Urgent badge; destination label per notification. |
| Fixed | `PatientDashboard` — `reminders` → Medications; unknown tab renders the explained fallback instead of blank. |
| Fixed | `LabNotificationsBar` + `LabPortal` — the whole row is clickable and opens the laboratory requests; PDF button unchanged. |
| Fixed | `MedicationReminder` schema — added `dosage`, `instructions`, `start_date`, `end_date`, `days_of_week`, `timezone`, `snooze_slot`, `snooze_until`, `last_reminder_datetime` (existing fields and RLS untouched). |
| Fixed | `createMedicationReminders` — timezone-aware, respects start/stop date and days of week, 3-hour catch-up window (no flood after downtime), snooze re-alert exactly once, dedupe per slot, skips slots the patient already logged, writes `target: "drugs"`. |
| Changed | "Medication Reminders" workflow cadence: hourly → **every 5 minutes**, so a due dose is notified within five minutes instead of up to an hour. The workflow stays active. |
| Extended | `AdherencePanel` — dose text, start date, stop date, days of week, instructions, with an explicit statement that reminders never change the prescribed medication or dose. |

Existing portals, notification entities, types, workflows and permissions were not removed, renamed or recreated. No notification record was deleted; the only deletions were the synthetic test records listed in §4.

---

## 3. Measured results

### 3.1 Destination routing (automated, 23 cases) — PASS
Executed against the shipped resolver module:

| Case | Result |
|---|---|
| patient `reminders` / `medications` / `prescriptions` | → `drugs` |
| patient `mylabresults`, `lab_request` | → `labs` |
| patient `radiology` | → `access` |
| patient unknown / empty / null target | → a valid tab (type fallback, else `overview`) |
| doctor `patient_access_granted` / `imaging_result_shared` / `medication_adherence` / `recall` with CIN | → `search` + CIN prefilled |
| doctor `substitution_request`, `prescription_dispensed` | → `prescriptions` |
| doctor `critical_finding` without CIN | → `imaging` |
| doctor `referral_received` | → `communication` (Referrals) |
| doctor unknown type | → `overview` |

**Result: 23/23 resolve to a tab the portal actually renders — 0 failures.**

### 3.2 Live record audit — PASS (no orphan recipients)
| Entity | Records | Missing recipient id | Targets / types observed |
|---|---|---|---|
| PatientNotification | 127 | 0 | reminders, appointments, messages, labs, overview, access, prescriptions, mylabresults, medications, radiology |
| DoctorNotification | 18 | 0 | access granted/revoked, imaging shared, prescription dispensed, referral received |
| LabNotification | 22 | 0 | patient_profile, result |
| PharmacyNotification | 31 | 0 | prescriptions, inventory |
| RadiologistNotification | 10 | 0 | find_patient, my_patients |
| MedicationReminder | 7 (6 enabled) | — | — |
| MedicationDoseLog | 39 | — | — |

No notification record was found without its recipient field, so no notification is invisible for a Row-Level-Security reason.

### 3.3 Reminder delivery, end to end — PASS
Synthetic reminder at **06:26 Africa/Tripoli** for one existing patient, scheduler invoked twice:

| Check | Result |
|---|---|
| First run | `sent: 1` |
| Second run (duplicate prevention) | `sent: 0` |
| Notifications created after two runs | **1** |
| Notification target | `drugs` (a real tab → opens Medications, not a blank page) |
| Title / message | "Medication Reminder" / "QA TEST REMINDER (1 tablet) — scheduled dose at 06:26…" |
| Cleanup | test reminder and test notification deleted |

### 3.4 Idle scheduler run — PASS
`createMedicationReminders` → `checked: 6, sent: 0`, HTTP 200, no errors (no dose was due at that minute).

### 3.5 Scheduler is actually running — PASS
Workflow run history (measured, not inferred):

| Workflow | Status | Last runs |
|---|---|---|
| Medication Reminders | **active** | hourly runs 2026-11-20 19:11 → 2026-11-21 04:10 UTC, all `ok` (latest 5.9 s) |
| Patient Appointment Reminders | **active** | daily runs 2026-11-11 → 2026-11-20, all `ok` |

The reminder schedule is therefore server-side and independent of any patient's browser.

### 3.6 Build — PASS
Production build completes with no errors after every change in this report.

---

## 4. Code inspection results (not runtime-tested)

Every notification type and its writer were reviewed. Each has a working trigger, correct recipient field and a destination that now exists:

| Type | Writer | Recipient | Destination |
|---|---|---|---|
| `lab_request`, `lab_results` | `notifyPatientLabEvent`, `labSubmitResults`, `labMarkResultsReady`, `labCorrectResult` | patient | Labs (requests / results) |
| `medication_update`, `medication_reminder` | `stopPatientMedication`, pharmacy functions, scheduler | patient | Medications |
| `recall` | `pharmacyRecallManage` | patient + doctor | Medications / patient record |
| `appointment`, `rescheduled` | `createPatientAppointmentReminders`, `notifyPatientReschedule` | patient | Appointments |
| `doctor_message` | `messagingApi` | patient | Messages |
| `imaging_critical`, `imaging_result_shared`, `critical_finding` | `radiologyWorkflow`, `radiologyUpdateWorkflowStatus`, `shareImagingResultWithDoctor` | patient + doctor | Imaging / patient record |
| `patient_access_granted`, `patient_access_revoked` | hospital check-in / assignment, `patientRevokeDoctorAccess` | doctor | Find Patient (CIN) |
| `substitution_request`, `prescription_dispensed`, `prescription_rejected` | pharmacy functions | doctor | Prescriptions |
| `referral_received` | `ReferralLetterForm` | doctor | Referrals |
| `new_request`, `result` | `authorizeLabRequest`, lab result functions | laboratory | Requests / PDF |
| pharmacy `new_authorized`, `reservation_confirmed`, `dispensed`, `expiry_alert`, `recall` | pharmacy functions | pharmacy | Prescriptions / Inventory |
| radiology access + worklist events | `radiologyRespondAccess`, `radiologyDepartmentMembership`, `radiologyWorkflow` | radiologist | Find / My Patients |

**Hospital and receptionist portals** do not own a notification entity: their alerts are the `EmergencyAlert` records rendered live in the hospital portal, plus the audit lists. They were inspected and left unchanged (no destination defect found).

**Delivery and persistence:** notifications are durable records; nothing in the codebase deletes or expires them, so a patient who is offline still receives them when they next open the portal. Bells subscribe to entity changes (doctor, patient, radiologist, pharmacy) or poll (laboratory), so unread counts refresh without a manual reload. Marking read updates only `is_read` — no clinical record is touched.

**Security:** every write is recipient-scoped and every read is filtered by the recipient's own user id in Row-Level Security. Opening a notification never grants clinical access: patient-bound doctor destinations land on Find Patient, which re-authorises server-side against the existing check-in / encounter / consent model. Browser notification previews are generic by design (no medication name).

---

## 5. Not performed (do not read as passing)

- **No live click-through test per portal** with real accounts for every one of the ~25 notification types. Routing was verified by automated resolver tests and by inspection of each portal's render branches; a UI pass with synthetic accounts is still required.
- **No real mobile / desktop push test.** Web push requires a service worker and push subscription infrastructure that this app does not have; only in-app alarms and the browser `Notification` API (where the browser permits it) are implemented.
- **No browser-closed alarm test — impossible by design.** A website cannot sound an alarm with the browser closed or the device offline. The patient is told this in the reminder screen and the alarm dialog; the durable fallback is the server-side reminder notification.
- **No server-restart / outage drill.** The scheduler is stateless and idempotent (dedupe key + catch-up window), but a real outage was not simulated.
- **No daylight-saving test.** Libya has observed no DST since 2013; times are evaluated in the reminder's own IANA timezone, so a DST-observing timezone would follow the zone rules rather than a fixed offset — unverified in practice.
- **No iOS/Safari-specific notification behaviour test.**

---

## 6. Recommended next steps before public clinical launch

1. Run a UI pass in the Testing Agent for each portal: open a notification, confirm the destination and record, refresh the destination, and confirm an unauthorised account is refused.
2. If audible reminders with the browser closed are a clinical requirement, add a native mobile build with push (or an SMS/email reminder channel) — the website alone cannot guarantee it.
3. Consider a second scheduler run cadence (e.g. every 5–10 minutes instead of hourly) to tighten notification latency for dose reminders.
