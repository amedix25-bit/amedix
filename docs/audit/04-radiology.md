# Audit — Radiology Portal (`/radiology-department`, `/radiologist`)

## Scope reviewed
Imaging requests (modality, examination, priority, contrast + allergy +
MRI safety screening), department routing and assignment, worklists,
in-app image storage and viewer, PACS bridge, structured reporting,
templates, report versions and approval, critical findings, access requests,
audit.

## Findings

### RD-01 — DICOM/PACS integration is configured-but-unverified
- **Existing:** the entity layer is genuinely standards-ready:
  `study_instance_uid` and `accession_number` are recorded by the department;
  `HospitalProfile` carries `pacs_integration_type` (dicomweb / web_viewer /
  desktop_app / none), vendor name, a server-side-only launch URL template and
  a DICOMweb base URL; `radiologyPacsAccess` issues short-lived single-use
  launch tokens (`PacsLaunchToken`, 15-minute expiry, validated server-side,
  per-study authorization); template substitution happens server-side only.
  **No DICOMweb endpoint is actually configured or tested in this
  environment**, and the in-app image store is not a DICOM server (PDF/image
  files in-app; external DICOM/PACS transfer is out of the in-app flow).
- **Reference:** DICOM — Study Instance UID (0020,000D) and Accession Number
  (0008,0050) are the correct study identifiers; DICOMweb (QIDO-RS/WADO-RS) is
  the standard browser-queryable service. The Imaging Viewer/ImagingStudy
  naming does **not** imply operational DICOM interop.
- **Status:** Partial — identifiers and the token bridge exist in code;
  operational interop is **not established** and is not claimed.
- **Risk:** Medium — a facility could believe integration is live when only
  the configuration fields exist.
- **Proposed change:** keep the existing honest gate: the department
  administrator records the vendor's confirmed method; before any launch
  link is offered, `radiologyPacsAccess` should (where feasible) verify study
  availability and mark `images_awaiting_transfer` only on a successful
  check. Add an acceptance test at first real deployment.
- **Affected:** `HospitalProfile` PACS fields, `radiologyPacsAccess`,
  `PacsLaunchToken`, department workflow.
- **Acceptance test (at a facility with real PACS):** with a known
  `study_instance_uid`, a radiologist launch produces a working viewer URL
  once, fails on second use (single-use token), and an expired token is
  rejected.

### RD-02 — Critical findings escalation reach
- **Existing:** `CriticalFindingLog`, `radiologyCriticalComm` notify doctor +
  patient; `radiologyCriticalEscalationScan` runs hourly as a workflow with
  audit trails; portal notifications are in-app.
- **Reference:** ISO 27799/NPSG-style closed-loop communication — critical
  results require documented, escalating notification.
- **Status:** Partial — escalation is automated and audited; if the app has
  no native mobile build, push notifications (where used) cannot reach
  phones, and email only reaches registered app users.
- **Risk:** Low–Medium — a critical finding always lands in-app (audited),
  but out-of-band reach depends on the user being registered/using the app.
- **Proposed change:** none required in code; document that critical
  escalation is in-app + audited, and confirm the escalation scan workflow
  run history shows hourly execution.
- **Affected:** the two radiology-critical functions, the escalation workflow.
- **Acceptance test:** a critical finding is marked → notification recorded
  for doctor and patient → if unacknowledged, the hourly scan escalates with
  an audit entry.

### RD-03 — Department-based routing preserved
- **Existing:** requests route to the facility's radiology **department**
  (`routed_hospital_user_id`); individual assignment is optional
  (`assigned_radiologist_user_id` set only by department action or a
  radiologist claim, with full `assignment_history`); per-request patient
  authorization gates radiologist reads.
- **Reference:** institutional radiology workflow (department worklist
  before individual assignment); FHIR `Task`-based routing pattern.
- **Status:** Satisfied — matches the intended workflow exactly; RLS keys
  read only the authorized set.
- **Risk:** none.
- **Proposed change:** none (explicitly required to be preserved).
- **Acceptance test:** a new request appears on the department worklist and
  on no individual radiologist's worklist until assigned/claimed.

### RD-04 — Safety screening and contrast data
- **Existing:** contrast use, contrast allergy, previous reaction, MRI metal
  implant / pacemaker / other device / metallic foreign body / other concern
  are structured enum fields on `ImagingRequest`; department and radiologist
  views surface them.
- **Reference:** ACR MRI safety practice (zone screening); FHIR
  `ServiceRequest` supporting info. Structured enums are the right shape.
- **Status:** Satisfied at the data layer; consent for contrast exists via
  `Consent.consent_type = imaging_contrast` (recorded through the consent
  flow).
- **Risk:** Low.
- **Proposed change:** none.
- **Acceptance test:** an MRI request with pacemaker = "Yes" is visibly
  flagged in the department worklist before scheduling.

### RD-05 — Reporting quality and versioning
- **Existing:** `RadiologyReportTemplate` (institution-approved + personal),
  `ReportDraft` (one per radiologist per study, persists), template
  auto-suggestions, report versions (`RadiologyReportVersion`), final report
  datetime, release datetime, addendum/correction paths, `AI assist` marked
  advisory.
- **Reference:** structured-reporting practice (ACR/RSNA templates); FHIR
  `DiagnosticReport` + versioned reports.
- **Status:** Satisfied for workflow; DICOM SR (structured report) export is
  out of scope and not claimed.
- **Risk:** Low.
- **Proposed change:** none.
- **Acceptance test:** two radiologists drafting the same study each keep
  their own draft; finalize produces a versioned report with actor and
  timestamps.