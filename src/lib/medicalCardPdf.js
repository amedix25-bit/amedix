import { jsPDF } from "jspdf";
import { loadRequestLogo } from "@/lib/requestPdfLayout";

// The downloadable AMedix medical card.
//
// The card is drawn on a canvas with the browser's own 2D text engine — so
// Arabic is shaped and ordered correctly — and that canvas becomes the PDF
// page. No DOM capture, no external renderer: the download either produces the
// card or reports a clear error, and it behaves the same on Android, iPhone and
// desktop.

const COPY = {
  en: {
    dir: "ltr",
    brand: "AMedix",
    kind: "DIGITAL MEDICAL CARD",
    title: "AMedix Medical Card",
    patient: "PATIENT",
    patientId: "PATIENT ID",
    status: "STATUS",
    issued: "ISSUED",
    expires: "VALID UNTIL",
    scan: "Scan to verify",
    statuses: { active: "ACTIVE", expired: "EXPIRED", revoked: "REVOKED" },
    footnote:
      "This card is an AMedix digital medical identification card. It is not an Apple-issued identity document. Scanning the code confirms the card's current status only; clinical records are never shown and remain protected by the patient's authorization.",
  },
  ar: {
    dir: "rtl",
    brand: "AMedix",
    kind: "البطاقة الطبية الرقمية",
    title: "بطاقة AMedix الطبية",
    patient: "المريض",
    patientId: "رقم المريض",
    status: "الحالة",
    issued: "تاريخ الإصدار",
    expires: "صالحة حتى",
    scan: "امسح للتحقق",
    statuses: { active: "نشطة", expired: "منتهية", revoked: "ملغاة" },
    footnote:
      "هذه بطاقة تعريف طبية رقمية من AMedix، وليست وثيقة هوية صادرة عن Apple. مسح الرمز يؤكد حالة البطاقة الحالية فقط، ولا يعرض أي سجلات طبية محمية.",
  },
};

const W = 900;
const CARD_H = 568;
const H = CARD_H + 150;
const SCALE = 3;
const M = 42;
const QR_SIZE = 138;
const QR_PAD = 10;
const QR_BOX = QR_SIZE + QR_PAD * 2;

const FONT_HEAD = "'Space Grotesk', Arial, Helvetica, sans-serif";
const FONT_BODY = "Arial, Helvetica, sans-serif";
const FONT_MONO = "Consolas, 'Courier New', monospace";

function day(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_unavailable"));
    img.src = src;
  });
}

