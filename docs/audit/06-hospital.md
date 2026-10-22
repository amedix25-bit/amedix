# Audit — Hospital Portal (`/hospital-portal`, `/hospital/receptionist`, admin-side)

## Scope reviewed
Registration (hospital + doctors via hospital_code), reception, patient
identity verification (CIN + document), check-in/check-out, encounters,
clinical record creation, staff permissions, hospital workflows.

## Findings

### HS-01 — Staff access is enforced per-profile, not by role
- **Existing:** all portal users share the platform `user` role (see XC-04).
  Hospital receptionists (`HospitalReceptionist`), doctors
  (`HospitalDoctor` associations), technicians and pharmacists are each
  verified server-side: every portal function looks up the caller's profile
  (`pharmacistProfileManage`, `labTechnicianLogin`,
  `hospitalReceptionistLogin`, `doctorHospitalSession`) and rejects with 403
  when absent. Clinical writes additionally require an active check-in and
  authorized doctor association.
- **Reference:** OWASP ASVS V4.1 — access control must be enforced
  server-side (it is); ISO 27799 — least privilege per function (achieved at
  function level, but role granularity inside the User entity is coarse).
- **Status:** Partial — enforcement is real and consistent; the role model is
  coarse (a single role for every non-admin user).
- **Risk:** Medium — defense-in-depth depends entirely on per-function
  profile checks; a forgotten check would be wide open. Audit-ability of the
  role assignments lives outside the User entity.
- **Proposed change:** keep per-function checks (working), and — optionally,
  non-breaking — extend the `User.role` values to the named portal roles so
  RLS can also key on role (e.g. `doctor`, `lab`, `pharmacy`, `hospital`,
  `radiologist`). Only if adopted, migrate existing records carefully.
- **Affected:** `base44/entities/User.jsonc`, all portal login/session
  functions.
- **Acceptance test:** a user with no pharmacist profile calling
  `pharmacistWorkspaceData` gets 403 (existing); with role split, RLS also
  denies direct entity reads.

### HS-02 — Patient identity verification at check-in
- **Existing:** `hospitalFindPatientByCin` (CIN-only lookup),
  `hospitalCheckInPatient` with server-side duplicate prevention and audit
  entries, `verifyIdentityDocument` strict document matching (document-extracted
  DOB/IDs/names must match entered values; mismatch fails verification, never
  auto-corrects), `HospitalCheckIn` lifecycle with checkout.
- **Reference:** Joint Commission NPSG.01.01.01-equivalent — two-identifier
  confirmation (CIN + a second identifier); ISO 27799 identity assurance.
- **Status:** Partial — CIN + name + DOB are carried on requests (two-plus
  identifiers available); check-in itself keys on CIN (correct practice) but
  XC-08's uniform two-identifier write rule is not yet everywhere.
- **Risk:** Medium — wrong-patient linking remains possible wherever a single
  identifier (CIN) is the only confirmation.
- **Proposed change:** fold into XC-08.
- **Affected:** check-in, lab visit, pharmacy visit flows.
- **Acceptance test:** check-in with a wrong-but-valid CIN attaches to that
  (wrong) patient's record — demonstrate the guard: a mistyped CIN that does
  not match the displayed name/DOB is blocked at confirmation.

### HS-03 — Reception boundaries
- **Existing:** receptionist functions are limited to check-in/out, patient
  lookup, visit status; no access to clinical content beyond identity data;
  clinical records creation happens through doctor-gated functions only
  (`createClinicalRecord`, `createEncounter` verify doctor identity).
- **Reference:** least privilege (ISO 27799; OWASP ASVS).
- **Status:** Satisfied for the functions audited.
- **Risk:** Low.
- **Proposed change:** none.
- **Acceptance test:** a receptionist session attempting a clinical write
  (e.g. create a clinical note) is rejected server-side.

### HS-04 — Hospital code joining and association control
- **Existing:** `generateHospitalCode` (cryptographically random, uniqueness
  checked); doctors join only by code; association changes via
  `hospitalUpdateDoctorAssociation` with logging; radiology department
  enablement and PACS configuration are admin-controlled with status fields.
- **Reference:** OWASP ASVS — secure enrollment; FHIR `PractitionerRole`
  linkage.
- **Status:** Satisfied.
- **Risk:** Low.
- **Proposed change:** none.
- **Acceptance test:** a doctor cannot join by name search; only the code
  works, and the change is logged.