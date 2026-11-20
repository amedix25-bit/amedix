# AMedix — Identity Verification P0: Root Cause and Repair

Date: 2026-11-20
Scope: the complete document-verification pipeline, patient and doctor.

---

## 1. Root cause

The failures were **not** an OCR accuracy problem. Three defects compounded, and
each one produced one of the reported symptoms.

### 1.1 The document was never saved (architectural)

`verifyIdentityDocument` was built as a **zero-retention, single-request**
function. The browser held the pages as base64 in React state and sent them
inside one function call; the function decoded them in memory and wrote only a
decision at the very end. Nothing was ever uploaded.

Consequences, exactly as reported:

| Reported symptom | Mechanism |
| --- | --- |
| Documents "disappear" | There was never a stored document. |
| Repeated upload attempts | Any failure destroyed the only copy (it lived in a React state variable). |
| No manual review | Nothing existed for an administrator to open. `documentRender` and `documentRenderToken` were unreachable dead code. |
| Duplicate submissions | No job record, no idempotency key. |
| Cannot resume registration | No persisted job; the upload state died with the tab. |

### 1.2 The whole check ran inside one request, with a long tail

`recogniseDocument` ran up to 8 vision passes in two batches of four with a
**60 s timeout each**, plus an extractor pass (60 s) and an advisory pass
(30 s) — worst case ≈ 210 s, on top of PDF decoding.

- The platform cuts a function at 5 minutes.
- The record was written **only after** all passes finished, so a request that
  was cut off left **no record at all**: no status, nothing for support to see,
  nothing to resume. The client showed a generic error and the user retried from
  zero. This is the "processing errors / indefinite loading" symptom.

### 1.3 The recognition engine asked for a model the gateway no longer serves

`base44/shared/documentOcrEngine.ts` requested `gemini_3_1_pro` for passes A and
C, and `verifyIdentityDocument` requested it again for the advisory pass. The
current platform model catalog does not include that id.

Every failure path swallowed the reason:

- `readDocumentWithVision`: `if (!response.ok) return null`
- `visionPass`: `catch { return null }`

So a 400/404 from a dead model id was **indistinguishable from an unreadable
document**. With A and C gone, half the readings vanished, consensus could not
reach `enoughEvidence`, and the outcome became `unreadable` → `status: 'failed'`
for perfectly valid documents. This is the "valid documents rejected" symptom.

### 1.4 Contributing defects found in the same pipeline

- **Scanned PDFs could never be read.** `decodeDocument` extracted pages by
  scanning for JPEG markers. Scanner output is usually CCITT G4, JBIG2, JPX or
  PNG — no JPEG stream — so `prepareInMemoryDocument` returned `undecodable`
  and the document was refused as "could not be opened".
- **Multi-page PDFs were truncated** to the first 2 pages; a number on page 3
  was simply never seen.
- **MIME was trusted from the browser.** A JPEG renamed `.pdf`, or a HEIC photo
  declared `image/heic`, failed at decode or was refused by an allow-list. No
  file-signature check existed anywhere.
- **Size limit was an artefact of the architecture**: PDFs over 8 MB were
  refused outright with "photograph the pages instead".
- **Unreadable was final.** There was no path to a human, and `status: 'failed'`
  required a new upload.
- **No admin review surface existed at all** — `IdentityVerification` was
  referenced in the frontend only by the submission card.

---

## 2. What was rebuilt

### New data model (`IdentityVerification`)

A verification is now a **job**: `job_id`, `job_status`, `attempts`,
`max_attempts`, `processing_token`, `job_started_datetime`,
`job_completed_datetime`, `last_error`, `idempotency_key`, `file_uri`,
`file_name`, `file_mime`, `file_size`, `page_count`, `pages_read`,
`detected_format`, `decision_source`, `expected_number`.

Lifecycle:

```
uploaded ──▶ processing ──▶ approved | rejected | manual_review
                  │
                  └──▶ processing_failed ──(retry)──▶ processing
```

### New shared pipeline — `base44/shared/verificationPipeline.ts`

- **Save first.** The document reaches private storage before anything else
  happens. Every later step reads that stored file.
- **Persistent job with a reference** (`VRF-YYYYMMDD-XXXX`).
- **Idempotency.** The key is account + document category + stored file +
  entered number; re-submitting the same document returns the existing open job
  instead of opening a second one.
- **Atomic claim.** A worker writes a random `processing_token` and may only
  record a result while its token is still the one on the record — two
  concurrent workers can never both decide the same document.
- **Controlled retry.** A technical failure increments `attempts`; up to
  `max_attempts` the job is `processing_failed` and retryable, then it goes to
  `manual_review`. Never a rejection.
- **Stale recovery.** Any status read (`verificationJobStatus`, the admin queue)
  moves a job abandoned in `processing` for over 6 minutes to `manual_review`.
  Nothing can sit in processing forever.
- **Never deletes the document.** No code path removes the file or clears its
  reference; `purgeVerificationDocuments` now explicitly skips records written
  under the new policy.

### New recognition engine — `base44/shared/documentOcrEngine.ts`

- Model ids from the current catalog: `gemini_3_8_flash`, `claude-sonnet-5`,
  `gpt_6_sol`. Two vendors must agree.
- **One overall budget** (95 s default, 140 s hard cap) instead of per-pass
  minutes; at most four passes in one batch, plus one third-pipeline pass only
  when the first two did not settle.
