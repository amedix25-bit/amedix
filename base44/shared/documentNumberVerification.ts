// AMedix built-in automated document-number verification engine.
//
// ONE place that knows, for every supported identity / professional document,
// which number is read from it and how an entered number is compared against
// the number printed on the document. The registration verification function
// and the registration back-ends all import from here, so the rule set can
// never drift between them.
//
// The engine answers a single question: does the number typed by the user
// match the number printed on this document? It does NOT claim the document is
// genuine or officially issued. No administrator, hospital, doctor, laboratory
// or pharmacy takes part in this decision.

export const ENGINE_VERSION = 'amedix_document_number_v1';

// Supported documents. `numberField` is the number the engine reads and
// compares; `extract` describes every value the reader is asked to return;
// `advisory` lists values that are recorded for the audit trail only and never
// change the outcome.
export const DOCUMENTS = {
  passport: {
    label: 'Passport',
    numberField: 'passport_number',
    numberLabel: 'Passport number',
    advisory: ['full_name'],
    extract: {
      passport_number: 'The passport number exactly as printed, every digit and letter, no spaces, fill characters or separators',
      full_name: 'The full name exactly as printed on the passport, in the script it is printed in',
      full_name_latin: 'The same full name transliterated into the Latin alphabet (e.g. from the MRZ lines)',
    },
  },
  national_id: {
    label: 'National identification card',
    numberField: 'national_id_number',
    numberLabel: 'National ID number',
    advisory: [],
    extract: {
      national_id_number: 'The national identification number exactly as printed, every digit and letter, no spaces or separators',
    },
  },
  birth_certificate: {
    label: 'Birth certificate',
    numberField: 'national_id_number',
    numberLabel: 'Birth certificate registration / serial number',
    advisory: ['date_of_birth'],
    extract: {
      national_id_number: 'The birth certificate registration / serial number exactly as printed, every digit and letter, no spaces or separators',
      date_of_birth: 'The date of birth exactly as printed on the certificate',
    },
  },
  personal_card: {
    label: 'Personal card',
    numberField: 'personal_card_number',
    numberLabel: 'Personal card number',
    advisory: ['full_name'],
    extract: {
      personal_card_number: 'The personal card number exactly as printed, every digit and letter, no spaces or separators',
      full_name: 'The full name exactly as printed on the card, in the script it is printed in',
      full_name_latin: 'The same full name transliterated into the Latin alphabet, as printed on the card if present',
    },
  },
  drivers_licence: {
    label: "Driver's licence",
    numberField: 'licence_number',
    numberLabel: "Driver's licence number",
    advisory: ['full_name'],
    extract: {
      licence_number: "The driving licence number exactly as printed, every digit and letter, no spaces or separators",
      full_name: 'The full name exactly as printed on the licence, in the script it is printed in',
      full_name_latin: 'The same full name transliterated into the Latin alphabet, as printed on the licence if present',
    },
  },
  medical_license: {
    label: 'Medical licence',
    numberField: 'license_number',
    numberLabel: 'Medical licence number',
    advisory: [],
    extract: {
      license_number: 'The medical licence / registration number exactly as printed, every digit and letter, no spaces or separators',
    },
  },
  professional_card: {
    label: 'Professional identification card',
    numberField: 'license_number',
    numberLabel: 'Professional licence / identification number',
    advisory: ['full_name'],
    extract: {
      license_number: 'The professional licence / identification number exactly as printed, every digit and letter, no spaces or separators',
      full_name: 'The full name exactly as printed on the card, in the script it is printed in',
      full_name_latin: 'The same full name transliterated into the Latin alphabet, as printed on the card if present',
    },
  },
};

// Which documents each account type may submit, and every value it must
// provide before the document can be checked (the number itself plus any value
// the registration already collects).
export const PROFILE_DOCUMENTS = {
  patient: {
    birth_certificate: ['date_of_birth', 'national_id_number'],
    personal_card: ['full_name', 'personal_card_number'],
    drivers_licence: ['full_name', 'licence_number'],
    passport: ['full_name', 'passport_number'],
  },
  doctor: {
    birth_certificate: ['date_of_birth', 'national_id_number'],
    personal_card: ['full_name', 'personal_card_number'],
    drivers_licence: ['full_name', 'licence_number'],
    passport: ['full_name', 'passport_number'],
    national_id: ['national_id_number'],
    medical_license: ['license_number'],
    professional_card: ['license_number'],
  },
};

