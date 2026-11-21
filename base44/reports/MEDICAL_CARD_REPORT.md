# AMedix — Digital Medical Card Implementation Report

Built: card issuance and lifecycle, a designed PDF card (English and Arabic), a
public QR verification page, and the Apple Wallet pass pipeline. Everything that
could be measured here is measured below; everything that needs an iPhone, an
Android device or an Apple Developer certificate is named as such and not
claimed.

---

## 1. What exists now

| Piece | File | State |
|---|---|---|
| Card record (status, token, audit) | `base44/entities/MedicalCard.jsonc` | Created, owner/admin RLS |
| Issue / revoke / reissue / read | `base44/functions/medicalCard/entry.ts` | Built and measured |
| Public QR verification | `base44/functions/medicalCardVerify/entry.ts` | Built and measured |
| Apple Wallet `.pkpass` | `base44/functions/medicalCardPass/entry.ts` | Built — **cannot sign until the Apple certificate is provided** |
| PDF card (EN/AR) | `src/lib/medicalCardPdf.js` | Built, builds clean; not opened on a device |
| Card artwork (screen) | `src/components/patient/card/MedicalCardPreview.jsx` | Built |
| Wallet / PDF actions | `src/components/patient/card/MedicalCardActions.jsx` | Built |
| **My Medical Card** section | `src/components/patient/PatientMedicalCard.jsx` | Wired into the Patient Portal |
| Verification page | `src/pages/VerifyMedicalCard.jsx` at `/verify-card` | Public route |
| Portal navigation | `src/components/patient/shell/patientNavigation.js`, `PatientDashboard.jsx`, `notificationDestinations.js` | Added as a portal tab |

The card shows identification only: official AMedix logo (unchanged proportions,
`object-contain`), the registered full name exactly as stored, the CIN as the
patient ID, card status, card number, issue and expiry dates, and the QR code.
No diagnosis, allergy, medication or document is rendered anywhere on it.

## 2. Measured results

Executed against the live backend on the designated test patient
(`ZZZ TEST PATIENT DO NOT USE`, CIN `TST-9900-TEST`).

| Step | Call | Result |
|---|---|---|
| Issue | `medicalCard {action:"get"}` | `200`, card `AMX-2026-B52900`, status `active`, issued 2026-11-21, expires 2031-11-21, audit entry `issued` |
| Verify (active) | `medicalCardVerify {token}` | `200`, `found:true`, `status:"active"`, name, CIN, dates, `clinical_access:"requires_patient_authorization"` — no clinical field in the response |
| Revoke | `medicalCard {action:"revoke"}` | `200`, status `revoked`, reason stored, audit `scanned` + `revoked` |
| Verify (revoked) | same token | `200`, `status:"revoked"` — **an already-downloaded PDF or Wallet card stops verifying the moment the card is revoked** |
| Reissue | `medicalCard {action:"reissue"}` | `200`, new card `AMX-2026-E99B6A`, `reissue_count:1`, audit `reissued`, previous card replaced |
| Verify (new token) | `medicalCardVerify` | `200`, `status:"active"` |
| Verify (unknown token) | 64 zero characters | `200`, `found:false` |
| Verify (malformed token) | `medicalCardVerify` earlier run | `400`, `reason:"invalid_token"` |
| Wallet pass | `medicalCardPass` | `503 wallet_not_configured`, listing the four missing Apple secrets — the endpoint refuses to emit an unsigned or fake pass |
| Build | `vite build` | exit 0 |

## 3. QR verification security

- The QR carries **only** a verification URL whose sole parameter is a 32-byte
  random token generated with `crypto.getRandomValues` (64 hex characters). It
  contains no CIN, no name, no password and no clinical value.
- Verification looks the token up server-side and returns the **current** status
  (`active` / `expired` / `revoked`), the printed name, the CIN and the card
  dates. It returns `clinical_access: "requires_patient_authorization"` and reads
  no clinical entity at all.