- **MRZ readings are decisive on their own** — they are validated by their own
  check digits.
- **PDF-native fallback**: when page pixels cannot be extracted (or the PDF is
  over 12 MB), the stored PDF itself is read as a document through
  `InvokeLLM` with `file_urls`, by two independent models that must agree.
- Every pass now reports **why** it produced nothing (`http_404`, `timeout`,
  `unparsable_reply`), so a dead model can never again look like a bad passport.

### New format detection — `base44/shared/documentFileTypes.ts`

PDF / JPEG / PNG / HEIC identified from **magic bytes**, never from the
browser's MIME claim. Limits raised to 30 MB.

### New endpoints

| Function | Role |
| --- | --- |
| `submitVerificationDocument` | Records the job for an already-uploaded file; returns at once. |
| `processVerificationJob` | The worker: reads the stored file, decides, records. Re-callable for the same job. Also accepts a corrected number. |
| `verificationJobStatus` | Poll + resume; repairs stale jobs. |
| `verificationAdminReview` | Admin-only queue, signed-URL document opening with an access log, approve/reject. |
| `verifyIdentityDocument` | Compatibility shim for tabs already open; refuses inline pages with a clear message. |

### Frontend

- `DocumentScanUpload` uploads the assembled PDF (all pages, not just two) to
  **private storage** before handing over; the review/rotate/retake step is
  unchanged.
- `DocumentVerificationCard` shows the persisted job, polls while it runs,
  offers **Start check / Check again** for the *same stored document*, a
  corrected-number re-check for a mismatch, and "Submit a different document"
  only when the user actually wants to replace it.
- `verificationStatus.js` maps the seven job states.
- `AdminDashboard → Document Review` lists everything in manual review with its
  document, notes and approve/reject.

---

## 3. Security

- Documents are in **private storage**; the browser never receives a permanent
  URL. A short-lived signed link is minted server-side, for the owner or an
  administrator only.
- Every administrator opening of a document is appended to
  `document_access_log` and `review_history`.
- Approve/reject is admin-only (`role === 'admin'`, 403 otherwise).
- Logs carry a job reference and an error code — never a document, a number or
  document content.
- Format and size are validated server-side from the bytes themselves.

**Policy change, deliberate:** the previous zero-retention policy is replaced.
A document must outlive a failed check for manual review and for the user to
resume, which is incompatible with never storing it. The record now declares
`retention_policy: verification_v2_private_storage`, `document_retained: true`.
The entered number is stored server-side (`expected_number`, never returned to
the browser) so a job can be re-checked from any session without the user
retyping or re-uploading.

---

## 4. Verification performed

| Check | Result |
| --- | --- |
| Frontend production build (`vite build`) | **passes**, no unresolved imports |
| Syntax/parse of all 11 changed backend modules (esbuild, ESM) | **passes** |
| Storage → job → worker → decision trace, by reading every path end to end | consistent; every failure branch preserves `file_uri` |
| Auto-rejection on unreadable | **removed** — `unreadable` always goes to `manual_review` |
| Dead-model-id failure mode | **removed** — model ids from the catalog; failures now logged with a reason |
| Live runtime execution of the functions | **not run in this session** (a backend test call was declined). The runtime proof is the UAT script below. |

---

## 5. Required UAT (must be completed before this is called resolved)

Run with one patient and one doctor account, on desktop, Android and iOS.

1. **Happy path** — passport photo, correct number → job `uploaded` →
   `processing` → `approved`; registration completes.
2. **Scanned PDF** (a real scanner PDF, not an exported image) → processed, not
   "could not be opened".
3. **Multi-page PDF** with the number on page 3 → processed.
4. **Unreadable photo** (blurred/glare) → `manual_review`; document present in
   Document Review; the user is told no re-upload is needed.
5. **Tab closed mid-check** → reopen the form: same job, status shown, "Check
   again" works, no re-upload.
6. **Duplicate submission** — submit twice quickly → one job, not two.
7. **Mismatched number** → `rejected`; "Re-check" with the corrected number
   succeeds on the same stored document.
8. **Admin review** — open the document (a signed link, and an access-log entry
   is written), approve → the account's verification becomes `verified` and
   registration completes.
9. **Timeout / storage failure** — simulate by pausing the network during the
   worker: job must end `processing_failed` or `manual_review`, never rejected,
   and the document must still open in Document Review.
10. **HEIC from iPhone** (Safari) → converted client-side and verified; from
    Android Chrome → clear "cannot open this format" message, not a silent fail.

---

## 6. Remaining limitations

- **HEIC on Android Chrome** cannot be decoded in the browser at all. The user
  is told to use the camera or a PDF; the file is not silently lost.
- **Rotated/skewed pages** are handled by the browser's EXIF-aware re-encode and
  the manual rotate control; server-side deskew is measured and reported but not
  applied to the image.
- **File ownership of a `file_uri`** cannot be proven server-side (the upload is
  client-side and private URIs carry no owner metadata). A leaked URI could be
  attached to another account's job. URIs are only ever exposed to their owner
  and to administrators, so this needs a leak first — but it is a residual risk.
- **No automated retention/expiry job** for approved documents yet; they are
  retained indefinitely so an approval can always be audited. A retention
  schedule is the natural next step.
- **No user notification** when an administrator approves; the user sees the
  verified state on their next visit and registration completes then.
