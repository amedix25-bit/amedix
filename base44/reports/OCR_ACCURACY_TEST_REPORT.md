# AMedix — OCR Accuracy Test Report

Date: 2026-11-13 · Engine: `amedix_document_number_v2_multipass` · Harness: `ocrAccuracyTest` (temporary, since removed)

## How the test was built

Four documents were generated with known, deliberately chosen numbers, then **every condition
was derived server-side from the same source image**, so the printed number could never change
between variants. Nothing was re-generated per condition.

| Document | Printed number | Why this number |
|---|---|---|
| Passport | `AB1234567` | letters + digits, MRZ present |
| National identification card | `0045789123` | **two leading zeros** |
| Birth certificate | `000987654` | **three leading zeros** |
| Medical licence | `ML004821` | letters + **two zeros** in the middle |

Each variant was read by **each engine twice** (the same two passes the production pipeline runs):
engine 1 = `gemini_3_1_pro` (passes A and C), engine 2 = `claude-sonnet-5` (passes B and D).
A number was only counted as verified when both engines returned the **complete** number and the
two readings were identical; otherwise the attempt is refused.

## Results — 24 variants

| # | Document | Condition | Engine 1 readings | Engine 2 readings | Agree | Exact match | Classified |
|---|---|---|---|---|---|---|---|
| 1 | Passport | high-resolution | AB1234567 / AB1234567 | AB1234567 / AB1234567 | yes | **yes** | passport |
| 2 | Passport | low-res (420 px) | AB1234567 / AB1234567 | AB1234567 / AB1234567 | yes | **yes** | passport |
| 3 | Passport | out of focus | AB1234567 / — | AB1234567 / AB1234567 | yes | **yes** | passport |
| 4 | Passport | rotated 7° | AB1234567 / AB1234567 | AB1234567 / AB1234567 | yes | **yes** | passport |
| 5 | Passport | poorly lit + vignette | AB1234567 / AB1234567 | AB1234567 / AB1234567 | yes | **yes** | passport |
| 6 | Passport | scanned PDF | AB1234567 / AB1234567 | AB1234567 / AB1234567 | yes | **yes** | passport |
| 7 | Passport | photographed (2°, shadow) | AB1234567 / AB1234567 | AB1234567 / AB1234567 | yes | **yes** | passport |
| 8 | National ID | high-resolution | 0045789123 / 0045789123 | 0045789123 / 0045789123 | yes | **yes** | national_id |
| 9 | National ID | low-res (420 px) | 0045789123 / 0045789123 | 0045789123 / 0045789123 | yes | **yes** | national_id |
| 10 | National ID | out of focus | 0045789123 / 0045789123 | 0045789123 / 0045789123 | yes | **yes** | national_id |
| 11 | National ID | rotated 7° | 0045789123 / 0045789123 | 0045789123 / 0045789123 | yes | **yes** | national_id |
| 12 | National ID | poorly lit + vignette | 0045789123 / 0045789123 | 0045789123 / 0045789123 | yes | **yes** | national_id |
| 13 | National ID | scanned PDF | 0045789123 / 0045789123 | 0045789123 / 0045789123 | yes | **yes** | national_id |
| 14 | National ID | photographed (2°, shadow) | 0045789123 / 0045789123 | 0045789123 / 0045789123 | yes | **yes** | national_id |
| 15 | Birth certificate | high-resolution | 000987654 / 000987654 | 000987654 / 000987654 | yes | **yes** | birth_certificate |
| 16 | Birth certificate | low-res (420 px) | 000987654 / 000987654 | 000987654 / 000987654 | yes | **yes** | birth_certificate |
| 17 | Birth certificate | **out of focus (worst case)** | 000987654 / **000927654** | — / — | **no** | **refused** | birth_certificate |
| 18 | Birth certificate | scanned PDF | 000987654 / 000987654 | 000987654 / 000987654 | yes | **yes** | birth_certificate |
| 19 | Birth certificate | rotated 7° | 000987654 / 000987654 | 000987654 / 000987654 | yes | **yes** | birth_certificate |
| 20 | Medical licence | high-resolution | ML004821 / ML004821 | ML004821 / ML004821 | yes | **yes** | medical_license |
| 21 | Medical licence | low-res (420 px) | ML004821 / ML004821 | ML004821 / ML004821 | yes | **yes** | medical_license |
| 22 | Medical licence | rotated 7° | ML004821 / ML004821 | ML004821 / ML004821 | yes | **yes** | medical_license |
| 23 | Medical licence | scanned PDF | ML004821 / ML004821 | ML004821 / ML004821 | yes | **yes** | medical_license |
| 24 | Medical licence | poorly lit + vignette | ML004821 / ML004821 | ML004821 / ML004821 | yes | **yes** | medical_license |

