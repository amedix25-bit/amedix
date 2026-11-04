// Minimal, dependency-free DICOM reader used by the manual import workflow.
// It reads a DICOM Part 10 file's element stream and returns the identifying
// attributes the portal needs (Study / Series / SOP Instance UIDs, modality,
// study date, accession number and patient identity). It never invents a
// value: a missing attribute stays empty so the import can be refused.

export type DicomTags = {
  studyInstanceUid: string;
  seriesInstanceUid: string;
  sopInstanceUid: string;
  sopClassUid: string;
  modality: string;
  studyDate: string;
  accessionNumber: string;
  studyDescription: string;
  seriesDescription: string;
  seriesNumber: number | null;
  patientName: string;
  patientId: string;
  patientBirthDate: string;
  transferSyntax: string;
};

const WANTED: Record<string, keyof DicomTags> = {
  "00080016": "sopClassUid",
  "00080018": "sopInstanceUid",
  "00080020": "studyDate",
  "00080050": "accessionNumber",
  "00080060": "modality",
  "00081030": "studyDescription",
  "0008103e": "seriesDescription",
  "00100010": "patientName",
  "00100020": "patientId",
  "00100030": "patientBirthDate",
  "0020000d": "studyInstanceUid",
  "0020000e": "seriesInstanceUid",
  "00200011": "seriesNumber",
};

const LONG_VRS = ["OB", "OW", "OF", "SQ", "UT", "UN", "OD", "OL", "OV", "SR", "UC", "UR"];

function hex(group: number, element: number): string {
  return group.toString(16).padStart(4, "0") + element.toString(16).padStart(4, "0");
}

function decodeText(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  const slice = end >= 0 ? bytes.subarray(0, end) : bytes;
  let out = "";
  try {
    out = new TextDecoder("utf-8", { fatal: false }).decode(slice);
  } catch (err) {
    for (let i = 0; i < slice.length; i += 1) out += String.fromCharCode(slice[i]);
  }
  return out.replace(/[\u0000-\u001f]/g, "").trim().replace(/\s{2,}/g, " ");
}

