import { jsPDF } from "jspdf";

const TEAL = [12, 98, 92];
const DARK = [23, 40, 45];
const GRAY = [105, 115, 120];
const LIGHT = [236, 245, 244];

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

// Printable payment receipt for a pharmacy PaymentTransaction — pharmacy
// details, transaction reference, date, items charged, amounts, method,
// outstanding balance and the full payment history.
export function generateReceiptPdf(tx) {
  const doc = new jsPDF();
  const W = 210, M = 15, R = W - M;
  let y;

  // ===== Header band =====
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 27, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("AMedix", M, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Connected Care. Better Health.", M, 18.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("PAYMENT RECEIPT", R, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Transaction ID: ${tx.transaction_id || "-"}`, R, 18.5, { align: "right" });
  doc.text(`Issued: ${new Date().toLocaleString()}`, R, 23, { align: "right" });

  // ===== Pharmacy & patient =====
  y = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("PHARMACY", M, y);
  doc.text("PATIENT", R, y);
  y += 5;
  doc.setTextColor(...DARK);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text(tx.pharmacy_name || "-", M, y);
  doc.text(tx.patient_name || "-", R, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text(`Pharmacist: ${tx.pharmacist_name || "-"}`, M, y);
  doc.text(`CIN: ${tx.patient_cin || "-"}`, R, y);
  y += 4.5;
  doc.text(`Prescription: ${tx.prescription_ref || "-"}`, M, y);
  if (tx.dispensing_datetime) {
    doc.text(`Dispensed: ${new Date(tx.dispensing_datetime).toLocaleString()}`, R, y);
  } else {
    doc.text("Payment recorded before dispensing", R, y);
  }

  // ===== Items =====
  y += 10;
  doc.setFillColor(...LIGHT);
  doc.rect(M, y - 4, W - 2 * M, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("ITEM / MEDICATION", M + 2, y + 0.5);
  doc.text("STRENGTH", R - 60, y + 0.5, { align: "right" });
  doc.text("QTY", R - 32, y + 0.5, { align: "right" });
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const items = tx.items && tx.items.length ? tx.items : [];
  if (items.length === 0) {
    doc.setTextColor(...GRAY);
    doc.text("No item detail recorded", M + 2, y);
    y += 6;
  }
  for (const it of items) {
    doc.setTextColor(...DARK);
    doc.text(String(it.medication_name || "-").slice(0, 60), M + 2, y);
    doc.setTextColor(...GRAY);
    doc.text(String(it.strength || "-"), R - 60, y, { align: "right" });
    doc.text(String(it.quantity || "-"), R - 32, y, { align: "right" });
    y += 5.5;
  }

  // ===== Payment summary =====
  y += 3;
  doc.setDrawColor(...LIGHT);
  doc.line(M, y, R, y);
  y += 7;
  const summaryRows = [
    ["Amount due", String(tx.amount_due ?? "-")],
    ["Amount paid", String(tx.amount_paid ?? "0")],
    ["Outstanding balance", String(tx.outstanding_balance ?? "-")],
    ["Payment status", STATUS_LABELS[tx.payment_status] || tx.payment_status || "-"],
  ];
  doc.setFontSize(9);
  for (const [label, value] of summaryRows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(label, M, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(value, R, y, { align: "right" });
    y += 6;
  }

  // ===== Payment history =====
  y += 2;
  doc.setDrawColor(...LIGHT);
  doc.line(M, y, R, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("PAYMENT HISTORY", M, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const entries = tx.payments && tx.payments.length ? tx.payments : [];
  if (entries.length === 0) {
    doc.setTextColor(...GRAY);
    doc.text("No payments recorded yet", M, y);
    y += 6;
  }
  for (const e of entries) {
    if (y > 275) { doc.addPage(); y = 20; }
    const type = e.entry_type === "payment" ? "Payment" : e.entry_type === "refund" ? "Refund" : "Adjustment";
    const method = e.method ? ` · ${METHOD_LABELS[e.method] || e.method}` : "";
    const ver = e.verification === "pending_verification" ? " (pending verification)" : "";
    doc.setTextColor(...DARK);
    doc.text(`${type}: ${e.amount ?? 0}${method}${ver}`, M, y);
    doc.setTextColor(...GRAY);
    doc.setFontSize(7.5);
    doc.text(
      `${e.datetime ? new Date(e.datetime).toLocaleString() : ""} · ${e.pharmacist_name || "-"}${e.note ? ` · ${e.note}` : ""}`,
      M, y + 4,
    );
    doc.setFontSize(8.5);
    y += 10;
  }

  // ===== Footer =====
  y = Math.max(y + 4, 280);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(
    "Payment status is recorded separately from dispensing status. Non-cash payments are confirmed only after verification by the pharmacy.",
    M, y, { maxWidth: W - 2 * M },
  );

  doc.save(`receipt-${tx.transaction_id || "transaction"}.pdf`);
}