// Two-sided documents: the number may be printed on either side.
export const TWO_SIDED = ['personal_card', 'drivers_licence', 'professional_card'];

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeDigits(value) {
  return String(value === undefined || value === null ? '' : value).replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

// Comparison form of a document number. Only harmless formatting differences
// disappear — spaces, hyphens, dots, slashes, brackets and letter casing.
// Every letter and digit is kept exactly as printed, so two different numbers
// can never collapse into the same value.
export function normalizeDocumentNumber(value) {
  return normalizeDigits(value)
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[^0-9A-Z\u0621-\u064A]/g, '');
}

// The three outcomes the engine can produce.
export const OUTCOME = { match: 'match', mismatch: 'mismatch', unreadable: 'unreadable' };

// Compare the entered number with the number read from the document.
export function evaluateDocumentNumber(entered, extracted) {
  const expected = normalizeDocumentNumber(entered);
  const read = normalizeDocumentNumber(extracted);
  if (read === '') {
    return { outcome: OUTCOME.unreadable, expected, read };
  }
  return { outcome: expected && read === expected ? OUTCOME.match : OUTCOME.mismatch, expected, read };
}

// ---- advisory value comparison (audit information only) -------------------

const pad = (n) => String(n).padStart(2, '0');
const MONTHS = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };

export function normalizeDate(raw) {
  if (raw === undefined || raw === null) return null;
  const s = normalizeDigits(raw).trim();
  const iso = s.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})$/);
  if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  const split = s.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/);
  if (split) {
    let d = parseInt(split[1], 10);
    let m = parseInt(split[2], 10);
    if (m > 12 && d <= 12) {
      const tmp = d;
      d = m;
      m = tmp;
    }
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${split[3]}-${pad(m)}-${pad(d)}`;
  }
  const dayMonthYear = s.match(/^(\d{1,2})[-\s]+([A-Za-z]+),?[-\s]+(\d{4})$/);
  if (dayMonthYear) {
    const m = MONTHS[dayMonthYear[2].slice(0, 3).toLowerCase()];
    if (m) return `${dayMonthYear[3]}-${m}-${pad(dayMonthYear[1])}`;
  }
  const monthDayYear = s.match(/^([A-Za-z]+)[-\s]+(\d{1,2}),?[-\s]+(\d{4})$/);
  if (monthDayYear) {
    const m = MONTHS[monthDayYear[1].slice(0, 3).toLowerCase()];
    if (m) return `${monthDayYear[3]}-${m}-${pad(monthDayYear[2])}`;
  }
  return null;
}

export function normalizeName(raw) {
  if (raw === undefined || raw === null) return '';
  return normalizeDigits(String(raw))
    .replace(/[\u0640\u064B-\u065F]/g, '')
    .replace(/[\u0622\u0623\u0625\u0627\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/</g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function nameMatches(extractedCandidates, expectedValue) {
  const expected = normalizeName(expectedValue);
  if (!expected) return false;
  const expectedTokens = expected.split(' ').filter(Boolean);
  if (expectedTokens.length === 0) return false;
  const candidates = Array.isArray(extractedCandidates) ? extractedCandidates : [extractedCandidates];
  return candidates.some((raw) => {
    const docTokens = new Set(normalizeName(raw).split(' ').filter(Boolean));
    return docTokens.size > 0 && expectedTokens.every((tok) => docTokens.has(tok));
  });
}

export const FIELD_LABELS = {
  full_name: 'Full name',
  personal_card_number: 'Personal card number',
  passport_number: 'Passport number',
  licence_number: "Driver's licence number",
  national_id_number: 'Document identification number',
  date_of_birth: 'Date of birth',
  license_number: 'Professional licence number',
};

// Compare one advisory value; never decisive.
export function advisoryMatches(field, readValues, expectedValue) {
  if (field === 'date_of_birth') {
    const d = normalizeDate(readValues.date_of_birth);
    return d !== null && d === normalizeDate(expectedValue);
  }
  if (field === 'full_name') {
    return nameMatches([readValues.full_name, readValues.full_name_latin], expectedValue);
  }
  return normalizeDocumentNumber(readValues[field]) === normalizeDocumentNumber(expectedValue);
}

// The description of the number a document carries, for messages.
export function documentNumberLabel(documentType) {
  const doc = DOCUMENTS[documentType];
  return doc ? doc.numberLabel : 'Document number';
}

// Whether a stored verification record may be used to continue a registration.
// New records are decided automatically (verified / rejected / failed). Records
// created before the engine existed were left PENDING for manual review; they
// count only when their own automated run already matched the number — a
// mismatch, an unreadable document or a missing number never counts.
export function isDocumentVerificationAccepted(record) {
  if (!record) return false;
  if (record.status === 'verified') return true;
  return record.status === 'pending'
    && !!record.auto_check
    && record.auto_check.outcome === OUTCOME.match;
}