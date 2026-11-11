import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Identity document SUBMISSION (patients and doctors). A submission never
// verifies an account: the document is stored privately and the record is
// created as PENDING so the account enters the administrator review queue.
// The automatic readability check below only produces an advisory note for the
// reviewing administrator — it can neither approve nor refuse anything.
//
// Whitelist of accepted (profile_type, document_type) pairs and the fields
// each must confirm — anything else is rejected before any extraction runs.
const DOC_TYPES = {
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
    national_id: ['national_id_number'], // legacy identity document
    medical_license: ['license_number'],
  },
};

// Two-sided documents: the front and back must both be in the submission —
// either photographed as two pages of one PDF, or as two separate files.
const TWO_SIDED = ['personal_card', 'drivers_licence'];

const FIELD_LABELS = {
  full_name: 'Full name',
  personal_card_number: 'Personal Card number',
  passport_number: 'Passport number',
  licence_number: "Driver's licence number",
  national_id_number: 'National ID number',
  date_of_birth: 'Date of birth',
  license_number: 'Medical licence number',
};

// What the automatic readability check is asked to read from each document
// type. Values are read exactly as printed; names are read in BOTH the
// document's script and its Latin transliteration.
const EXTRACT_SCHEMAS = {
  birth_certificate: {
    date_of_birth: { type: 'string', description: 'The date of birth exactly as printed on the certificate' },
    national_id_number: { type: 'string', description: 'The national ID / certificate number exactly as printed, every digit, no spaces or separators' },
  },
  national_id: { national_id_number: { type: 'string', description: 'The national ID number exactly as printed, every digit, no spaces or separators' } },
  medical_license: { license_number: { type: 'string', description: 'The medical license number exactly as printed' } },
  personal_card: {
    full_name: { type: 'string', description: 'The full name exactly as printed on the card, in the script it is printed in' },
    full_name_latin: { type: 'string', description: 'The same full name transliterated into the Latin alphabet, as printed on the card if present' },
    personal_card_number: { type: 'string', description: 'The personal card number exactly as printed, every digit and letter, no spaces or separators' },
  },
  drivers_licence: {
    full_name: { type: 'string', description: 'The full name exactly as printed on the licence, in the script it is printed in' },
    full_name_latin: { type: 'string', description: 'The same full name transliterated into the Latin alphabet, as printed on the licence if present' },
    licence_number: { type: 'string', description: 'The driving licence number exactly as printed, every digit and letter, no spaces or separators' },
  },
  passport: {
    full_name: { type: 'string', description: 'The full name exactly as printed on the passport, in the script it is printed in' },
    full_name_latin: { type: 'string', description: 'The same full name transliterated into the Latin alphabet (e.g. from the MRZ line)' },
    passport_number: { type: 'string', description: 'The passport number exactly as printed, every digit and letter, no spaces, fill characters or separators' },
  },
};

const pad = (n) => String(n).padStart(2, '0');
const MONTHS = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };

