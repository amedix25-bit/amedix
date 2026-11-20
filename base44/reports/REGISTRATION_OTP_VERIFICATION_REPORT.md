# AMedix — Registration, Email OTP and Recovery: Verification Report

Date: 2026-11-20 · Timezone: Africa/Tripoli
Supersedes the "Outstanding risks" wording of `REGISTRATION_OTP_RECOVERY_P0_REPORT.md`
(item 8 of that report is corrected in §8 below).

## How to read this report

Every claim is marked with how it was established:

- **[MEASURED]** — executed against the live backend during this session; the
  actual response is quoted.
- **[INSPECTED]** — established by reading the code that governs the behaviour;
  the file and the decisive lines are named.
- **[NOT DONE]** — not established. Device journeys are **not** done (§11).

Test residue was cleaned up: 11 seeded code records deleted, 1 test draft
deleted. The only lasting additions are append-only audit rows (§10).

---

## 1. Root cause and the changes made

### 1.1 "Resend code" had to be pressed several times

Three independent defects, each sufficient on its own:

1. **No resend guard.** `Register.jsx` called `resendOtp` on every tap — no
   cooldown, no in-flight lock, button never disabled. Every resend issues a new
   code and invalidates the previous one, so several codes were in flight and the
   user typed whichever email arrived first — usually a superseded one.
   **[INSPECTED]**
2. **The app's own gate opened a new challenge per send.** `signupOtp` expired
   every previous challenge and returned a new token, so a delayed email was dead
   on arrival and the screen the user held pointed at a superseded challenge.
   **[INSPECTED]**
3. **No delivery signal.** A refused send was indistinguishable from a successful
   one; nothing was recorded, so nobody could tell whether mail was going out.
   **[INSPECTED]**

### 1.2 An interrupted registration became "email already exists"

1. **Recovery was doctor-only.** The page called `lookupDoctorRegistration`,
   which answers `none` for every non-doctor account, and printed the raw
   platform error. **[INSPECTED]**
2. **Patients had no server-side progress.** `PatientOnboardingForm` wrote only
   in its final step. **[INSPECTED]**
3. **Resuming a confirmed account was impossible.** The continue path used
   `resendOtp`, which only works for an *unconfirmed* account. **[INSPECTED]**

### 1.3 Changes

| Area | Change |
| --- | --- |
| Code lifecycle | One challenge per destination; a resend replaces the code **inside** the existing challenge, keeping the same `challenge_token` |
| Replacement ordering | The old code is replaced **only after** the new one was accepted by the provider |
| Throttling | 60 s cooldown per destination, 3 sends / 15 min per destination, 200 sends / hour overall |
| Brute force | 5 attempts per challenge, then `locked`; attempts reset only by a fresh code |
| Storage | Codes stored as salted SHA-256 only — the `SignupOtp` schema has `code_hash` + `code_salt` and **no plaintext code field** **[INSPECTED]** |
| Delivery log | `delivery_status`, `delivery_error`, `send_count`, timestamps per challenge |
| Recovery | New `registrationState` endpoint: 8 states, no personal data returned |
| Patient persistence | New `PatientRegistrationDraft` + `patientRegistration` save/resume/complete |
| Funnel metrics | New `registrationEvent` endpoint (allow-listed kinds, fingerprinted destination) |
| UI | 45 s resend countdown, disabled button while in flight, spam-folder guidance, "only the newest code works", attempt hint, "use a different email" escape |

---

## 2. Measured OTP behaviour

All responses below are the live backend's, from a single test battery. Seeded
challenge records were deleted afterwards.

### 2.1 Real dispatch through the mail provider — **[MEASURED]**

A genuine code was sent to the app owner's own inbox:

```
dispatch: { accepted: true, expires_in: 600, resend_after: 60,
            send_count: 1, replaced: false }
status:   { valid: true, status: "pending", delivery_status: "sent",
            expires_in: 599, send_count: 1 }
```