- A card therefore cannot go stale on a device: revocation is checked at scan
  time, not at download time.
- The token is stored on a record readable only by the patient who owns it and by
  administrators; the verification endpoint uses the service role for a
  deliberately public lookup whose only credential is that long random token.
- Every scan is recorded on the card's own audit trail (throttled to one entry
  per 3 seconds so a refresh does not flood it).

## 4. Apple Wallet — status: built, blocked on Apple credentials

The `.pkpass` pipeline is written and deployable, but it **cannot produce a
genuine pass yet**, because a genuine pass must be signed with an Apple Pass Type
certificate that only the AMedix Apple Developer account can create. I cannot
obtain one, and I did not substitute a PDF or a fake button for it.

What the app now does: `medicalCardPass` reads the certificate from app secrets,
verifies that the signed-in user owns the card, refuses to serve anything when
the certificate is absent, and answers `503 wallet_not_configured`. The
**Add to Apple Wallet** button is rendered only when the backend reports the
certificate present — so a patient can never tap a button that cannot work.

Required Apple Developer configuration (all inside the AMedix Apple Developer
account):

1. An Apple Developer Program membership for AMedix.
2. A **Pass Type ID** (e.g. `pass.com.amedix.medicalcard`) registered under
   Identifiers → Pass Type IDs.
3. A **Pass Type certificate** (.p12) issued for that Pass Type ID, exported as
   PEM certificate + private key (with its passphrase).
4. Apple's **WWDR intermediate certificate** (G4).
5. The **Team ID** from the account.

Those five values are the secrets the app reads: `APPLE_PASS_TYPE_ID`,
`APPLE_TEAM_ID`, `APPLE_PASS_CERT_PEM`, `APPLE_PASS_KEY_PEM`,
`APPLE_WWDR_CERT_PEM` (and `APPLE_PASS_KEY_PASSPHRASE` if the key has one). Once
they are saved, the Wallet button appears and `medicalCardPass` returns a signed
pass.

Pass contents: generic style, navy `#17324D` background, white text, the official
AMedix logo unchanged, patient name, patient ID, card number, issue and expiry
dates, a QR barcode pointing at the verification URL, an Arabic name field on the
back, and a notice that the card is not an Apple-issued identity document and not
an Apple Health Medical ID.

## 5. Limitations — stated plainly

- **No real `.pkpass` has been generated or added to a wallet.** Impossible
  without the certificate above; the code path is written but unverified.
- **No PDF has been opened on an Android device.** The PDF is produced in the
  browser (HTML → high-resolution canvas → A4 page), which is the only way to
  render Arabic correctly, but I cannot open a PDF on a phone from here.
- **No iPhone or Android device testing.** The layout is responsive and the
  buttons adapt, but the device checklist in the request has not been run.
- **Arabic rendering is by design, not by test.** Arabic is shaped by the browser
  during PDF rendering (not by a PDF font table), and the card switches to RTL
  with the Arabic name when the patient's portal language is Arabic; I could not
  visually confirm the Arabic PDF output.
- **Wallet pass updates are not implemented.** Pushing updates to a pass already
  in Wallet needs Apple's PassKit web service (device registration endpoints plus
  a web service URL on the pass). Revocation still works without it, because the
  QR is checked against the backend on every scan — a revoked card reports
  `revoked` immediately, but the pass artwork in Wallet does not change itself.
- **No administrator screen for card management.** Patients can issue, revoke and
  reissue their own card; administrators can act on the records, but there is no
  dedicated admin panel yet.

## 6. Preserved

No patient record, CIN, registration flow, portal permission, authorization
workflow or access-control rule was modified. The card reads the existing patient
profile and copies the name and CIN at issue time; it never writes back to it.
Card access is owner-or-administrator at the record level, and every card action
first resolves the caller's own patient profile, so one patient cannot request
another patient's card or pass.
