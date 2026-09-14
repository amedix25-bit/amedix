import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Identity verification for profile creation. The user selects exactly ONE
// method — Birth Certificate, Personal Card or Passport — and a successful
// verification of that method is sufficient to verify the account; the other
// methods are not required. Doctors additionally verify their medical license
// through a separate call.
//
// Whitelist of accepted (profile_type, document_type) pairs and the fields
// each must confirm — anything else is rejected before any extraction runs.
const DOC_TYPES = {
  patient: {
    birth_certificate: ['date_of_birth', 'national_id_number'],
    personal_card: ['full_name', 'personal_card_number'],
    passport: ['full_name', 'passport_number'],
  },
  doctor: {
    birth_certificate: ['date_of_birth', 'national_id_number'],
    personal_card: ['full_name', 'personal_card_number'],
    passport: ['full_name', 'passport_number'],
    national_id: ['national_id_number'], // legacy identity document
    medical_license: ['license_number'],
  },
};

// What the OCR extraction is asked to read from each document type.
const EXTRACT_SCHEMAS = {
  birth_certificate: { date_of_birth: { type: 'string' }, national_id_number: { type: 'string' } },
  national_id: { national_id_number: { type: 'string' } },
  medical_license: { license_number: { type: 'string' } },
  personal_card: { full_name: { type: 'string' }, personal_card_number: { type: 'string' } },
  passport: { full_name: { type: 'string' }, passport_number: { type: 'string' } },
};

const pad = (n) => String(n).padStart(2, '0');
const MONTHS = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };

function normalizeDigits(value) {
  return String(value).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

// Normalize a date read from a document or entered by the user to YYYY-MM-DD.
// Handles ISO (1990-03-14), day-first (14/03/1990), month-first (03/14/1990),
// dotted (14.03.1990) and written ("14 March 1990" / "March 14, 1990") forms.
// Returns null when no recognizable date is present — such a value can never
// match, so verification fails.
function normalizeDate(raw) {
  if (raw === undefined || raw === null) return null;
  const s = normalizeDigits(raw).trim();
  const iso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  const split = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
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
  const dayMonthYear = s.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
  if (dayMonthYear) {
    const m = MONTHS[dayMonthYear[2].slice(0, 3).toLowerCase()];
    if (m) return `${dayMonthYear[3]}-${m}-${pad(dayMonthYear[1])}`;
  }
  const monthDayYear = s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDayYear) {
    const m = MONTHS[monthDayYear[1].slice(0, 3).toLowerCase()];
    if (m) return `${monthDayYear[3]}-${m}-${pad(monthDayYear[2])}`;
  }
  return null;
}

// Identifiers must match character-for-character — only whitespace is ignored,
// digits are converted from Arabic-Indic numerals, and nothing else is changed.
function normalizeId(raw) {
  if (raw === undefined || raw === null) return '';
  return normalizeDigits(raw).replace(/\s+/g, '');
}

// Full names must match exactly. The comparison is case-insensitive and
// ignores spacing differences (documents print names in many layouts); the
// entered information is never modified — it is only compared.
function normalizeName(raw) {
  if (raw === undefined || raw === null) return '';
  return normalizeDigits(String(raw)).toLowerCase().replace(/\s+/g, ' ').trim();
}

function fieldMatches(key, raw, expectedValue) {
  if (key === 'date_of_birth') {
    const d = normalizeDate(raw);
    return d !== null && d === normalizeDate(expectedValue);
  }
  if (key === 'full_name') return normalizeName(raw) === normalizeName(expectedValue);
  return normalizeId(raw) === normalizeId(expectedValue);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      profile_type, document_type, file_uri, file_name,
      file_uri_back = '', file_name_back = '', expected = {},
    } = body;

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

    // A Personal Card requires BOTH sides: either two separate photos or a
    // single PDF containing both. Enforced server-side so the frontend cannot
    // bypass it.
    const frontIsPdf = typeof file_name === 'string' && file_name.toLowerCase().endsWith('.pdf');
    if (document_type === 'personal_card' && !file_uri_back && !frontIsPdf) {
      return Response.json(
        { error: 'Personal Card requires both sides — upload the front and back photos, or one PDF containing both sides' },
        { status: 400 }
      );
    }

    const attemptedAt = new Date().toISOString();

    const expectedRecord = {};
    for (const key of requiredFields) {
      expectedRecord[`expected_${key}`] = typeof expected[key] === 'string' ? expected[key] : '';
    }
    const baseRecord = {
      user_id: user.id,
      profile_type,
      document_type,
      file_uri,
      file_name: typeof file_name === 'string' ? file_name.slice(0, 200) : '',
      file_uri_back,
      file_name_back: typeof file_name_back === 'string' ? file_name_back.slice(0, 200) : '',
      attempted_datetime: attemptedAt,
      ...expectedRecord,
    };

    // The verification record is created with the service role — app users
    // cannot create or modify verification results themselves, so a 'verified'
    // status can only ever be produced here, after a real server-side match.
    const saveRecord = async (status, reason, extractedValues = {}) => {
      const extractedRecord = {};
      for (const key of requiredFields) {
        const v = extractedValues[key];
        extractedRecord[`extracted_${key}`] = v !== undefined && v !== null ? String(v) : '';
      }
      const record = await base44.asServiceRole.entities.IdentityVerification.create({
        ...baseRecord,
        ...extractedRecord,
        status,
        reason,
        verified_datetime: status === 'verified' ? new Date().toISOString() : '',
      });
      return Response.json({ status, reason, verification_id: record.id });
    };

    // The document stays in private storage — the backend issues a
    // short-lived signed URL just long enough for the OCR extraction.
    const extractFrom = async (uri, schema) => {
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 300 });
      const res = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url: signed.signed_url,
        json_schema: { type: 'object', properties: schema, required: Object.keys(schema) },
      });
      if (res.status !== 'success' || !res.output) return null;
      const out = Array.isArray(res.output) ? res.output[0] : res.output;
      return out && typeof out === 'object' ? out : null;
    };

    let front;
    try {
      front = await extractFrom(file_uri, EXTRACT_SCHEMAS[document_type]);
    } catch (extractError) {
      // Unsupported or unreadable file — recorded as a failed attempt.
      return saveRecord('failed', 'unreadable');
    }
    if (!front) return saveRecord('failed', 'unreadable');

    // Personal Card with separate side photos: the back must be readable and
    // carry the SAME card number as the front — proving both photos belong to
    // one card.
    if (document_type === 'personal_card' && file_uri_back) {
      let back = null;
      try {
        back = await extractFrom(file_uri_back, { personal_card_number: { type: 'string' } });
      } catch (backError) {
        back = null;
      }
      const backNumber = back && back.personal_card_number !== undefined && back.personal_card_number !== null
        ? String(back.personal_card_number) : '';
      if (backNumber.trim() === '') return saveRecord('failed', 'unreadable', front);
      if (normalizeId(backNumber) !== normalizeId(front.personal_card_number)) {
        return saveRecord('failed', 'card_mismatch', front);
      }
    }

    let anyExtracted = false;
    for (const key of requiredFields) {
      const raw = front[key];
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') anyExtracted = true;
    }
    // Every required field must match exactly — the entered information is
    // never modified, so a mismatch fails verification instead of passing it.
    const verified = requiredFields.every((key) => fieldMatches(key, front[key], expected[key]));

    if (verified) return saveRecord('verified', '', front);
    return saveRecord('failed', !anyExtracted ? 'unreadable' : 'mismatch', front);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}