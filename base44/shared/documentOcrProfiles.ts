// AMedix document recognition profiles.
//
// One profile per document type: where its number is normally printed, what
// shape that number takes, whether the document carries a machine-readable zone,
// and how a reading is validated before it is allowed to verify anything.
//
// The identification number is never read with a single generic rule — a
// passport MRZ, a national ID serial and a medical licence number are structurally
// different and are recognised differently.

export type NumberProfile = {
  label: string;
  numberField: string;
  numberLabel: string;
  minLength: number;
  maxLength: number;
  numericOnly: boolean;
  allowLetters: boolean;
  mrz: boolean;
  // Where the number is normally printed — given to the reader as guidance, not
  // as a fixed coordinate, so unusual layouts are still found.
  regions: string[];
  regionsAr: string[];
  // Numbers that appear on the document but are never the identification number.
  distractors: string[];
};

export const NUMBER_PROFILES: Record<string, NumberProfile> = {
  passport: {
    label: 'Passport',
    numberField: 'passport_number',
    numberLabel: 'Passport number',
    minLength: 6,
    maxLength: 12,
    numericOnly: false,
    allowLetters: true,
    mrz: true,
    regions: [
      'the top-right or upper area of the personal-data page',
      'the two machine-readable lines at the very bottom of the page',
    ],
    regionsAr: ['أعلى الصفحة أو أعلى اليمين', 'السطران المقروءان آلياً في أسفل الصفحة'],
    distractors: [
      'date of birth, date of issue and date of expiry',
      'personal number, national ID printed on the page',
      'document control and page numbers',
      'the issuing state code',
    ],
  },
  national_id: {
    label: 'National identification card',
    numberField: 'national_id_number',
    numberLabel: 'National ID number',
    minLength: 6,
    maxLength: 20,
    numericOnly: true,
    allowLetters: false,
    mrz: false,
    regions: ['the national identification number field, usually labelled with words meaning number or identification'],
    regionsAr: ['خانة الرقم الوطني المخصصة لذلك'],
    distractors: ['birth date', 'issue and expiry dates', 'family or record numbers', 'the card serial in the corner'],
  },
  birth_certificate: {
    label: 'Birth certificate',
    numberField: 'national_id_number',
    numberLabel: 'Birth certificate registration / serial number',
    minLength: 4,
    maxLength: 20,
    numericOnly: false,
    allowLetters: true,
    mrz: false,
    regions: ['the registration / serial number field at the top of the certificate or beside its title'],
    regionsAr: ['رقم القيد أو الرقم التسلسلي أعلى الشهادة'],
    distractors: ['the date and time of birth', 'the registry office number', 'the certificate page number', 'the national ID of the parents'],
  },
  personal_card: {
    label: 'Personal card',
    numberField: 'personal_card_number',
    numberLabel: 'Personal card number',
    minLength: 5,
    maxLength: 20,
    numericOnly: false,
    allowLetters: true,
    mrz: false,
    regions: ['the card number field, often beside the holder name or under the card title'],
    regionsAr: ['خانة رقم البطاقة'],
    distractors: ['dates', 'the card issue serial', 'the holder national ID'],
  },
  drivers_licence: {
    label: "Driver's licence",
    numberField: 'licence_number',
    numberLabel: "Driver's licence number",
    minLength: 5,
    maxLength: 20,
    numericOnly: false,
    allowLetters: true,
    mrz: false,
    regions: ['the licence number field, usually numbered 5 in the European licence layout, or beside the holder photograph'],
    regionsAr: ['خانة رقم الرخصة'],
    distractors: ['the categories listed on the licence', 'dates of issue and expiry', 'the national ID of the holder'],
  },
  medical_license: {
    label: 'Medical licence',
    numberField: 'license_number',
    numberLabel: 'Medical licence number',
    minLength: 4,
    maxLength: 20,
    numericOnly: false,
    allowLetters: true,
    mrz: false,
    regions: ['the licence or registration number field, often near the top or next to the licence holder name'],
    regionsAr: ['رقم الترخيص أو رقم التسجيل'],
    distractors: ['the licence year or session', 'the serial of the certificate', 'the national ID of the physician'],
  },
  professional_card: {
    label: 'Professional identification card',
    numberField: 'license_number',
    numberLabel: 'Professional licence / identification number',
    minLength: 4,
    maxLength: 20,
    numericOnly: false,
    allowLetters: true,
    mrz: false,
    regions: ['the membership or licence number field printed on the card'],
    regionsAr: ['رقم العضوية أو رقم الترخيص المطبوع على البطاقة'],
    distractors: ['dates', 'the card serial', 'the syndicate branch code'],
  },
};

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹';

