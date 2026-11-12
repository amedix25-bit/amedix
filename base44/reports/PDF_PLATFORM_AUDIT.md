# AMedix — Platform-wide PDF Audit, Repair and Reliability

Date: 2026-11-12 · Scope: every PDF generate / store / retrieve / view / download path.

## 1. Root cause of the reported failure

Opening a **laboratory request** as a patient failed because the request form is stored
with `UploadPrivateFile` and the record keeps the **private storage path**, e.g.

```
pdf_url = "mp/private/<app-id>/47fc8a61a_LabRequest_....pdf"
```

The patient card rendered that value straight into `<a href="...">`. A bare storage path
is not a URL, so the browser requested `<app-host>/mp/private/...` and showed an error
page instead of the PDF. No signing step was involved, so nothing about permissions,
the file itself or the generator was wrong.

The same pattern (a private reference opened directly) existed in **eleven other
places** across the portals. This was one class of defect, not many.

Live audit of 22 existing lab requests:

| stored `pdf_url` | count | behaviour before the repair |
|---|---|---|
| private path (`mp/private/…`) | 2 | **broken** — error page |
| legacy public URL (`…/files/mp/public/…`) | 10 | opened, but a permanent public link to a clinical document |
| none stored | 10 | no PDF button at all (legacy per-test rows) |

## 2. Repairs implemented

**One authorized retrieval path.** Every private PDF is now resolved to a 10-minute
signed URL by the existing access-checked backend function, which verifies the caller
against the record and audits every grant and denial.

- `clinicalFileAccess` gained the missing `clinical_document` kind (patient, authoring
  doctor, approved doctors, admin only).
- Repaired call sites (all now resolve before opening):
  - Patient: laboratory request card, imaging request PDF, visit orders, visit
    documents (clinical document PDF), medical documents (already correct).
  - Doctor: lab history, lab request detail, clinical document card, imaging request
    report file, clinical note → imaging PDF.
  - Laboratory: notification bar, technician upload flow, patient profile view.
  - Radiology / Radiologist: imaging request detail, study context panel (prior reports
    and results), department request dialog, reporting workspace, shared results.
- `clinicalDocumentPdf` now stores signed clinical documents **privately**
  (`UploadPrivateFile`); it previously uploaded them to permanent public storage.

**Viewer reliability.**

- The tab is opened inside the tap and then pointed at the signed URL, so iOS Safari and
  Android Chrome no longer block it (a `window.open` after an `await` is blocked).
- A failure now shows a clear message with the server's reason and leaves the button
  ready to retry, instead of a blank tab or silent failure.

**Existing documents.** Requests saved without a form now render the form on demand from
their own record data (`openLabRequestPdfFromRecord`) — nothing is written back, so no
record is duplicated or replaced, and signatures and history are untouched.

## 3. Verified

- Signed retrieval of a real private lab-request PDF: `clinicalFileAccess` returned
  `200` with a valid signed URL.
- Patient account linkage intact (`PatientProfile.user_id` present), so the patient is
  inside the authorized set for their own requests.
- Source scan: **no direct open of a stored file reference remains** anywhere in the app.
- All generators are synchronous and awaited before the record is written, so a document
  is never marked ready before its PDF exists.
- Production build passes.

## 4. Not verified in this pass

- No real browser click-through per portal (desktop, iPhone Safari, Android Chrome) —
  requires signing in as each role; hand to the Testing Agent.
- The 10 legacy requests that had no stored form now render on demand; that rendering
  was not visually inspected.
- Arabic text inside PDFs is not supported by the generators (standard fonts only) —
  pre-existing, unchanged, needs Arabic font embedding to fix.

## 5. Remaining risks / recommendations

1. Ten legacy lab-request PDFs are still held in **public** storage (pre-existing).
   Migrating them to private storage would close that exposure.
2. Signed URLs live 10 minutes; a document left open longer must be reopened.
3. Arabic PDF output is a separate, larger piece of work (embedded Arabic font + RTL).
