# AMedix — P0 Password Reset and Account Recovery Repair

Investigated first, changed second. Authentication in AMedix is platform-owned
(sign-up, login, password reset, sessions); the app's own code only drives the
screens and, for three staff account types, an app-managed credential.

---

## 1. What was inspected

| Layer | File / endpoint | Finding |
|---|---|---|
| Reset request page | `src/pages/ForgotPassword.jsx` | Called `base44.auth.resetPasswordRequest(email)` and **swallowed every error** (`catch {}`), then always rendered “you'll receive a link shortly”. No cooldown, no retry state, no way to tell a rejected request from an accepted one. |
| Reset page | `src/pages/ResetPassword.jsx` | Read `?token=` only; submitted with no password policy check; **redirected to `/login` with no confirmation** the moment the API resolved; on an expired/used token it showed a red line but offered no way to request a new link; never verified the new credential worked. |
| Reset backend | `POST /api/apps/{app_id}/auth/reset-password-request`, `POST …/auth/reset-password` (platform auth, via `base44.auth`) | The only password store for patients, doctors, hospital users, radiologists, admins. No app-side password column exists for these types — verified by inspecting every entity schema. |
| Login | `src/pages/Login.jsx` → `base44.auth.loginViaEmailPassword` → `checkPortalAccess` | Reads the same platform credential the reset writes. No second password record exists. |
| SDK | `@base44/sdk` `modules/auth.js` | `resetPassword({resetToken,newPassword})` posts `reset_token` / `new_password` — the parameter names the page uses are correct, so the call was never a silent no-op. |
| Email delivery | `GET /api/apps/{app_id}/emails/stats` | See §3 — the instrument does not appear to cover auth system emails. |
| Staff credentials | `HospitalReceptionist`, `LabTechnician`, `Pharmacist` entities + `hospitalReceptionistLogin`, `labTechnicianLogin`, `pharmacistLogin` | **These three account types do not use the platform password at all.** They authenticate against `password_hash` + `salt` on their own staff record. The public reset page cannot change that credential. |
| Staff reset path | `HospitalReceptionistsSection`, `LabTechniciansSection`, `PharmacyPharmacistsSection` | The facility administrator already has a working “reset password” action. Client and server hash functions are byte-identical (`SHA-256(salt:password)`), so a facility reset produces a hash the login accepts. |

## 2. Root causes

### RC-1 — The request page reported success for requests it never confirmed (measured by inspection, fixed)
`catch {}` + unconditional “you'll receive a link shortly” meant a rejected request
was indistinguishable from an accepted one. The platform documents one shared
per-IP rate limit across registration, OTP, login and password reset, so a user who
retried rapidly could be refused while the screen kept saying the email was on its
way. That is the mechanism behind “emails are not consistently delivered” as far as
app code is concerned: the user was told to wait for mail that was never requested.

### RC-2 — Nothing confirmed the new password before declaring success (measured by inspection, fixed)
The old reset page navigated away the instant the API resolved. There was no
verification that the credential had actually changed, so any failure downstream
surfaced only later, at the login screen, as “the new password does not work”.
The repaired page now **proves the credential by signing in with it** before it says
the password was updated, and reports a failure explicitly if that proof fails.

### RC-3 — An expired or already-used link was a dead end (fixed)
The platform rejects an unknown, expired or already-used token with
`Invalid or expired reset token` (measured, §3). The old page printed that as a red
line and left the user on the same dead form. The page now has a dedicated state
that says the link expired or was used, and offers **Request a new link**.

### RC-4 — Staff account types could never be fixed by the reset email (fixed by telling the truth)
Receptionists, laboratory technicians and pharmacists sign in with a password stored
on their facility staff record, not the platform credential. A reset email therefore
changes a password they never use, and their real login keeps failing — exactly the
reported symptom, for exactly those accounts. The Forgot Password page now states
this plainly and points to the facility administrator, who already has the working
reset action in their portal.

### RC-5 — Password policy was not applied consistently (fixed)
The platform enforces a minimum of 8 characters (measured). Neither the reset page
nor registration checked it, so a short password was submitted and bounced with a
message users read as “the reset didn't work”. One shared policy module is now used
by both pages.

### Not the cause (checked, ruled out)
- **Wrong credential store updated** — no app-side password field exists for
  patients, doctors, hospital users, radiologists or admins; the reset and the login
  both go to the platform auth store.
- **Wrong token parameter** — the SDK maps `resetToken` → `reset_token` correctly.
- **Account enumeration** — a request for an address with no account returns the
  same `200` as a real one (measured).
- **A second password system for patients** — none exists. `PatientPhoneIdentity` /
  `patientPhoneAuth` hold no password.

## 3. Measured results (executed now, in this environment)

| # | Test | Result |
|---|---|---|
| 1 | Reset request for an address with **no account** | `200`, no error — no account enumeration |
| 2 | Three reset requests in immediate succession | all `200`; no rate-limit error from this client |
| 3 | Reset with an invalid token | rejected: `Invalid or expired reset token` |
| 4 | Reset with an empty token | rejected: `Invalid or expired reset token` |
| 5 | Reset with a 5-character password | rejected: `Password must be at least 8 characters long` |
| 6 | Reset request for a real, verified account (the app owner) | `200` accepted |
| 7 | Platform email stats, 90 days | 7 sent, 7 delivered, 0 bounced, 0 spam, all under template `_none` |
| 8 | Platform email stats, the day of test 6 (re-read after ~3 minutes) | **0 sent that day** |
| 9 | Production build after every change | exit 0 |

