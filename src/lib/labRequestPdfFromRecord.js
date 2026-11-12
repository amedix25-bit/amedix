import { generateLabRequestPdf, addRequestBarcode } from "@/lib/labRequestPdf";
import { loadRequestLogo } from "@/lib/requestPdfLayout";

// Rebuilds the laboratory request form for a record whose stored PDF is
// missing — legacy requests saved before the form was stored with the order.
// The PDF is generated in the browser from the record's own data and opened
// locally: nothing is written back, so no record is duplicated or replaced.
export async function openLabRequestPdfFromRecord(record) {
  // Opened inside the tap: a new tab after an await is blocked on iOS Safari
  // and Android Chrome, so the rendered form fills the already-open tab.
  const tab = window.open("", "_blank");
  const logo = await loadRequestLogo();
  const doc = generateLabRequestPdf({ ...record, logo });
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