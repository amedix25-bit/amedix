# AMedix — Mandatory Doctor Signature for Every Laboratory Request

Date: 2026-11-12 · Scope: laboratory request issuance only. No other clinical
workflow, template, record or portal was redesigned.

## 1. What the audit found (before any change)

- Laboratory requests are created in exactly one place: the doctor's review
  screen (`DoctorLabRequests`) generates the PDF in the browser, uploads it with
  `UploadPrivateFile`, then calls the `createLabRequest` backend function, which
  writes the record with the service role (client writes are blocked by RLS).
  **That function is the only effective enforcement point** — a frontend-only
  rule would be bypassable.
- The existing PDF already reserved a signature block ("Requesting physician —
  signature & stamp" + "Date"), so the layout needed no redesign: the signature
  is placed into that reserved area.
- No signature store, no signer identity on the record, and no unsigned/issued
  distinction existed. Existing records: 22, all unsigned.

## 2. What was built

**Private signature store — new `DoctorSignature` entity (one active per doctor).**
Private storage URI, PNG/JPG only, 1 MB cap, drawn vs uploaded source, `version`
incremented on every replacement, append-only `audit` (created / replaced /
deleted). Read and write are restricted to the owning doctor (`user_id`) plus
AMedix administrators, so a signature is never readable by another doctor or by
a laboratory. Deleting marks the record `deleted` (unusable for signing) instead
of erasing the history.

**Doctor Portal → Settings → "My Professional Signature".** Draw on a signature
pad (mouse, touchscreen, stylus), or upload a PNG/JPG. Preview, replace, delete.

**Signing block on the review screen (mandatory).** Two routes, as specified:
(A) Use my saved professional signature — previewed, then an explicit
confirmation checkbox is required; (B) Sign now — draw or upload immediately; a
doctor with no saved signature creates one inline without losing the request.
The applied signature can be removed before submission. Changing the request
(going back to editing) discards the signature, so a signature never covers
content it did not see.

**Server-side enforcement in `createLabRequest`.** The request is rejected with
400 `signature_required` when no signature is supplied, and with 403 when the
signature record does not belong to the authenticated doctor, is not `active`,
has no stored image, or belongs to a different doctor profile. Every signer
field — identity, licence, timestamp, version, reference, source and the
signature audit entry — is written **by the server**; values sent by the browser
are overwritten. Nothing is ever auto-signed. Because the request is not created
until it is signed, an unsigned request cannot exist, let alone be issued, sent
to a patient or transmitted to a laboratory.

**Signed PDF.** The signature image is drawn into the reserved signature area
above the line, with the doctor's full name, specialisation, licence number and
hospital, "Electronically signed by …", the signing date/time, the signature
reference (`SIG-V<version>-<request suffix>`) and the unique request ID. Existing
sections — patient identity, CIN, tests by specimen, priority, clinical
information, instructions, branding, QR code — are unchanged.

**Laboratory view.** Each request now shows the ordering doctor and either
"Signed by Dr … · SIG-V2-8F3K" or, for pre-existing records, "Legacy request —
issued before professional signing". The signed PDF is the same authorised,
signed-link download the patient already uses.

## 3. Existing requests (no record deleted or altered clinically)

All 22 existing requests were classified `signature_status: legacy_unsigned` —
a classification field only. No signature was applied retrospectively, no PDF was
regenerated, no clinical field was touched. They remain readable, are clearly not
presented as signed, and await an administrator-approved migration decision.

## 4. Verified in this pass

- Build passes; signature storage round-trip confirmed (create → read → version
  bump → delete).
- `createLabRequest` rejects calls before signature validation when the caller is
  not the owning doctor (identity is checked first, by design).
- All 22 existing requests classified, none auto-signed.

## 5. Not verified here — needs a live doctor session

The signature-required branch sits after doctor-identity and hospital check-in
validation, which require a real doctor account with an active check-in. These
must be confirmed in the app (Testing Agent): submit blocked while unsigned,
submit succeeds when signed, saved-signature path, drawn path, uploaded path,
invalid image rejected (>1 MB / wrong type), another doctor's signature rejected,
and the signature appearing on the patient's and laboratory's copy of the PDF.

## 6. Known limitation, unchanged

PDF text is Latin-only (jsPDF standard fonts) — Arabic content does not render in
any AMedix PDF, including this signature block. This is a pre-existing limitation,
not introduced here.