**Reading of tests 6–8 (stated carefully):** the request was accepted and no email
appears in the stats. That endpoint, however, shows only 7 sends across 90 days for
an app with 39 accounts, so it does **not** appear to count platform auth system
emails (verification / reset). It is therefore **not proof of a dispatch failure**
and is reported here as an inconclusive instrument, not as a platform defect.
To settle it, watch Dashboard → Emails → Application emails while requesting a reset
for a normal (non-admin) account; I could not do that here, because I will not send
reset mail to a real patient or doctor.

## 4. Changes implemented

| File | Change |
|---|---|
| `src/lib/passwordRecovery.js` (new) | One resend cooldown (`RESEND_COOLDOWN_SECONDS = 60`), error classification (rate-limited / unreachable / rejected) with wording identical whether or not the account exists, token-error and credential-error detection, token read from `token`, `reset_token`, `resetToken` or a `#token=` fragment, and the address hand-off to the reset page. Never stores a token or a password. |
| `src/lib/passwordPolicy.js` (new) | The single password rule (minimum 8 characters, matching confirmation), used by registration and reset. |
| `src/pages/ForgotPassword.jsx` | Real cooldown with a live countdown and a “send another link” action; a failed request now shows an honest message instead of a false success; guidance about spam folders and using the newest email; standing note that facility staff passwords are reset by their administrator. |
| `src/pages/ResetPassword.jsx` | Token accepted from several parameter names; policy checked before submitting; distinct states for *expired/used link*, *password not applied*, and *success*; success is shown only after the backend confirms **and** a verification sign-in with the new password succeeds; “Continue to sign in” ends that verification session and returns to login; every failure state offers **Request a new link**. |
| `src/pages/Register.jsx` | Applies the same minimum-length policy, so the rule is identical everywhere. |
| `src/pages/Login.jsx` | Shows “Your password was changed. Sign in with your new password.” when arriving from a completed reset, so a later failure reads as a failure instead of silence. |

Nothing was changed in the platform auth flow, in any account record, in any role,
permission or profile, and no password was reset automatically.

## 5. Security posture after the change

- Tokens remain **platform-issued**: cryptographically random, single-use, expiring,
  and validated server-side (documented by the platform: a link works once, and a
  reset signs the person out on every browser and device). The app never mints,
  stores, logs or echoes a token.
- The app cannot and does not log passwords, tokens or credential errors beyond the
  provider's own message shown to the user.
- The resend cooldown plus the platform's shared per-IP limit prevent an attacker
  from using the page to flood a mailbox.
- No response reveals whether an address has an account.
- The reset page cannot claim success it did not verify.
- Existing staff credential checks were left exactly as they are: no hashing change,
  no account touched, no permission widened.

## 6. Required testing — status

Legend: **measured** = executed here; **inspected** = verified by reading code and the
API contract; **not run** = needs a real inbox, a real browser or a real device.

| Test | Status |
|---|---|
| A. Request once, complete the flow | **not run** — needs a real reset email in a real inbox |
| B. Request again after the cooldown | **not run** (cooldown logic inspected; the request endpoint was measured accepting repeats) |
| C. Multiple requests, predictable token behaviour | **partly measured**: repeats are accepted; older links stop working (platform-documented, single-use) |
| D. Open an expired link | **measured at the API**: `Invalid or expired reset token`; the page now shows the expired state with a new-link action |
| E. Reuse an already-used link | same rejection path as D; **not run** with a real used token |
| F. Mismatched passwords | **inspected** — blocked client-side before any request |
| G. Valid password saved | **not run** — needs a real token |
| H. Log out, log in with the new password | **not run** |
| I. Old password no longer works | **not run** |
| J. Refresh and log in again | **not run** |
| K. Mobile and desktop | **not run** — no device available here |
| L. Close the browser and return later | **not run** |
| M. Patient and doctor accounts, then the other types | **not run**; account-type behaviour **inspected** (see §7) |

## 7. Account types

| Account type | Credential used at login | Reset path | Status |
|---|---|---|---|
| Patient | Platform password | Reset email | Code path repaired; end-to-end needs a real inbox |
| Doctor | Platform password | Reset email | Same |
| Hospital user | Platform password | Reset email | Same |
| Radiologist | Platform password | Reset email | Same |
| Administrator | Platform password | Reset email | Same |
| **Receptionist** | `HospitalReceptionist.password_hash` | Facility administrator, in the hospital portal | Reset email **cannot** fix it — now stated on the page |
| **Laboratory technician** | `LabTechnician.password_hash` | Facility administrator, in the laboratory portal | Same |
| **Pharmacist** | `Pharmacist.password_hash` | Facility administrator, in the pharmacy portal | Same |
| Insurance user | No separate credential exists in this app | — | Not applicable |

Resetting one account cannot touch another: the platform reset is scoped to the
token's own account, and the staff resets are scoped by entity RLS to the facility
that created the staff record (`created_by_id` / `<facility>_user_id`).

## 8. Not done

- **Self-service recovery for facility staff** (receptionist, technician, pharmacist)
  would need its own verified channel — the app already has SMS (Resala) and OTP
  infrastructure that could carry it. Deferred deliberately: it is a new credential
  workflow, not a repair, and it should be designed with the facilities.
- **Stronger staff password hashing.** The staff records use a single-round salted
  SHA-256. Upgrading to a slow KDF would require every staff member to reset their
  password, which this task forbids. Recommended as a planned migration.
- **End-to-end device run.** The acceptance criterion — request, receive, set, log in
  — can only be confirmed with a real mailbox and a real browser. Every step up to
  the mailbox is now honest and verified; the mailbox itself is outside this
  environment.