async function qrImage(value) {
  if (!value) return null;
  try {
    const res = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=520x520&qzone=1&data=${encodeURIComponent(value)}`
    );
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    return dataUrl ? await loadImage(dataUrl) : null;
  } catch (error) {
    return null;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(next).width <= maxWidth) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function drawCard({ card, lang, logo, qr }) {
  const copy = COPY[lang] || COPY.en;
  const rtl = copy.dir === "rtl";
  const status = copy.statuses[card.status] || card.status || "";
  const statusColor = card.status === "active" ? "#7DE2A8" : card.status === "revoked" ? "#FF9C9C" : "#D7DEE7";

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // Page
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // Card face
  const grad = ctx.createLinearGradient(0, 0, W, CARD_H);
  grad.addColorStop(0, "#17324D");
  grad.addColorStop(0.52, "#1C3E5E");
  grad.addColorStop(1, "#24506F");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, CARD_H);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.arc(rtl ? 120 : W - 120, 60, 165, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(56,189,248,0.10)";
  ctx.beginPath();
  ctx.arc(rtl ? W - 60 : 60, CARD_H - 40, 150, 0, Math.PI * 2);
  ctx.fill();

  // Brand lockup
  const brandX = rtl ? W - M : M;
  let logoWidth = 0;
  if (logo?.img) {
    const logoHeight = 64;
    logoWidth = logoHeight * (logo.ratio || 1);
    const logoX = rtl ? brandX - logoWidth : brandX;
    ctx.drawImage(logo.img, logoX, 36, logoWidth, logoHeight);
  }
  const brandTextX = rtl ? brandX - (logoWidth ? logoWidth + 16 : 0) : brandX + (logoWidth ? logoWidth + 16 : 0);
  ctx.direction = copy.dir;
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 30px ${FONT_HEAD}`;
  ctx.fillText(copy.brand, brandTextX, 74);
  ctx.fillStyle = "#B9CEDF";
  ctx.font = `12px ${FONT_BODY}`;
  ctx.fillText(copy.kind, brandTextX, 96);

  // Status pill
  ctx.textAlign = rtl ? "left" : "right";
  ctx.fillStyle = "#9FB6C9";
  ctx.font = `10px ${FONT_BODY}`;
  ctx.fillText(copy.status, rtl ? M : W - M, 50);

  ctx.font = `700 13px ${FONT_BODY}`;
  const statusWidth = ctx.measureText(status).width;
  const pillW = statusWidth + 30;
  const pillH = 32;
  const pillX = rtl ? M : W - M - pillW;
  const pillY = 60;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.strokeStyle = statusColor;
  ctx.lineWidth = 1;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = statusColor;
  ctx.textAlign = "center";
  ctx.fillText(status, pillX + pillW / 2, pillY + 21);

  // Patient block
  const colX = rtl ? W - M : M;
  const blockWidth = W - M * 2 - QR_BOX - 34;
  ctx.direction = copy.dir;
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = "#9FB6C9";
  ctx.font = `11px ${FONT_BODY}`;
  ctx.fillText(copy.patient, colX, 296);

  const name = (rtl ? card.patient_name_ar : "") || card.patient_name || "";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 34px ${FONT_HEAD}`;
  const nameLines = wrapText(ctx, name, blockWidth).slice(0, 2);
  nameLines.forEach((line, index) => ctx.fillText(line, colX, 340 + index * 40));

  const labelY = 340 + nameLines.length * 40 + 14;
  const fields = [
    { label: copy.patientId, value: card.patient_cin || "—", mono: true },
    { label: copy.issued, value: day(card.issued_datetime), mono: false },
    { label: copy.expires, value: day(card.expires_datetime), mono: false },
  ];
  const gap = 34;
  const widths = fields.map((field) => {
    ctx.font = `10px ${FONT_BODY}`;
    const labelWidth = ctx.measureText(field.label).width;
    ctx.font = field.mono ? `700 19px ${FONT_MONO}` : `600 17px ${FONT_BODY}`;
    const valueWidth = ctx.measureText(field.value).width;
    return Math.max(labelWidth, valueWidth);
  });
  let cursor = colX;
  fields.forEach((field, index) => {
    ctx.direction = copy.dir;
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillStyle = "#9FB6C9";
    ctx.font = `10px ${FONT_BODY}`;
    ctx.fillText(field.label, cursor, labelY);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = field.mono ? `700 19px ${FONT_MONO}` : `600 17px ${FONT_BODY}`;
    ctx.fillText(field.value, cursor, labelY + 27);
    cursor += (rtl ? -1 : 1) * (widths[index] + gap);
  });

  // QR block
  const qrBoxX = rtl ? M : W - M - QR_BOX;
  const qrBoxY = 320;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, qrBoxX, qrBoxY, QR_BOX, QR_BOX, 16);
  ctx.fill();
  if (qr) ctx.drawImage(qr, qrBoxX + QR_PAD, qrBoxY + QR_PAD, QR_SIZE, QR_SIZE);
  ctx.direction = copy.dir;
  ctx.textAlign = "center";
  ctx.fillStyle = "#B9CEDF";
  ctx.font = `11px ${FONT_BODY}`;
  ctx.fillText(copy.scan, qrBoxX + QR_BOX / 2, qrBoxY + QR_BOX + 20);

  // Card footer
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, 486);
  ctx.lineTo(W - M, 486);
  ctx.stroke();

  ctx.direction = "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = "#A9C0D3";
  ctx.font = `11px ${FONT_BODY}`;
  ctx.fillText("AMedix · amedixly.com", rtl ? W - M : M, 514);

  ctx.textAlign = rtl ? "left" : "right";
  ctx.font = `11px ${FONT_MONO}`;
  ctx.fillText(card.card_number || "", rtl ? M : W - M, 514);

  // Sheet: title, notice and verification link (all shaped by the browser)
  const footTop = CARD_H + 40;
  ctx.direction = copy.dir;
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = "#17324D";
  ctx.font = `700 16px ${FONT_HEAD}`;
  ctx.fillText(copy.title, rtl ? W - M : M, footTop);

  ctx.fillStyle = "#6E7A8A";
  ctx.font = `12px ${FONT_BODY}`;
  const noticeLines = wrapText(ctx, copy.footnote, W - M * 2);
  noticeLines.forEach((line, index) => ctx.fillText(line, rtl ? W - M : M, footTop + 24 + index * 18));

  const urlY = footTop + 24 + noticeLines.length * 18 + 14;
  ctx.direction = "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = "#17324D";
  ctx.font = `12px ${FONT_MONO}`;
  ctx.fillText(card.verify_url || "", rtl ? W - M : M, urlY);

  return { canvas, urlY };
}

export async function downloadMedicalCardPdf({ card, verifyUrl, lang = "en" }) {
  const copy = COPY[lang] || COPY.en;
  const [logoData, qr] = await Promise.all([loadRequestLogo().catch(() => null), qrImage(verifyUrl)]);

  let logo = null;
  if (logoData?.dataUrl) {
    try {
      logo = { img: await loadImage(logoData.dataUrl), ratio: logoData.ratio };
    } catch (error) {
      logo = null;
    }
  }

  const { canvas, urlY } = drawCard({
    card: { ...card, verify_url: verifyUrl },
    lang,
    logo,
    qr,
  });

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = imageWidth * (canvas.height / canvas.width);
  const top = 18;

  doc.addImage(canvas.toDataURL("image/png"), "PNG", margin, top, imageWidth, imageHeight);

  // The printed link is also clickable.
  try {
    const mmPerPx = imageWidth / W;
    doc.link(margin + M * mmPerPx, top + urlY * mmPerPx - 3.4, 108, 5, { url: verifyUrl });
  } catch (error) {
    // A missing link never blocks the card.
  }

  doc.save(`AMedix-Medical-Card-${card.card_number || "card"}-${copy.dir === "rtl" ? "AR" : "EN"}.pdf`);
}