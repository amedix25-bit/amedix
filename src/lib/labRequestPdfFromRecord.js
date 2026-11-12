import { base44 } from "@/api/base44Client";
import { generateLabRequestPdf, addRequestBarcode } from "@/lib/labRequestPdf";
import { loadRequestLogo } from "@/lib/requestPdfLayout";
import { signatureImageDataUrl } from "@/lib/doctorSignature";

// Rebinds the signature that was applied when the request was issued, so a
// re-rendered form still shows who signed it and when.
async function resolveSignature(record) {
  if (!record.signature_record_id) return null;
  let image = null;
  try {
    const sig = await base44.entities.DoctorSignature.get(record.signature_record_id);
    if (sig?.signature_file_uri) image = await signatureImageDataUrl(sig.signature_file_uri);
  } catch (e) {
    // Not readable by this viewer — the printed signing details still appear.
  }
  return {
    image_data_url: image?.data_url,
    image_format: image?.format,
    signed_at: record.signed_datetime ? new Date(record.signed_datetime).toLocaleString() : "",
    signed_by_name: record.signed_by_name || record.doctor_name,
    reference: record.signature_reference,
  };
}

// Renders the request form from the record itself, so the document always
// carries the current AMedix template. Nothing is written back — the issued
// record and its stored file are never altered.
export async function openLabRequestPdfFromRecord(record) {
  // Opened inside the tap: a new tab after an await is blocked on iOS Safari
  // and Android Chrome, so the rendered form fills the already-open tab.
  const tab = window.open("", "_blank");
  const [logo, signature] = await Promise.all([loadRequestLogo(), resolveSignature(record)]);
  const doc = generateLabRequestPdf({ ...record, logo, signature });
  try {
    await addRequestBarcode(doc, record.request_id);
  } catch (e) {
    // The barcode is an aid, not part of the record — never block the form.
  }
  const url = URL.createObjectURL(doc.output("blob"));
  if (tab) tab.location.href = url;
  else window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 300000);
}