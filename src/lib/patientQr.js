import { PDF_INK } from "@/lib/requestPdfLayout";

// The patient's own QR code — the same code the Patient Portal shows at the
// pharmacy counter: it encodes the Clinical Identification Number only, never
// a name, a diagnosis or any other clinical detail.
export async function loadPatientQrDataUrl(cin, size = 220) {
  const value = String(cin || "").trim();
  if (!value) return null;
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&qzone=1&data=${encodeURIComponent(value)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    // The QR is an aid — a document is still printed without it.
    return null;
  }
}

// Draws the patient QR with its CIN underneath, so the sheet identifies the
// patient both to a person reading it and to a scanner.
export function drawPatientQr(doc, { cin, dataUrl, x, y, size = 15, caption = "Patient QR" } = {}) {
  const value = String(cin || "").trim();
  if (!value) return;

  if (dataUrl) {
    try {
      doc.addImage(dataUrl, "PNG", x, y, size, size, undefined, "FAST");
    } catch (e) {
      // Fall through to the printed CIN only.
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(...PDF_INK.muted);
  doc.text(caption, x + size / 2, y + size + 3.2, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.4);
  doc.setTextColor(...PDF_INK.navy);
  doc.text(value, x + size / 2, y + size + 6.8, { align: "center" });
}

// Places the patient QR on the framed request form, in the free area beside
// the signature heading — clear of the request barcode at the foot.
export async function addPatientQrToRequestForm(doc, cin) {
  const value = String(cin || "").trim();
  if (!value) return;
  const dataUrl = await loadPatientQrDataUrl(value);
  const size = 14;
  const x = 190 - size;
  const y = 216;
  drawPatientQr(doc, { cin: value, dataUrl, x, y, size });
}