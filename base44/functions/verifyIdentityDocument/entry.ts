import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Which identifying fields each verification document must confirm, per
// profile type. This whitelist is the only accepted input — anything else is
// rejected before any extraction happens.
const DOC_TYPES = {
  patient: {
    birth_certificate: ['date_of_birth', 'national_id_number'],
  },
  doctor: {
    national_id: ['national_id_number'],
    medical_license: ['license_number'],
  },
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

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { profile_type, document_type, file_uri, file_name, expected = {} } = body;
    const requiredFields = DOC_TYPES[profile_type]?.[document_type];
    if (!requiredFields) {
      return Response.json({ error: 'Invalid document type' }, { status: 400 });
    }
    if (typeof file_uri !== 'string' || file_uri.length === 0 || file_uri.length > 500) {
      return Response.json({ error: 'Invalid file' }, { status: 400 });
    }
    for (const key of requiredFields) {
      const value = expected[key];
      if (typeof value !== 'string' || value.trim() === '' || value.length > 100) {
        return Response.json({ error: 'Missing required information' }, { status: 400 });
      }
    }

    const attemptedAt = new Date().toISOString();

    const baseRecord = {
      user_id: user.id,
      profile_type,
      document_type,
      file_uri,
      file_name: typeof file_name === 'string' ? file_name.slice(0, 200) : '',
      expected_date_of_birth: typeof expected.date_of_birth === 'string' ? expected.date_of_birth : '',
      expected_national_id_number: typeof expected.national_id_number === 'string' ? expected.national_id_number : '',
      expected_license_number: typeof expected.license_number === 'string' ? expected.license_number : '',
      attempted_datetime: attemptedAt,
    };

    const unreadable = async () => {
      const record = await base44.asServiceRole.entities.IdentityVerification.create({
        ...baseRecord,
        extracted_date_of_birth: '',
        extracted_national_id_number: '',
        extracted_license_number: '',
        status: 'failed',
        reason: 'unreadable',
        verified_datetime: '',
      });
      return Response.json({ status: 'failed', reason: 'unreadable', verification_id: record.id });
    };

    let extraction;
    try {
      // The document stays in private storage — the backend issues a
      // short-lived signed URL just long enough for the OCR extraction.
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 300 });
      extraction = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url: signed.signed_url,
        json_schema: {
          type: 'object',
          properties: {
            date_of_birth: { type: 'string' },
            national_id_number: { type: 'string' },
            license_number: { type: 'string' },
          },
          required: requiredFields,
        },
      });
    } catch (extractError) {
      // Unsupported or unreadable file — recorded as a failed attempt.
      return unreadable();
    }

    // The verification record is created with the service role — app users
    // cannot create or modify verification results themselves, so a "Verified"
    // status can only ever be produced here, after a real server-side match.
    if (extraction.status !== 'success' || !extraction.output) {
      const record = await base44.asServiceRole.entities.IdentityVerification.create({
        ...baseRecord,
        extracted_date_of_birth: '',
        extracted_national_id_number: '',
        extracted_license_number: '',
        status: 'failed',
        reason: 'unreadable',
        verified_datetime: '',
      });
      return Response.json({ status: 'failed', reason: 'unreadable', verification_id: record.id });
    }

    const out = Array.isArray(extraction.output) ? extraction.output[0] : extraction.output;
    const extracted = out && typeof out === 'object' ? out : {};

    let anyExtracted = false;
    const matches = {};
    for (const key of requiredFields) {
      const raw = extracted[key];
      const present = raw !== undefined && raw !== null && String(raw).trim() !== '';
      if (present) anyExtracted = true;
      if (key === 'date_of_birth') {
        matches[key] = present && normalizeDate(raw) !== null && normalizeDate(raw) === normalizeDate(expected[key]);
      } else {
        matches[key] = present && normalizeId(raw) === normalizeId(expected[key]);
      }
    }

    const verified = requiredFields.every((key) => matches[key]);
    const reason = !anyExtracted ? 'unreadable' : 'mismatch';

    const record = await base44.asServiceRole.entities.IdentityVerification.create({
      ...baseRecord,
      extracted_date_of_birth: extracted.date_of_birth !== undefined && extracted.date_of_birth !== null ? String(extracted.date_of_birth) : '',
      extracted_national_id_number: extracted.national_id_number !== undefined && extracted.national_id_number !== null ? String(extracted.national_id_number) : '',
      extracted_license_number: extracted.license_number !== undefined && extracted.license_number !== null ? String(extracted.license_number) : '',
      status: verified ? 'verified' : 'failed',
      reason: verified ? '' : reason,
      verified_datetime: verified ? new Date().toISOString() : '',
    });

    return Response.json({
      status: verified ? 'verified' : 'failed',
      reason: verified ? '' : reason,
      verification_id: record.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}