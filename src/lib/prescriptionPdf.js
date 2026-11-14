import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";
import {
  PDF_INK,
  drawRequestHeader,
  drawSectionLabel,
  drawDoctorBlock,
  drawFieldGrid,
  drawTextBlock,
  drawDivider,
  drawSignatureBlock,
  drawRequestFooter,
  ensureSpace,
  ensureSignatureRoom,
  textBlockHeight,
  loadRequestLogo,
} from "@/lib/requestPdfLayout";
import { drawPatientQr, loadPatientQrDataUrl } from "@/lib/patientQr";
import { signatureImageDataUrl } from "@/lib/doctorSignature";

const M = 18;
const R = 192;

const ROUTE_LABELS = {
  oral: "Oral",
  intravenous: "Intravenous",
  intramuscular: "Intramuscular",
  subcutaneous: "Subcutaneous",
  topical: "Topical",
  inhalation: "Inhalation",
  rectal: "Rectal",
  ophthalmic: "Ophthalmic",
  otic: "Otic",
  nasal: "Nasal",
  other: "Other",
};

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ===== Patient band =====
// The patient's name, their CIN printed in full, and their own QR code beside
// it — the two identifiers a pharmacy and the patient's own portal share.
function drawPatientBand(doc, record, qrDataUrl, y) {
  drawSectionLabel(doc, "Patient Information", y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(record.patient_name || "").trim() || "—", M, y + 11, { maxWidth: 138 });

  const size = 18;
  drawPatientQr(doc, { cin: record.patient_cin, dataUrl: qrDataUrl, x: R - size, y: y + 1, size });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...PDF_INK.muted);
  doc.text("Clinical Identification Number (CIN)", M, y + 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_INK.navy);
  doc.text(String(record.patient_cin || "").trim() || "—", M, y + 25.5);

  if (record.patient_dob) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...PDF_INK.muted);
    doc.text(`Date of birth ${formatDate(record.patient_dob)}`, M + 62, y + 25.5);
  }

  drawDivider(doc, y + 30);
  return y + 30;
}

// ===== The prescription itself =====
function drawMedicationBlock(doc, record, y) {
  const top = y + 8;
  drawSectionLabel(doc, "Medication Prescribed", top);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(record.medication_name || "").trim() || "—", M, top + 8, { maxWidth: 150 });

  const cells = [
    ["Strength", record.strength],
    ["Dosage", record.dosage],
    ["Route", ROUTE_LABELS[record.route] || record.route],
    ["Frequency", record.frequency],
    ["Duration", record.duration],
    ["Quantity", record.quantity],
    ["Refills authorized", String(record.refills_authorized || 0)],
    ["Date prescribed", formatDate(record.date_prescribed)],
  ]
    .filter(([, value]) => String(value || "").trim())
    .map(([label, value]) => [label, value]);

  const end = drawFieldGrid(doc, cells, top + 11);
  return end + 4;
}

// Renders the prescription sheet. Nothing is written back — the issued record is
// never altered by printing it.
export function generatePrescriptionPdf(record, { logo, signature, qrDataUrl } = {}) {
  const doc = new jsPDF();

  let y = drawRequestHeader(doc, {
    logo,
    title: "Prescription",
    subtitle: "Official Medical Document",
    framed: true,
  });

  y = drawPatientBand(doc, record, qrDataUrl, y);
  y = drawDoctorBlock(
    doc,
    {
      doctor_name: record.doctor_name,
      doctor_specialization: record.doctor_specialization,
      doctor_hospital: record.doctor_hospital,
      date_requested: record.date_prescribed,
      request_time: formatTime(record.prescribed_datetime),
    },
    y,
    { heading: "Prescribing Doctor & Hospital", doctorLabel: "Prescribing doctor" }
  );

  y = drawMedicationBlock(doc, record, y);

  const instructions = String(record.special_instructions || "").trim();
  if (instructions) {
    y = ensureSpace(doc, y, textBlockHeight(doc, instructions), logo, "Prescription");
    y = drawTextBlock(doc, "Instructions to the Patient", instructions, y);
  }

  y = ensureSignatureRoom(doc, y, logo, "Prescription");
  const sig = signature || null;
  drawSignatureBlock(doc, {
    image: sig?.image_data_url,
    imageFormat: sig?.image_format,
    doctorName: record.doctor_name,
    detail: [record.doctor_specialization, record.doctor_hospital].filter(Boolean).join("  ·  "),
    note: sig?.signed_at
      ? `Electronically signed ${sig.signed_at}`
      : "Electronically signed in the AMedix clinical record",
  });

  drawRequestFooter(doc, record.prescription_id || record.id);
  return doc;
}

// ===== Signature =====
// Rebinds the signature applied when the prescription was issued. A viewer who
// may not read the signature record (for example the patient) still gets the
// prescriber's printed details and the signing note.
async function resolveSignature(record) {
  try {
    const rows = await base44.entities.DocumentSignature.filter({
      document_type: "prescription",
      document_id: record.id,
    });
    const sig = (rows || [])[0];
    if (!sig?.signature_record_id) return null;
    const stored = await base44.entities.DoctorSignature.get(sig.signature_record_id);
    if (!stored?.signature_file_uri) return null;
    const image = await signatureImageDataUrl(stored.signature_file_uri);
    return {
      image_data_url: image?.data_url,
      image_format: image?.format,
      signed_at: sig.signed_datetime ? new Date(sig.signed_datetime).toLocaleString() : "",
    };
  } catch (e) {
    return null;
  }
}

// Opens the prescription form in a new tab, rendered from the record itself.
export async function openPrescriptionPdf(record) {
  const tab = window.open("", "_blank");
  const [logo, qrDataUrl, signature] = await Promise.all([
    loadRequestLogo(),
    loadPatientQrDataUrl(record.patient_cin),
    resolveSignature(record),
  ]);
  const doc = generatePrescriptionPdf(record, { logo, signature, qrDataUrl });
  const url = URL.createObjectURL(doc.output("blob"));
  if (tab) tab.location.href = url;
  else window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 300000);
}