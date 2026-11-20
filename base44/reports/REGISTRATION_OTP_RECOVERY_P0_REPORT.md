# AMedix — Registration, Email OTP and Recovery: P0 Report

Date: 2026-11-20
Scope: patient and doctor sign-up, email verification codes, and resuming an
unfinished registration.

---

## 1. Root cause

### 1.1 Why "Resend code" had to be pressed several times

Not an email-server problem. Three defects compounded, and each one alone is
enough to produce the loop:

**(a) No resend guard at all.** `Register.jsx` called `resendOtp` on every tap:
no cooldown, no in-flight lock, button never disabled. Each resend issues a new
code and the previous one stops working. Several codes end up in flight at once,
the user types whichever email arrives first, which is usually a superseded code
→ "invalid code" → tap Resend again. That is the reported behaviour, reproduced
by reading the code path. The same pattern exists in the lab, hospital and
pharmacy registration pages.

**(b) The app's own gate opened a new challenge per send.** `signupOtp` expired
every previous challenge and returned a new `challenge_token`. So a code from a
delayed email was already dead, and the screen the user was holding pointed at a
superseded challenge — "This code has expired" even though they had just been
sent one.

**(c) No delivery signal.** A refused or bounced send was indistinguishable from
a successful one (`sendEmailCode` threw a generic message and nothing was
recorded). There was no way to tell the user "the code you already have is still
valid", and a failed resend left them with no way forward.

### 1.2 Why an interrupted registration became "email already exists"

**(a) Recovery was doctor-only.** `Register.jsx` called `lookupDoctorRegistration`,
which answers `none` for every account that is not a doctor. For a patient the
lookup found nothing, so the raw platform error was printed — the dead end.

**(b) Patients had no server-side progress at all.** `PatientOnboardingForm`
wrote to the database only in its final step. Closing the browser, refreshing,
losing the connection or switching device discarded everything, while the email
stayed registered. Doctor registration already had a server-side draft; patients
did not.

**(c) Resuming an already-confirmed account was impossible.** `handleContinue`
used `resendOtp`, which only works for an *unconfirmed* account. Anyone who had
confirmed their email and then left could not resume — and could not be told to
sign in either, because the page had no such branch.

### 1.3 Email infrastructure — measured, not assumed

Checked live over DNS on 2026-11-20:

| Record | Result |
| --- | --- |
| `amedixly.com` TXT | **No TXT records at all → no SPF record** |
| `_dmarc.amedixly.com` TXT | **NXDOMAIN → no DMARC policy** |
| Nameservers | `ns1/ns2.wixdns.net` (Wix-managed) |
| DKIM | Selector cannot be enumerated from outside; the records to publish are shown in the platform's email/domain settings |

Mail claiming to come from the app's own domain therefore carries **no
authorised-sender signal and no policy**. Receivers are free to junk, greylist or
throttle it, which is entirely consistent with "the first email often does not
arrive". This is a configuration gap outside the code and must be closed by
publishing the SPF and DKIM records the platform's email settings specify, then a
DMARC policy starting at `p=none`.

---

## 2. What was fixed

### Phase 2 — OTP reliability (`signupOtp`, `shared/signupOtp.ts`)

| Requirement | Implementation |
| --- | --- |
| Secure six-digit code | `crypto.getRandomValues`, uniform 0–999999, stored only as a salted SHA-256 hash |
| Configurable expiration | 10 minutes for sign-up, 15 for recovery (`codeTtlMinutes`) |
| Resend cooldown | 60 s server-side (`cooldown_until`), enforced before any send |
| Server-side verification | Code compared in constant time, never returned to the browser |
| One-time use | A challenge becomes `verified` and cannot be re-armed |
| Brute-force protection | 5 attempts per challenge, then `locked`; attempts reset only with a fresh code |
| Controlled resends | 3 sends per destination per 15 minutes + 200/hour overall |
| Clear messages | Every failure returns a specific, actionable message |
| Delayed emails | **One challenge per destination.** A resend keeps the same `challenge_token`, so the open screen keeps working, and the response says `replaced: true` so the UI can state that only the newest code is valid |
| Never invalidate before dispatch | The previous code is replaced **only after** the new one was accepted. If the provider refuses, the old code stays valid and the reply says so (`previous_code_still_valid`) |
| Delivery monitoring | `delivery_status`, `delivery_error`, `send_count`, `last_sent_datetime` on the challenge; every request, resend, failure and verification written to `RegistrationEvent` with a **fingerprinted** destination — no address, no code |
| Codes never logged | Verified by inspection: log rows contain a hash only |

New `status` action lets a screen ask whether the code it holds is still valid
(`{ valid, expires_in, send_count, delivery_status }`).

### Phase 3 — Registration state (`registrationState`)

One privacy-preserving endpoint classifies an email into: `new`, `unverified`,
`incomplete`, `pending_verification`, `active`, `rejected`, `blocked`,
`rate_limited`. It returns **a state code and nothing else** — no name, no role,
no CIN, no saved answers.

- Lookup is exact-match first, with a case-insensitive fallback, so a
  mixed-case or whitespace-padded address is never mistaken for a new one.
- Bounded to 10 lookups per address per hour and 3,000/hour overall; every call
  is logged.