The provider accepted the message; the challenge recorded `delivery_status:
"sent"`. This proves the dispatch path end to end. It does **not** prove inbox
placement — see §11.

### 2.2 Resend cooldown — **[MEASURED]**

Immediate second request for the same address, 1 second later:

```
HTTP 429 · { "error": "Please wait 59 seconds before requesting another code.",
             "retry_after": 59 }
```

Second variant, cooldown pre-seeded to 45 s:

```
HTTP 429 · { "error": "Please wait 45 seconds before requesting another code.",
             "retry_after": 45 }
```

Record count for that destination was unchanged by the refused request — nothing
was dispatched and no new challenge was opened.

### 2.3 Per-destination send window — **[MEASURED]**

Three challenges for one destination inside the window, then a send:

```
HTTP 429 · { "error": "Too many codes were requested for this number or email.
             Please try again later." }
records before: 3 · records after: 3
```

### 2.4 Code expiration — **[MEASURED]**

```
verify (expired code): HTTP 400 · { "error": "This code has expired. Request a new one.",
                                    "expired": true }
status after:          "expired"
status endpoint:       { valid: false, status: "expired", expires_in: 0 }
```

### 2.5 Invalid codes and lockout — **[MEASURED]**

Five wrong codes in sequence:

```
1: 400 · attempts_remaining 4 · locked false
2: 400 · attempts_remaining 3 · locked false
3: 400 · attempts_remaining 2 · locked false
4: 400 · attempts_remaining 1 · locked false
5: 429 · attempts_remaining 0 · locked true
```

The **correct** code submitted after lockout:

```
HTTP 429 · { "error": "Too many incorrect attempts. Request a new code.",
             "locked": true }
```

Lockout cannot be bypassed by knowing the code — a new code is required.

### 2.6 Correct code and replay — **[MEASURED]**

```
first verify: 200 · { ok: true, verified: true } · status after: "verified"
replay:       200 · { ok: true, verified: true }
```

The replay is idempotent: it reports the already-verified state rather than
consuming a second code or re-issuing anything.

### 2.7 Concurrent resend requests — **[MEASURED]**

Two simultaneous sends for one destination under an active cooldown:

```
[ { http: 429, retry_after: 30 }, { http: 429, retry_after: 30 } ]
records after: unchanged
```

Two simultaneous verifications of the same correct code:

```
[ { http: 200, verified: true }, { http: 200, verified: true } ]
final status: "verified"
```

**Stated limitation, not a success:** the cooldown is a read-then-write check
**[INSPECTED: `signupOtp/entry.ts` lines 104–111]**, so two *first* sends issued
in the same millisecond could both pass the check before either writes
`cooldown_until`. The blast radius is bounded by the 3-per-15-minutes window and
by the client's in-flight lock, and it cannot produce a security problem (only a
duplicate email). Making it atomic would require a conditional write the entity
API does not expose.

---

## 3. One valid code at a time — and what an older email does

### 3.1 Guarantee

There is at most one outstanding challenge per destination. A resend replaces the
code inside that challenge (same token, fresh hash, `attempts` reset, fresh
expiry) rather than opening a second one **[INSPECTED: `entry.ts` 184–222]**. The
only path that opens a *new* challenge supersedes other pending challenges for
that destination by marking them `expired` **[INSPECTED: 227–229]**. Therefore
exactly one code can ever verify.

### 3.2 Measured behaviour of an older code

**Case A — the user pressed Resend, then typed the code from the older email.**
**[MEASURED]**

```
older code:  HTTP 400 · { "error": "That code is not correct. 4 attempts left.",
                          "attempts_remaining": 4 }
newest code: HTTP 200 · { ok: true, verified: true }
```

The older code is simply wrong now. It costs one of the five attempts but does
**not** lock the challenge, and the newest code still works. This is deliberate:
the message "a newer code was sent" would be a guess, because the system cannot
tell an old code from a typo.