export function foldDigits(value: string): string {
  return String(value === undefined || value === null ? '' : value)
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EASTERN_ARABIC.indexOf(d)));
}

// Letters that are visually the same shape as a digit. Applied to BOTH sides of
// a comparison, and only for documents whose number cannot contain letters, so
// a value is never silently rewritten into a different number.
const CONFUSABLE_TO_DIGIT: Record<string, string> = {
  O: '0', Q: '0', D: '0',
  I: '1', L: '1', J: '1',
  Z: '2',
  A: '4',
  S: '5',
  G: '6',
  T: '7',
  B: '8',
  P: '9', g: '9',
};

export function normalizeNumber(value: string, profile?: NumberProfile): string {
  let out = foldDigits(value)
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[^0-9A-Z\u0621-\u064A]/g, '');
  if (profile && profile.numericOnly) {
    out = out.replace(/[A-Z]/g, (c) => CONFUSABLE_TO_DIGIT[c] || '');
  }
  return out;
}

// ---- machine-readable zone -------------------------------------------------

const MRZ_CHAR_VALUES: Record<string, number> = (() => {
  const map: Record<string, number> = { '<': 0 };
  for (let i = 0; i < 10; i++) map[String(i)] = i;
  for (let i = 0; i < 26; i++) map[String.fromCharCode(65 + i)] = 10 + i;
  return map;
})();

const MRZ_WEIGHTS = [7, 3, 1];

export function mrzCheckDigit(value: string): number {
  let sum = 0;
  for (let i = 0; i < value.length; i++) {
    const charValue = MRZ_CHAR_VALUES[value[i]];
    if (charValue === undefined) return -1;
    sum += charValue * MRZ_WEIGHTS[i % 3];
  }
  return sum % 10;
}

export type MrzReading = { number: string; valid: boolean; checks: string[] };

// Extracts and validates the TD3 (passport) machine-readable zone: two 44-character
// lines, with check digits over the number, date of birth, expiry and composite.
export function readMrzTd3(text: string): MrzReading | null {
  const cleaned = foldDigits(String(text || '')).toUpperCase();
  const lines = cleaned
    .split(/[\r\n]+/)
    .map((l) => l.replace(/[^A-Z0-9<]/g, ''))
    .filter((l) => l.length >= 40);
  if (lines.length < 2) return null;
  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];
    if (line1.length < 40 || line2.length < 40) continue;
    if (line1[0] !== 'P' && line1[0] !== 'V' && line1[0] !== 'I' && line1[0] !== 'A') continue;
    const number = line2.slice(0, 9).replace(/</g, '');
    if (!number) continue;
    const checks: string[] = [];
    let valid = true;
    const numberCheck = mrzCheckDigit(line2.slice(0, 9));
    const numberStated = parseInt(line2[9], 10);
    if (numberCheck < 0 || numberCheck !== numberStated) { valid = false; checks.push('number_check'); }
    const composite = `${line2.slice(0, 10)}${line2.slice(13, 20)}${line2.slice(21, 43)}`;
    const compositeCheck = mrzCheckDigit(composite);
    const compositeStated = parseInt(line2[43], 10);
    if (compositeCheck < 0 || compositeCheck !== compositeStated) { valid = false; checks.push('composite_check'); }
    return { number, valid, checks: valid ? ['number_check', 'composite_check'] : checks };
  }
  return null;
}

// ---- validation ------------------------------------------------------------

export type FormatCheck = { ok: boolean; reason: string };

export function validateFormat(value: string, profile: NumberProfile): FormatCheck {
  const normalized = normalizeNumber(value, profile);
  if (!normalized) return { ok: false, reason: 'empty' };
  if (normalized.length < profile.minLength) return { ok: false, reason: 'too_short' };
  if (normalized.length > profile.maxLength) return { ok: false, reason: 'too_long' };
  if (!profile.allowLetters && /[A-Z]/.test(normalized)) return { ok: false, reason: 'letters_present' };
  if (profile.mrz && /^[0-9]{1,9}$/.test(normalized) && normalized.length < 6) return { ok: false, reason: 'too_short' };
  return { ok: true, reason: '' };
}

// Diagnostic only — never used to accept a number.
export function characterDistance(a: string, b: string): number {
  if (!a || !b) return Math.max(a.length, b.length);
  const len = Math.max(a.length, b.length);
  let distance = 0;
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) distance++;
  return distance;
}