function normalizeDigits(value) {
  return String(value).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

function normalizeDate(raw) {
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

function normalizeId(raw) {
  if (raw === undefined || raw === null) return '';
  return normalizeDigits(String(raw))
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/I/g, '1')
    .replace(/[^A-Z0-9]/g, '');
}

function normalizeName(raw) {
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

function nameMatches(extractedCandidates, expectedValue) {
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

function fieldMatches(key, raw, expectedValue) {
  if (key === 'date_of_birth') {
    const d = normalizeDate(raw);
    return d !== null && d === normalizeDate(expectedValue);
  }
  if (key === 'full_name') return nameMatches(raw, expectedValue);
  return normalizeId(raw) === normalizeId(expectedValue);
}

const str = (v, max = 200) => (typeof v === 'string' && v.length <= max ? v : '');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      profile_type, document_type, file_uri, file_name,
      file_uri_back = '', file_name_back = '', expected = {},
    } = body || {};

    const requiredFields = DOC_TYPES[profile_type]?.[document_type];
    if (!requiredFields) {
      return Response.json({ error: 'Invalid verification method' }, { status: 400 });
    }
    if (typeof file_uri !== 'string' || file_uri.length === 0 || file_uri.length > 500) {
      return Response.json({ error: 'Invalid file' }, { status: 400 });
    }
    if (typeof file_uri_back !== 'string' || file_uri_back.length > 500) {
      return Response.json({ error: 'Invalid file' }, { status: 400 });
    }
    for (const key of requiredFields) {
      const value = expected[key];
      const max = key === 'full_name' ? 200 : 100;
      if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
        return Response.json({ error: 'Missing required information' }, { status: 400 });
      }
    }

    const frontIsPdf = typeof file_name === 'string' && file_name.toLowerCase().endsWith('.pdf');
    if (TWO_SIDED.includes(document_type) && !file_uri_back && !frontIsPdf) {
      return Response.json(
        { error: 'This document has two sides — submit the front and the back, or one PDF containing both sides' },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toISOString();
    const expectedRecord = {};
    for (const key of requiredFields) {
      expectedRecord[`expected_${key}`] = typeof expected[key] === 'string' ? expected[key] : '';
    }

    const baseRecord = {
      user_id: user.id,
      profile_type,
      document_type,
      file_uri,
      file_name: str(file_name),
      file_mime: str(body.file_mime, 100),
      file_size: typeof body.file_size === 'number' && body.file_size >= 0 ? body.file_size : 0,
      page_count: typeof body.page_count === 'number' && body.page_count > 0 && body.page_count <= 20 ? Math.round(body.page_count) : 1,
      source: ['camera', 'gallery', 'pdf'].includes(body.source) ? body.source : 'gallery',
      original_file_uri: str(body.original_file_uri, 500),
      original_file_name: str(body.original_file_name),
      file_uri_back,
      file_name_back: str(file_name_back),
      attempted_datetime: submittedAt,
      ...expectedRecord,
    };

    const readRecord = (extractedValues = {}) => {
      const out = {};
      for (const key of requiredFields) {
        const v = extractedValues[key];
        out[key] = v !== undefined && v !== null ? String(v) : '';
      }
      return out;
    };

    // The document stays in private storage — the backend issues a
    // short-lived signed URL just long enough for the readability check.
    const extractFrom = async (uri, schema) => {
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 300 });
      const res = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url: signed.signed_url,
        json_schema: { type: 'object', properties: schema, required: Object.keys(schema).filter((k) => !k.endsWith('_latin')) },
      });
      if (res.status !== 'success' || !res.output) return null;
      const out = Array.isArray(res.output) ? res.output[0] : res.output;
      return out && typeof out === 'object' ? out : null;
    };

    // Advisory check only — a failure here never refuses the submission.
    let front = null;
    try {
      front = await extractFrom(file_uri, EXTRACT_SCHEMAS[document_type]);
    } catch (extractError) {
      front = null;
    }

    const checks = requiredFields.map((key) => {
      const raw = key === 'full_name' && front
        ? [front.full_name, front.full_name_latin].filter(Boolean).join(' ')
        : front
          ? front[key]
          : '';
      const read = raw === undefined || raw === null ? '' : String(raw);
      return {
        field: key,
        label: FIELD_LABELS[key] || key,
        entered: expected[key],
        read,
        matched: read.trim() !== '' && fieldMatches(key, key === 'full_name' ? [front?.full_name, front?.full_name_latin] : read, expected[key]),
      };
    });

    const anyRead = checks.some((c) => c.read.trim() !== '');
    const outcome = !front || !anyRead ? 'unreadable' : checks.every((c) => c.matched) ? 'match' : 'mismatch';

    let note = 'Submitted for review.';
    if (outcome === 'unreadable') note = 'The document could not be read automatically — review the document itself.';
    else if (outcome === 'mismatch') note = 'Some entered details differ from what was read on the document — verify them.';
    else note = 'The entered details matched what was read on the document.';

    const record = await base44.asServiceRole.entities.IdentityVerification.create({
      ...baseRecord,
      ...Object.fromEntries(Object.entries(readRecord(front || {})).map(([k, v]) => [`extracted_${k}`, v])),
      status: 'pending',
      reason: outcome === 'match' ? '' : outcome,
      auto_check: { outcome, checked_datetime: submittedAt, checks },
      review_history: [
        {
          datetime: submittedAt,
          action: 'submitted',
          actor_name: user.full_name || user.email || '',
          actor_role: profile_type,
          detail: `${document_type} submitted (${baseRecord.source}) — awaiting administrative review`,
        },
      ],
    });

    return Response.json({
      status: 'pending',
      verification_id: record.id,
      submitted_datetime: submittedAt,
      read: readRecord(front || {}),
      auto_check: { outcome, checks, note },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}