// Parse one DICOM Part 10 byte array. Returns null when the bytes are not a
// DICOM file (no "DICM" magic) so the caller can refuse it explicitly.
export function parseDicom(bytes: Uint8Array): DicomTags | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const len = bytes.length;
  const hasMagic =
    len > 132 && bytes[128] === 0x44 && bytes[129] === 0x49 && bytes[130] === 0x43 && bytes[131] === 0x4d;
  if (!hasMagic) return null;

  const tags: Record<string, any> = {};
  let explicitVR = true;
  let little = true;
  let pos = 132;

  // File meta information (group 0002) is always explicit VR little endian.
  while (pos + 8 <= len) {
    const group = view.getUint16(pos, true);
    if (group !== 0x0002) break;
    const element = view.getUint16(pos + 2, true);
    const vr = String.fromCharCode(bytes[pos + 4], bytes[pos + 5]);
    let valueLength: number;
    let valueStart: number;
    if (LONG_VRS.includes(vr)) {
      valueLength = view.getUint32(pos + 8, true);
      valueStart = pos + 12;
    } else {
      valueLength = view.getUint16(pos + 6, true);
      valueStart = pos + 8;
    }
    if (hex(group, element) === "00020010" && valueLength < 64) {
      const ts = decodeText(bytes.subarray(valueStart, valueStart + valueLength));
      if (ts) tags.transferSyntax = ts;
      // Exact transfer-syntax UIDs only — never a pattern that could match the
      // tail of another UID and misread the byte order.
      const syntax: Record<string, { explicit: boolean; little: boolean }> = {
        "1.2.840.10008.1.2": { explicit: false, little: true },
        "1.2.840.10008.1.2.1": { explicit: true, little: true },
        "1.2.840.10008.1.2.1.99": { explicit: true, little: true },
        "1.2.840.10008.1.2.2": { explicit: true, little: false },
      };
      const chosen = syntax[ts];
      if (chosen) {
        explicitVR = chosen.explicit;
        little = chosen.little;
      }
      // A deflated dataset cannot be walked synchronously: stop here so the
      // import refuses it explicitly instead of reading garbage.
      if (ts === "1.2.840.10008.1.2.1.99") {
        pos = len;
        break;
      }
    }
    pos = valueStart + valueLength;
    if (valueLength === 0xffffffff) break;
  }

  // Dataset.
  const seen = new Set<string>();
  let guard = 0;
  while (pos + 8 <= len && guard < 4000) {
    guard += 1;
    const group = view.getUint16(pos, little);
    const element = view.getUint16(pos + 2, little);
    const key = hex(group, element);
    let vr = "";
    let valueLength: number;
    let valueStart: number;
    if (explicitVR) {
      vr = String.fromCharCode(bytes[pos + 4], bytes[pos + 5]);
      if (LONG_VRS.includes(vr)) {
        valueLength = view.getUint32(pos + 8, little);
        valueStart = pos + 12;
      } else {
        valueLength = view.getUint16(pos + 6, little);
        valueStart = pos + 8;
      }
    } else {
      valueLength = view.getUint32(pos + 4, little);
      valueStart = pos + 8;
    }

    if (WANTED[key] && valueLength !== 0xffffffff && valueLength < 512 && valueStart + valueLength <= len) {
      const text = decodeText(bytes.subarray(valueStart, valueStart + valueLength));
      if (WANTED[key] === "seriesNumber") {
        tags.seriesNumber = Number(text) || null;
      } else {
        tags[WANTED[key]] = text;
      }
      seen.add(key);
    }

    if (valueLength === 0xffffffff) {
      // Undefined-length sequence/item: skip to its delimiter when one exists.
      if (key === "00200011") tags.seriesNumber = null;
      const marker = little ? [0xfe, 0xff, 0xdd, 0xe0] : [0xff, 0xfe, 0xe0, 0xdd];
      let found = -1;
      for (let i = valueStart; i + 3 < len; i += 1) {
        if (bytes[i] === marker[0] && bytes[i + 1] === marker[1] && bytes[i + 2] === marker[2] && bytes[i + 3] === marker[3]) {
          found = i;
          break;
        }
      }
      if (found < 0) break;
      pos = found + 8;
      continue;
    }

    pos = valueStart + valueLength;
    if (tags.studyInstanceUid && tags.seriesInstanceUid && tags.sopInstanceUid && tags.modality) break;
  }

  // Series number is read separately (it is numeric and not in WANTED map).
  const result: DicomTags = {
    studyInstanceUid: String(tags.studyInstanceUid || ""),
    seriesInstanceUid: String(tags.seriesInstanceUid || ""),
    sopInstanceUid: String(tags.sopInstanceUid || ""),
    sopClassUid: String(tags.sopClassUid || ""),
    modality: String(tags.modality || ""),
    studyDate: String(tags.studyDate || ""),
    accessionNumber: String(tags.accessionNumber || ""),
    studyDescription: String(tags.studyDescription || ""),
    seriesDescription: String(tags.seriesDescription || ""),
    seriesNumber: typeof tags.seriesNumber === "number" ? tags.seriesNumber : null,
    patientName: String(tags.patientName || ""),
    patientId: String(tags.patientId || ""),
    patientBirthDate: String(tags.patientBirthDate || ""),
    transferSyntax: String(tags.transferSyntax || ""),
  };
  return result;
}

// A DICOM date (YYYYMMDD) rendered as ISO, or empty when absent/invalid.
export function dicomDate(value: string): string {
  const v = String(value || "").replace(/[^0-9]/g, "");
  if (v.length !== 8) return "";
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
}

export type ZipEntry = { name: string; data: Uint8Array };

// Read a ZIP package (stored or deflated entries) without external packages.
// Returns null when the bytes are not a ZIP archive.
export async function readZip(bytes: Uint8Array, maxEntries = 60): Promise<ZipEntry[] | null> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const len = bytes.length;
  if (len < 22) return null;
  const minEocd = Math.max(0, len - 66000);
  let eocd = -1;
  for (let i = len - 22; i >= minEocd; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const entries: ZipEntry[] = [];

  for (let i = 0; i < count && entries.length < maxEntries; i += 1) {
    if (offset + 46 > len || view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    offset = offset + 46 + nameLength + extraLength + commentLength;

    if (/\/$/.test(name)) continue;
    if (localOffset + 30 > len || view.getUint32(localOffset, true) !== 0x04034b50) continue;
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > len) continue;
    const raw = bytes.subarray(dataStart, dataEnd);

    if (method === 0) {
      entries.push({ name, data: raw });
    } else if (method === 8) {
      try {
        const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        const buffer = await new Response(stream).arrayBuffer();
        entries.push({ name, data: new Uint8Array(buffer) });
      } catch (err) {
        // An entry that cannot be decompressed is skipped, never guessed at.
      }
    }
  }
  return entries;
}

export function isZip(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}