**Case B — the older code belongs to a superseded challenge** (a different
channel or purpose opened a new one). **[MEASURED]**

```
HTTP 400 · { "error": "That code is no longer valid — a newer code was sent.
             Use the most recent email.", "expired": true }
```

**Case C — the user's screen holds a token from before a resend.** Because a
resend keeps the same `challenge_token`, the screen keeps working: it polls
`status` and gets `{ valid: true, expires_in: 597, send_count: 1 }`
**[MEASURED]**. After a replacement it reports `send_count: 2`, so the UI can say
that only the newest email is valid.

**Case D — the provider refuses the resend.** The old code is **not** replaced
and the reply says so (`previous_code_still_valid: true`)
**[INSPECTED: `entry.ts` 164–176]**. The user is never left with no working code.

---

## 4. Interrupt and resume — patient and doctor

### 4.1 Patient — measured round trip **[MEASURED]**

Saved in one request, read back in a separate one:

```
save:   { ok: true, draft_id: "6b001dc5698c10ffa02b9c6e", step: 2,
          state: "incomplete" }
resume: { state: "incomplete", step: 2,
          first_name: "QA", allergy: "penicillin", none_flag: true }
```

Step, personal details, medical answers and section "none" flags all came back.
The draft was then deleted; `PatientRegistrationDraft.count` is back to 0.

Why this is device-independent **[INSPECTED]**: the draft is a server record keyed
on `user_id`, and `resume` reads it from the database after `auth.me()`. Nothing
is held in browser storage, so the device and browser are irrelevant. Autosave
runs 1.5 s after each change and is re-read on mount.

### 4.2 Doctor — already server-side **[INSPECTED]**

`DoctorRegistrationDraft` existed before this work and is unchanged; the recovery
path now routes doctor accounts to it through the same state endpoint.

### 4.3 What is NOT proven — **[NOT DONE]**

No device testing was performed by me. "Works on a second device" is currently
**reasoned from the architecture, not observed**. See §11.

---

## 5. Account classification and routing — **[MEASURED]**

Live calls against real accounts:

| State | How the live example was found | Endpoint answer |
| --- | --- | --- |
| `new` | an address never used | `new` ✅ |
| `unverified` | a real account with `is_verified: false` | `unverified` ✅ |
| `incomplete` | a confirmed account holding **no** portal profile of any type | `incomplete` ✅ |
| `active` | a real confirmed patient | `active` ✅ |
| `blocked` | `user.disabled` branch | **[INSPECTED]** — no disabled account exists to call |
| `rejected` | doctor draft status `rejected` | **[INSPECTED]** — no rejected draft exists |
| `pending_verification` | doctor profile `is_verified: false` | **[INSPECTED]** — see below |
| `rate_limited` | 10 lookups / address / hour | **[INSPECTED]** — threshold not exercised |

**Disclosed finding.** A doctor holding `DoctorProfile.is_verified: false` was
classified `active`. This is **correct**, not a bug: that same account also holds
another portal profile, and the endpoint checks working portal profiles first
**[INSPECTED: `registrationState/entry.ts` 82–88]**. I could not produce a
doctor-only unverified account from the existing data, so the
`pending_verification` branch is verified by inspection only. I did not create a
fake doctor to force it.

Routing **[INSPECTED]**: each state maps to one way forward — `unverified` →
"send code and continue"; `incomplete`/`pending_verification` → "log in and we
take you back"; `rejected`/`blocked` → contact administration; `active` → sign in
or reset password. The endpoint returns a state code and nothing else — no name,
role, CIN or saved answers **[MEASURED: response bodies above contain only
`state`]**.

---

## 6. Draft security — **[MEASURED] + [INSPECTED]**

**Access rules [INSPECTED — `PatientRegistrationDraft.jsonc`]:**