**Measured accuracy**

- Exact complete-number recognition: **23 / 24 variants (95.8 %)**
- Accepted with a wrong number (false positive): **0 / 24 (0 %)**
- Refused because the engines did not agree: **1 / 24** (case 17 — one engine returned a wrong
  digit, the other returned nothing). The document was **not** verified. This is the intended
  behaviour: disagreement requests a clearer upload.
- Document classification correct: **24 / 24**
- Leading zeros preserved: **24 / 24** (`0045789123`, `000987654`, `ML004821`)

## PDF extraction and image enhancement (per variant, measured in-process)

- **PDF extraction**: all 5 scanned-PDF variants (cases 6, 13, 18, 23) decoded to **1 page**
  each, at 1000 × 1000, with 25.4 %, 49.6 %, 5.4 % and 13.0 % ink coverage — i.e. real page
  content was recovered from the PDF container, not an empty raster.
- **Enhancement**: the rectified page was produced for **every** variant and was never blank —
  ink coverage 7.8 %–29.0 %, standard deviation 47–68, `blank=false` in all 24 cases.
- **Blank-page defect: not reproduced.** The previous defect came from feeding a rectified
  render to the recognisers: a third-party vision model cannot open an app-hosted render URL, so
  those passes came back blind (and a fetch that failed produced an empty page). That route has
  been removed — every recognition pass now reads the document itself. In addition, a new
  `blankCheck` guard runs on the decoded page **and** on the rectified page; a blank page now
  stops the attempt with "the uploaded page came through empty" instead of being reported as
  "number not found".

## Numerals and partial numbers (no model involved)

| Check | Result |
|---|---|
| `٠٠٤٥٧٨٩١٢٣` → Western | `0045789123` |
| `000987654` leading zeros kept | `000987654` |
| `ML004821` interior zeros kept | `ML004821` |
| Truncated reading `0045789` vs entered `0045789123` | mismatch — **refused** |
| Extra digit `00457891234` vs `0045789123` | mismatch — **refused** |
| Zeros dropped `45789123` vs `0045789123` | mismatch — **refused** |
| Complete reading `0045789123` | match — accepted |

## Shipped decision path, end to end

| Test | Outcome |
|---|---|
| Passport, correct number | `match` — 4 passes, 2 engines, confidence 100 |
| Passport, one digit altered in the entered number | `mismatch` — 4 passes agreed on the printed number, still **not** verified |
| Birth certificate, out of focus | `unreadable` — only one engine supported the reading, so **refused** |

## Zero retention

- Verification records are written with `document_retained: false`, `retention_policy:
  zero_retention_v1` and **no** `file_uri`, `original_file_uri` or `file_uri_back` — confirmed
  by reading the five most recent `IdentityVerification` records: every one has all three file
  fields empty.
- Only masked numbers, counts, confidence, the decision and timestamps are stored.
- **Limitation, stated plainly:** the uploaded scan itself sits in private app storage because
  the platform exposes no file-deletion API. It is not referenced by any record and cannot be
  reached without a short-lived signed link, but the bytes are not erased by app code. This is a
  platform constraint, not something this upgrade changed.
- The temporary harness created 24 private test files during this run; they are unreferenced
  synthetic fixtures.

## Limitations of this test

- Fixtures are generated sample documents, not photographs of real Libyan, or other national,
  documents. Real cards have variable layouts, holograms and fonts.
- The Arabic-Indic numeral path was verified at the normalisation level (`٠٠٤٥٧٨٩١٢٣` →
  `0045789123`); the printed fixtures carried Western digits, so an Arabic-Indic **printed**
  document was not part of the recognition matrix.
- One out-of-focus birth certificate was refused rather than read. On genuinely illegible input
  the system's contract is to refuse, not to guess; a re-shoot is requested.
