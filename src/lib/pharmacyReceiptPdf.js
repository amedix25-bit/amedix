import { jsPDF } from "jspdf";
import {
  PDF_INK,
  PDF_PAGE,
  FLOW_BOTTOM,
  loadRequestLogo,
  drawRequestHeader,
  startPage,
  drawSectionLabel,
  drawField,
  drawDivider,
  drawRequestFooter,
} from "@/lib/requestPdfLayout";

const TITLE = "PAYMENT RECEIPT";

const METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  insurance: "Insurance",
  mobile_wallet: "Mobile Wallet",
  other: "Other",
};

const STATUS_LABELS = {
  unpaid: "Payment Pending",
  partial: "Partially Paid",
  paid: "Paid",
  refunded: "Refunded",
};

// Printable payment receipt for a pharmacy PaymentTransaction, in the shared
// AMedix document layout — pharmacy and patient, the items charged, the
// amounts, the method and the full payment history.
export async function generateReceiptPdf(tx, logo) {
  const artwork = logo || (await loadRequestLogo());
  const doc = new jsPDF();
  const { margin: M, right: R } = PDF_PAGE;

  let y = drawRequestHeader(doc, { logo: artwork, title: TITLE });

  const need = (height) => {
    if (y + height > FLOW_BOTTOM) y = startPage(doc, artwork, TITLE) + 4;
  };

  // ===== Pharmacy & patient =====
  drawSectionLabel(doc, "Pharmacy", y);
  drawSectionLabel(doc, "Patient", y, M + 92);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF_INK.ink);
  doc.text(String(tx.pharmacy_name || "—"), M, y + 9, { maxWidth: 82 });
  doc.text(String(tx.patient_name || "—"), M + 92, y + 9, { maxWidth: 78 });

  drawField(doc, "Pharmacist", tx.pharmacist_name, M, y + 18);
  drawField(doc, "Clinical Identification Number (CIN)", tx.patient_cin, M + 92, y + 18, { bold: true, color: PDF_INK.navy });
  drawField(doc, "Prescription", tx.prescription_ref, M, y + 33);
  drawField(
    doc,
    "Dispensed",
    tx.dispensing_datetime
      ? new Date(tx.dispensing_datetime).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "Payment recorded before dispensing",
    M + 92,
    y + 33,
    { width: 78 },
  );

  y += 44;
  drawDivider(doc, y);
  y += 10;

  // ===== Items =====
  drawSectionLabel(doc, "Items Dispensed", y);
  drawSectionLabel(doc, "Strength", y, R - 26, "right");
  drawSectionLabel(doc, "Qty", y, R, "right");
  y += 7.5;

  const items = tx.items || [];
  if (items.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_INK.muted);
    doc.text("No item detail recorded", M, y);
    y += 7;
  }
  items.forEach((item) => {
    need(9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...PDF_INK.ink);
    doc.text(String(item.medication_name || "—").slice(0, 60), M, y);
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_INK.muted);
    doc.text(String(item.strength || "—"), R - 26, y, { align: "right" });
    doc.text(String(item.quantity || "—"), R, y, { align: "right" });
    y += 7;
  });

  // ===== Payment summary =====
  y += 2;
  drawDivider(doc, y);
  y += 9;
  drawSectionLabel(doc, "Payment Summary", y);
  y += 7.5;

  [
    ["Amount due", tx.amount_due ?? "—"],
    ["Amount paid", tx.amount_paid ?? "0"],
    ["Outstanding balance", tx.outstanding_balance ?? "—"],
    ["Payment status", STATUS_LABELS[tx.payment_status] || tx.payment_status || "—"],
  ].forEach(([label, value]) => {
    need(9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...PDF_INK.ink);
    doc.text(String(label), M, y);
    doc.setFont("helvetica", "bold");
    doc.text(String(value), R, y, { align: "right" });
    y += 7;
  });

  // ===== Payment history =====
  y += 2;
  drawDivider(doc, y);
  y += 9;
  drawSectionLabel(doc, "Payment History", y);
  y += 7.5;

  const entries = tx.payments || [];
  if (entries.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_INK.muted);
    doc.text("No payments recorded yet", M, y);
    y += 7;
  }
  entries.forEach((entry) => {
    need(14);
    const type = entry.entry_type === "payment" ? "Payment" : entry.entry_type === "refund" ? "Refund" : "Adjustment";
    const method = entry.method ? `  ·  ${METHOD_LABELS[entry.method] || entry.method}` : "";
    const verification = entry.verification === "pending_verification" ? "  ·  Pending verification" : "";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...PDF_INK.ink);
    doc.text(`${type}: ${entry.amount ?? 0}${method}${verification}`, M, y, { maxWidth: R - M });

    doc.setFontSize(8);
    doc.setTextColor(...PDF_INK.muted);
    doc.text(
      [entry.datetime ? new Date(entry.datetime).toLocaleString("en-GB") : "", entry.pharmacist_name || "", entry.note || ""]
        .filter(Boolean)
        .join("  ·  "),
      M,
      y + 4.5,
      { maxWidth: R - M },
    );
    y += 11;
  });

  drawRequestFooter(
    doc,
    tx.transaction_id,
    "Payment status is recorded separately from dispensing status. Non-cash payments are confirmed only after verification by the pharmacy.",
  );

  doc.save(`receipt-${tx.transaction_id || "transaction"}.pdf`);
}