| Operation | Rule |
| --- | --- |
| read | `data.user_id == user.id` **or** admin |
| create | `data.user_id == user.id` (forced — a draft cannot be created for someone else) |
| update | `data.user_id == user.id` **or** admin |
| delete | admin only |

**Server-side ownership checks [INSPECTED]:** the function never accepts a
`user_id` from the browser — it derives it from `auth.me()` and filters on it
**[`patientRegistration/entry.ts` 18–26]**.

**Cross-account document rejection [MEASURED].** A real
`IdentityVerification` id belonging to a *different* account was submitted with a
save:

```
foreignDocumentIdSent: "yes"
storedDocumentId: "(empty — rejected)"
```

The reference was refused and the draft stored nothing.

**No personal data in the audit log [MEASURED]:** 20 `RegistrationEvent` rows, all
carrying a SHA-256 fingerprint of the destination, none carrying an address
**[verified earlier this session]**. No code, password or document content is
written to any log.

**Payload bound [INSPECTED]:** 250,000 characters, above which the save is
refused rather than truncated.

---

## 7. Documents and drafts through recoverable failures

**Drafts [INSPECTED + MEASURED]:** the draft lives in its own entity and is
independent of the identity job; a failed verification cannot delete it. A late
autosave cannot reopen a completed draft **[`entry.ts` 62–65]**.

**Documents [INSPECTED]:** the failure handler writes only status, reason and
history:

```
recordFailure → { job_status: FAILED | MANUAL_REVIEW, status: 'pending',
                  reason, last_error, review_reason: "The document was received
                  and is safe … Nothing needs to be uploaded again." }
```

`finish()` performs a **partial** update — `...patch`, `job_completed_datetime`,
`review_history` — so `file_uri` is never touched by a failure. `runJob` reads the
document from private storage and states that "a failure at any step leaves it
untouched". `retainedFields()` sets `document_retained: true` on submission. The
public job view exposes `can_resume`/`can_retry` only while `file_uri` is present.

**Honest gap [MEASURED]:** of 142 `IdentityVerification` records there are
currently **0** in `processing_failed` and **0** in `manual_review`. So the
retention behaviour is verified by inspection of the only code path that can
change a job — there is no live failure to point at. Forcing one would mean
corrupting a real submission, which I will not do.

---

## 8. SPF, DKIM and DMARC for amedixly.com — **correction to the earlier report**

**The earlier report was wrong to suggest that missing SPF/DMARC on
`amedixly.com` explains slow code delivery. It does not, and I retract it.**

Live platform state, read this session:

- Secrets configured: `resala` only (the SMS provider).
- Custom domains: `amedixly.com` — **DNS not checked, no successful check
  recorded** (added 2026-10-23).

**There is no custom email-sending domain configured for this app.** The codes
are sent by the platform's built-in `SendEmail` from the platform's own sending
domain, not as `@amedixly.com`. Consequently:

- **No SPF, DKIM or DMARC record is required on `amedixly.com` for these
  verification emails to be delivered.** Adding them would not change delivery of
  the current mail.
- The DNS records for `amedixly.com` that matter today are the ones for
  **connecting the web domain** — and the platform reports that check as never
  having succeeded. That is a separate problem from email.
- I cannot state the exact record values, because none are configured. When email
  sending is set up, the platform generates the precise records (including the
  DKIM selector, which is provider-specific and cannot be guessed) — they appear
  under **Dashboard → Domains → "Sending address"** (with "Edit sending address"
  and "Preview DNS" / "DNS instructions"), and the setup entry point is
  **Dashboard → Emails → "Set up email sending" / "Buy or connect a domain"**.
  Publishing records I invented would be worse than publishing none.

If mail *should* come from `@amedixly.com` (better branding, better inbox
reputation once authenticated), the order is: connect and verify the domain →
set up email sending → publish exactly the SPF, DKIM and DMARC records the
dashboard then displays → start DMARC at `p=none` and tighten later. That is a
plan, not a measurement, and it needs a paid plan plus a verified domain.

