import { jsPDF } from "jspdf";
import { base44 } from "@/api/base44Client";
import { formatStoredValue } from "@/lib/examinations/clinicalExaminations";
import {
  PDF_INK,
  PDF_PAGE,
  loadRequestLogo,
  drawRequestHeader,
  drawIdentityBlock,
  drawSectionLabel,
  drawField,
  drawDivider,
  drawWrappedBlock,
  drawSignatureInline,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";

const FALLBACK_TITLE = "CLINICAL DOCUMENT";

const fmt = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime())
    ? d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
};

// Turns a stored structured value into the text the document prints.
function fieldText(value) {
  let val = formatStoredValue(value);
  if (Array.isArray(val)) {
    // Tooth Chart entries and other structured arrays render as lines.
    val = val.map((e) => e && typeof e === "object"
      ? `Tooth ${e.tooth} — ${(e.status || "").replace(/_/g, " ")}${e.note ? ` (${e.note})` : ""}`
      : String(e)).join("\n");
  }
  return String(val ?? "");
}

// Builds the official PDF of a completed clinical document in the shared
// AMedix layout — patient identity, the authoring doctor and encounter, the
// record reference, the clinical content and the electronic signature block —
// and uploads it so it is stored in the patient's Clinical Notes/Documents.
export async function generateClinicalDocumentPdfUrl(record, logo) {
  const artwork = logo || (await loadRequestLogo());
  const pdf = new jsPDF();
  const { margin: M } = PDF_PAGE;
  const title = String(record.document_type_label || FALLBACK_TITLE).toUpperCase();

  let y = drawRequestHeader(pdf, { logo: artwork, title });

  y = drawIdentityBlock(pdf, {
    name: record.patient_name,
    cin: record.patient_cin,
    fields: [["Date of Birth", record.patient_dob]],
  }, y);

  // ===== Authoring doctor & encounter =====
  const top = y + 7;
  drawSectionLabel(pdf, "Document Author", top);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...PDF_INK.ink);
  pdf.text(String(record.doctor_name || "").trim() || "—", M, top + 9);

  drawField(pdf, "Specialty", record.doctor_specialty, M, top + 18);
  drawField(pdf, "Hospital / Clinic", record.hospital, M + 92, top + 18);
  drawField(pdf, "Department", record.department, M, top + 33);
  drawField(pdf, "Date & Time", fmt(record.created_datetime), M + 92, top + 33);

  y = top + 44;

  // ===== Record reference =====
  drawSectionLabel(pdf, "Document Record", y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...PDF_INK.muted);
  pdf.text(
    `Visit ${record.encounter_id || "—"}   ·   Version ${record.version || 1} ${record.amendment_status === "amendment" ? "Amendment" : "Original"}   ·   ${record.status === "signed" ? "Signed" : "Draft"}`,
    M,
    y + 6,
    { maxWidth: PDF_PAGE.right - M },
  );
  y += 12;
  drawDivider(pdf, y);
  y += 8;

  // ===== Structured specialty fields =====
  if (record.data && Object.keys(record.data).length > 0) {
    Object.values(record.data).forEach((field) => {
      if (!field || field.value === null || field.value === undefined || String(field.value) === "") return;
      y = drawWrappedBlock(pdf, String(field.label || ""), fieldText(field.value), y, artwork, title);
    });
  }

  // ===== Clinical content =====
  y = drawWrappedBlock(pdf, null, record.content, y, artwork, title);

  // ===== Electronic signature =====
  if (record.status === "signed") {
    y = drawSignatureInline(pdf, {
      doctorName: record.signed_by_name || record.doctor_name,
      detail: [record.doctor_specialty, record.hospital].filter(Boolean).join("  ·  "),
      note: `Electronically signed ${fmt(record.signed_datetime)}   ·   Document ${record.document_id} version ${record.version} ${record.amendment_status === "amendment" ? "amendment" : "original"}`,
    }, y, artwork, title);
  }

  drawRequestFooter(pdf, record.document_id);

  const blob = pdf.output("blob");
  const file = new File([blob], `AMedix-${record.document_id}-v${record.version}.pdf`, { type: "application/pdf" });
  // Signed clinical documents are private: the stored reference is a private
  // file URI, resolved to a short-lived signed URL for authorized readers only.
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  return file_uri;
}