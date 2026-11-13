// AMedix Zero-Retention Document Verification Policy.
//
// A submitted identity document exists only long enough to read the number
// printed on it and compare that number with the number the user entered.
// What the verification record keeps afterwards is the decision and nothing
// else: no document, no image, no PDF, no storage reference, no copy of what
// the document said, and no complete identification number.
//
// Kept on every record: verification status, document category, the
// verification timestamp, the method (automated document-number matching),
// a masked number where it is needed to show the user what was compared, and
// the verification reference (the record id) for audit.

export const RETENTION_POLICY = 'zero_retention_v1';
export const RETENTION_METHOD = 'automated_document_number_matching';

const MASK = '•';

// A number reduced to its last four characters — enough for the user to see
// what was compared, never enough to identify the document.
export function maskDocumentNumber(value: unknown): string {
  const raw = String(value ?? '').trim().replace(/\s+/g, '');
  if (!raw) return '';
  if (raw.length <= 4) return MASK.repeat(raw.length);
  return MASK.repeat(raw.length - 4) + raw.slice(-4);
}

export function isMasked(value: unknown): boolean {
  return typeof value === 'string' && value.includes(MASK);
}

// Every field that holds part of the document itself, or a location of it.
export const DOCUMENT_VESTIGE_FIELDS = [
  'file_uri',
  'file_name',
  'file_mime',
  'original_file_uri',
  'original_file_name',
  'file_uri_back',
  'file_name_back',
  'extracted_date_of_birth',
  'extracted_national_id_number',
  'extracted_license_number',
  'extracted_full_name',
  'extracted_personal_card_number',
  'extracted_passport_number',
];

export const NUMBER_FIELDS = ['national_id_number', 'license_number', 'personal_card_number', 'passport_number'];

// The retention facts written on every new decision.
export function retentionFields(datetime: string) {
  return {
    document_retained: false,
    retention_policy: RETENTION_POLICY,
    retention_method: RETENTION_METHOD,
    document_purged_datetime: datetime,
  };
}

// The automated check, with every number reduced to its masked form.
export function scrubAutoCheck(autoCheck: any): any {
  if (!autoCheck || typeof autoCheck !== 'object') return autoCheck ?? null;
  const checks = Array.isArray(autoCheck.checks)
    ? autoCheck.checks.map((c: any) => ({
      field: c?.field ?? '',
      label: c?.label ?? '',
      entered: maskDocumentNumber(c?.entered),
      read: maskDocumentNumber(c?.read),
      matched: !!c?.matched,
      decisive: !!c?.decisive,
    }))
    : [];
  return {
    outcome: autoCheck.outcome ?? '',
    checked_datetime: autoCheck.checked_datetime ?? '',
    engine: autoCheck.engine ?? '',
    number_field: autoCheck.number_field ?? '',
    number_label: autoCheck.number_label ?? '',
    entered_number: maskDocumentNumber(autoCheck.entered_number),
    read_number: maskDocumentNumber(autoCheck.read_number),
    sides_read: Array.isArray(autoCheck.sides_read) ? autoCheck.sides_read : [],
    checks,
    note: autoCheck.note ?? '',
  };
}

// Whether a stored record still carries any part of the document.
export function hasRetainedDocument(record: any): boolean {
  if (!record) return false;
  if (DOCUMENT_VESTIGE_FIELDS.some((f) => typeof record[f] === 'string' && record[f] !== '')) return true;
  if (typeof record.file_size === 'number' && record.file_size > 0) return true;
  if (NUMBER_FIELDS.some((f) => {
    const v = record[`expected_${f}`];
    return typeof v === 'string' && v !== '' && !isMasked(v);
  })) return true;
  if (isMasked(record.auto_check?.entered_number) === false && typeof record.auto_check?.entered_number === 'string' && record.auto_check.entered_number !== '') return true;
  return false;
}

// The $set that removes every document trace from a record stored before this
// policy existed. Run by purgeVerificationDocuments.
export function purgeUpdate(record: any, datetime: string) {
  const set: Record<string, any> = {};
  DOCUMENT_VESTIGE_FIELDS.forEach((f) => { set[f] = ''; });
  set.file_size = 0;
  set.page_count = 1;
  NUMBER_FIELDS.forEach((f) => { set[`expected_${f}`] = maskDocumentNumber(record?.[`expected_${f}`]); });
  set.expected_full_name = '';
  set.expected_date_of_birth = '';
  if (record?.auto_check) set.auto_check = scrubAutoCheck(record.auto_check);
  Object.assign(set, retentionFields(datetime));
  return set;
}