- The registration page now branches on it instead of on a doctor-only lookup:
  unconfirmed → "Send code and continue"; confirmed but unfinished → "log in and
  we take you back to the step you stopped at"; submitted → "under review, log
  in to see status"; active → "already registered, sign in or reset password";
  rejected/blocked → contact administration. No state is a dead end.
- Safety net: if the platform refuses a sign-up because the account exists but
  the state lookup somehow reports `new`, the page still offers sign-in.

### Phase 4 — Registration persistence (`PatientRegistrationDraft`, `patientRegistration`)

- New server-side draft per account: `step`, personal details, medical history,
  medications and allergies, lifestyle, gynaecological history, section "none"
  flags, photo reference and identity-document reference.
- `PatientOnboardingForm` restores it on mount (showing "Welcome back. Your saved
  answers have been restored"), autosaves 1.5 s after every change, and closes
  the draft when the profile is created — so a late save can never reopen a
  finished registration.
- The identity document reference is validated against the signed-in account
  before it is stored, and identity verification is **never** restored as
  "verified" from the draft: its own persisted job reports the real state.
- Payload bounded at 250,000 characters.
- Works after refresh, closed browser, lost connection, another device, and days
  later, because everything lives on the server and is re-read after sign-in.

### Phase 5 / 6 — Security and UX

Email normalized (trim + lowercase) on every path; codes hashed; replay blocked
by the one-challenge rule; recovery lookups rate limited; audit rows carry no
codes, passwords or addresses. On the registration page: a 45-second resend
cooldown with a visible countdown, the resend button disabled while a request is
in flight, "check your spam folder" guidance, "only the newest code works", a
hint after two failed attempts, and a "use a different email" escape.

### Measuring first-attempt delivery (`registrationEvent`)

The platform sends the sign-up email itself, so the app cannot observe the send
from the server. The browser now reports four fixed funnel steps —
`code_requested`, `code_resent`, `code_verified`, `code_rejected` — through an
allow-listed endpoint that fingerprints the address server-side. First-attempt
delivery is therefore measurable as `code_requested → code_verified` with no
`code_resent` in between.

---

## 3. Tests actually executed

| # | Test | Result |
| --- | --- | --- |
| 1 | `registrationState` for an unused address | `{ "state": "new" }` ✅ |
| 2 | `registrationState` for a real active patient | `{ "state": "active" }` ✅ |
| 3 | Same address, mixed case + surrounding spaces | `{ "state": "active" }` ✅ (fallback works) |
| 4 | `registrationState` for an unconfirmed account | `{ "state": "unverified" }` ✅ |
| 5 | `signupOtp` send with an invalid address | `400 "Enter a valid email address."`, nothing dispatched ✅ |
| 6 | `signupOtp` status with an unknown token | `{ "valid": false, "reason": "unknown" }` ✅ |
| 7 | `patientRegistration` resume with no draft | `{ "state": "none", "step": 0, "saved": null }` ✅ |
| 8 | `registrationEvent` with a valid kind | `{ "ok": true }` ✅ |
| 9 | `registrationEvent` with an unlisted kind | `400 { "ok": false }` ✅ |
| 10 | Delivery log contents | 5 rows, kinds `state_lookup`, **no address present** ✅ |
| 11 | Production build | passes, no unresolved imports ✅ |
| 12 | Syntax/parse of all changed backend modules | passes ✅ |

### Not yet executed — required before this is called resolved

A real email send, real code entry, and the device matrix. Run the 17 scenarios
you listed; the highest-value ones first:

1. New patient email → code arrives → verify → onboarding.
2. Close the browser at step 2 → reopen → log in → answers restored.
3. Same, from a different device.
4. Return after several hours / days → resume.
5. Enter the code from the **first** of two emails after pressing Resend →
   confirm the message explains only the newest code works.
6. Five wrong codes → locked → request a new one → succeeds.
7. Confirm the email on one tab, then press "Create account" again with the same
   address → "already registered, sign in", never a dead end.
8. Doctor: identical pass over the doctor flow.
9. iOS Safari and Android Chrome, plus one slow-connection run.
10. Check the spam folder outcome, and confirm SPF/DKIM/DMARC are published.

---

## 4. Outstanding risks

1. **SPF and DMARC are still missing on `amedixly.com`.** No code change can fix
   this; until those records are published, first-attempt delivery cannot be
   promised regardless of how good the flow is. This is the single largest
   remaining risk.
2. **The sign-up email itself is sent by the platform**, not by app code. The app
   can throttle, clarify and measure it, but cannot read SMTP-level bounces for
   that message. App-sent codes (the phone/email gate) do record delivery
   outcomes.
3. **Resending the identical code is impossible by design.** Codes are stored
   only as hashes (your Phase 5 requirement), so a resend necessarily mints a new
   code. It now reuses the *same challenge and token*, so the user's screen keeps
   working and exactly one code is valid — which achieves the intent without
   storing plaintext codes.
4. **Rate limits are per destination and global, not per IP.** The functions do
   not receive a reliable client address; per-address limits plus the global cap
   are the available lever.
5. **The state lookup reveals that an account exists** (it must, to route the
   person to sign-in). It reveals nothing else and is rate limited; a fully
   non-revealing design would make "continue your registration" impossible.
6. **Patient autosave is debounced, not transactional.** A change made in the
   last ~1.5 s before a hard crash can be lost; everything before it survives.