---

## 9. Existing data, permissions and workflows

**Data [MEASURED — live counts, nothing removed or migrated]:**

| | | | |
| --- | --- | --- | --- |
| User 39 | PatientProfile 30 | DoctorProfile 16 | Appointment 8 |
| Prescription 6 | LabRequest 26 | ImagingRequest 8 | AccessRequest 22 |
| MedicalDocument 4 | ClinicalNote 13 | Encounter 7 | FamilyHistory 41 |
| Allergy 2 | Medication 36 | HospitalProfile 1 | LaboratoryProfile 1 |
| PharmacyProfile 1 | RadiologistProfile 3 | RegistrationCode 4 | RegistrationEvent 20 |

**Schema changes [MEASURED — file timestamps]:** 115 entity schemas exist. Only
three were written today by this work — `RegistrationEvent`,
`PatientRegistrationDraft`, `SignupOtp` (all 09:56). `IdentityVerification`
(09:48) belongs to the earlier identity-pipeline work. Every other schema is
dated 2026-11-19 or earlier: **no existing entity was modified**, so no field,
enum or stored value changed shape.

**Permissions [INSPECTED]:** no existing entity's `rls` block was edited. The
three new entities carry their own rules; the draft's rules are in §6. Existing
role assignments were untouched.

**Workflows [INSPECTED]:** no workflow was created, edited, paused or archived by
this work; the seven existing workflow definitions are unchanged.

**Residue I created and did not remove:** append-only `RegistrationEvent` audit
rows (state lookups, funnel events, `registration_completed`). These are the
delivery metrics and are immutable by design. All seeded code records and the test
draft were deleted; `SignupOtp` count is 0 and
`PatientRegistrationDraft` count is 0.

---

## 10. What is genuinely still unproven

1. **No device testing. [NOT DONE]** No mobile or desktop journey was run by me.
   The complete patient and doctor journeys must be executed in the Testing Agent
   (test-tube icon, side panel) before this is signed off — see §11.
2. **Inbox placement. [NOT DONE]** The provider accepted the message; whether it
   lands in the inbox or the junk folder is not measurable from the app.
3. **`pending_verification`, `rejected`, `blocked`, `rate_limited`. [INSPECTED]**
   No live example existed; only the code path was verified.
4. **Zero live verification failures. [MEASURED]** Retention is proven by code
   path, not by a real failed job.
5. **Send-race window. [INSPECTED]** Two same-millisecond first sends could both
   dispatch; bounded by the 15-minute window (§2.7).
6. **Rate limits are per destination and global, not per IP.** The functions do
   not receive a reliable client address.
7. **Autosave is debounced, not transactional.** A change in the final ~1.5 s
   before a hard crash can be lost.

---

## 11. Required before sign-off — device journeys

Run these in the Testing Agent, on a phone and on a desktop:

**Patient**
1. Register with a new address → receive the code → verify → complete onboarding.
2. On step 2, close the browser → reopen → log in → answers restored, same step.
3. Repeat step 2 on a **different device**.
4. Press Resend, then type the code from the **first** email → confirm the
   "not correct, 4 attempts left" message and that the newest code still works.
5. Enter five wrong codes → locked → request a new code → succeeds.
6. Confirm the email in one tab, then submit the same address again → "already
   registered, sign in", never a dead end.
7. Return after several hours → resume.

**Doctor**
8. Repeat 1–4 on the doctor flow, including the hospital-code gate.
9. Submit and confirm the "under review" routing.

**Cross-cutting**
10. iOS Safari and Android Chrome, plus one throttled-connection run.
11. Check the junk folder outcome and report it.
12. Verify the domain connection status under Dashboard → Domains.

Suggested Testing Agent goals:

- "Register a new patient on mobile, close the browser mid-onboarding, and resume
  on desktop to the same step."
- "Press resend twice during patient sign-up, then submit the older code and
  confirm the app explains only the newest code works."
