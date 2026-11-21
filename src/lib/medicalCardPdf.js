import { jsPDF } from "jspdf";
import { loadRequestLogo } from "@/lib/requestPdfLayout";

// The downloadable AMedix medical card.
//
// The card is drawn on a canvas with the browser's own 2D text engine — so
// Arabic is shaped and ordered correctly — and that canvas becomes the PDF
// page. No DOM capture, no external renderer: the download either produces the
// card or reports a clear error, and it behaves the same on Android, iPhone and
// desktop.
//
// The artwork is the AMedix white patient card: white surface, deep navy text,
// light blue accents and the navy footer band.

const COPY = {
  en: {
    dir: "ltr",
    brand: "AMedix",
    kind: "PATIENT CARD",
    medicalId: "Medical ID",
    title: "AMedix Medical Card",
    patientName: "PATIENT NAME",
    patientId: "CIN (NATIONAL ID)",
    status: "STATUS",
    issued: "ISSUED",
    expires: "VALID UNTIL",
    cardNumber: "CARD NUMBER",
    patientQr: "AMedix Patient QR",
    scan: "Scan to verify",
    footer: "AMedix | Your Health. Connected.",
    statuses: { active: "ACTIVE", expired: "EXPIRED", revoked: "REVOKED" },
    footnote:
      "This card is an AMedix digital medical identification card. It is not an Apple-issued identity document. Scanning the code confirms the card's current status only; clinical records are never shown and remain protected by the patient's authorization.",
  },
  ar: {
    dir: "rtl",
    brand: "AMedix",
    kind: "بطاقة المريض",
    medicalId: "بطاقة طبية",
    title: "بطاقة AMedix الطبية",
    patientName: "اسم المريض",
    patientId: "الرقم الوطني",
    status: "الحالة",
    issued: "تاريخ الإصدار",
    expires: "صالحة حتى",
    cardNumber: "رقم البطاقة",
    patientQr: "رمز المريض AMedix",
    scan: "امسح للتحقق",
    footer: "AMedix | صحتك، متصلة.",
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
const QR_PAD = 15;
const QR_BOX = QR_SIZE + QR_PAD * 2;

const NAVY = "#082F6B";
const MUTED = "#667085";
const LIGHT = "#EAF3FF";
const EDGE = "#D0D5DD";
const CRITICAL = "#B42318";
const WARNING = "#B54708";

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
  const statusInk = card.status === "active" ? NAVY : card.status === "revoked" ? CRITICAL : WARNING;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // Page
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // Card face — white surface with soft light-blue corners and the navy footer band
  ctx.save();
  roundRect(ctx, 0, 0, W, CARD_H, 26);
  ctx.clip();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, CARD_H);
  ctx.fillStyle = LIGHT;
  ctx.beginPath();
  ctx.arc(rtl ? 40 : W - 40, 30, 210, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rtl ? W - 20 : 20, CARD_H - 70, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, CARD_H - 46, W, 46);
  ctx.restore();

  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1;
  roundRect(ctx, 0.5, 0.5, W - 1, CARD_H - 1, 26);
  ctx.stroke();

  // Brand lockup — the original AMedix logo, untouched
  const brandX = rtl ? W - M : M;
  let logoWidth = 0;
  if (logo?.img) {
    const logoHeight = 58;
    logoWidth = logoHeight * (logo.ratio || 1);
    ctx.drawImage(logo.img, rtl ? brandX - logoWidth : brandX, 34, logoWidth, logoHeight);
  }
  const brandTextX = rtl ? brandX - (logoWidth ? logoWidth + 14 : 0) : brandX + (logoWidth ? logoWidth + 14 : 0);
  ctx.direction = copy.dir;
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = NAVY;
  ctx.font = `700 28px ${FONT_HEAD}`;
  ctx.fillText(copy.brand, brandTextX, 70);
  ctx.fillStyle = MUTED;
  ctx.font = `600 12px ${FONT_BODY}`;
  ctx.fillText(copy.kind, brandTextX, 92);

  // Medical ID badge
  ctx.font = `600 12px ${FONT_BODY}`;
  const badgeW = ctx.measureText(copy.medicalId).width + 34;
  const badgeX = rtl ? M : W - M - badgeW;
  ctx.fillStyle = LIGHT;
  roundRect(ctx, badgeX, 40, badgeW, 32, 16);
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.textAlign = "center";
  ctx.fillText(copy.medicalId, badgeX + badgeW / 2, 61);

  ctx.strokeStyle = EDGE;
  ctx.beginPath();
  ctx.moveTo(M, 124);
  ctx.lineTo(W - M, 124);
  ctx.stroke();

  // Patient name
  const colX = rtl ? W - M : M;
  const blockWidth = W - M * 2 - QR_BOX - 40;
  ctx.direction = copy.dir;
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = MUTED;
  ctx.font = `11px ${FONT_BODY}`;
  ctx.fillText(copy.patientName, colX, 168);

  const name = (rtl ? card.patient_name_ar : "") || card.patient_name || "";
  ctx.fillStyle = NAVY;
  ctx.font = `700 32px ${FONT_HEAD}`;
  const nameLines = wrapText(ctx, name, blockWidth).slice(0, 2);
  nameLines.forEach((line, index) => ctx.fillText(line, colX, 206 + index * 38));

  // Identity fields
  const labelY = 206 + nameLines.length * 38 + 14;
  const fields = [
    { label: copy.patientId, value: card.patient_cin || "—", mono: true },
    { label: copy.issued, value: day(card.issued_datetime), mono: false },
    { label: copy.expires, value: day(card.expires_datetime), mono: false },
  ];
  const gap = 30;
  const widths = fields.map((field) => {
    ctx.font = `10px ${FONT_BODY}`;
    const labelWidth = ctx.measureText(field.label).width;
    ctx.font = field.mono ? `700 18px ${FONT_MONO}` : `600 16px ${FONT_BODY}`;
    const valueWidth = ctx.measureText(field.value).width;
    return Math.max(labelWidth, valueWidth);
  });
  let cursor = colX;
  fields.forEach((field, index) => {
    ctx.direction = copy.dir;
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillStyle = MUTED;
    ctx.font = `10px ${FONT_BODY}`;
    ctx.fillText(field.label, cursor, labelY);
    ctx.fillStyle = NAVY;
    ctx.font = field.mono ? `700 18px ${FONT_MONO}` : `600 16px ${FONT_BODY}`;
    ctx.fillText(field.value, cursor, labelY + 27);
    cursor += (rtl ? -1 : 1) * (widths[index] + gap);
  });

  // QR block with the card number beneath it
  const qrBoxX = rtl ? M : W - M - QR_BOX;
  const qrBoxY = 150;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, qrBoxX, qrBoxY, QR_BOX, QR_BOX, 18);
  ctx.fill();
  ctx.strokeStyle = EDGE;
  ctx.stroke();
  if (qr) ctx.drawImage(qr, qrBoxX + QR_PAD, qrBoxY + QR_PAD, QR_SIZE, QR_SIZE);
  ctx.direction = copy.dir;
  ctx.textAlign = "center";
  ctx.fillStyle = MUTED;
  ctx.font = `11px ${FONT_BODY}`;
  ctx.fillText(copy.patientQr, qrBoxX + QR_BOX / 2, qrBoxY + QR_BOX + 20);
  ctx.fillStyle = NAVY;
  ctx.font = `700 13px ${FONT_MONO}`;
  ctx.fillText(card.card_number || "", qrBoxX + QR_BOX / 2, qrBoxY + QR_BOX + 40);

  // Light-blue facts strip: status and card number
  const stripY = 398;
  const stripH = 74;
  const stripW = W - M * 2;
  ctx.fillStyle = LIGHT;
  roundRect(ctx, M, stripY, stripW, stripH, 16);
  ctx.fill();

  const cells = [
    { label: copy.status, value: status, ink: statusInk, mono: false },
    { label: copy.cardNumber, value: card.card_number || "—", ink: NAVY, mono: true },
  ];
  const cellW = stripW / cells.length;
  cells.forEach((cell, index) => {
    const edge = rtl ? W - M - index * cellW : M + index * cellW;
    const tx = rtl ? edge - 20 : edge + 20;
    if (index > 0) {
      const dividerX = edge;
      ctx.strokeStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(dividerX, stripY + 16);
      ctx.lineTo(dividerX, stripY + stripH - 16);
      ctx.stroke();
    }
    ctx.direction = copy.dir;
    ctx.textAlign = rtl ? "right" : "left";
    ctx.fillStyle = MUTED;
    ctx.font = `11px ${FONT_BODY}`;
    ctx.fillText(cell.label, tx, stripY + 30);
    ctx.fillStyle = cell.ink;
    ctx.font = cell.mono ? `700 16px ${FONT_MONO}` : `700 17px ${FONT_BODY}`;
    ctx.fillText(cell.value, tx, stripY + 55);
  });

  // Navy footer band
  ctx.direction = copy.dir;
  ctx.textAlign = rtl ? "left" : "right";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `11px ${FONT_BODY}`;
  ctx.fillText(copy.footer, rtl ? M : W - M, CARD_H - 17);

  // Sheet: title, notice and verification link (all shaped by the browser)
  const footTop = CARD_H + 40;
  ctx.direction = copy.dir;
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = NAVY;
  ctx.font = `700 16px ${FONT_HEAD}`;
  ctx.fillText(copy.title, rtl ? W - M : M, footTop);

  ctx.fillStyle = MUTED;
  ctx.font = `12px ${FONT_BODY}`;
  const noticeLines = wrapText(ctx, copy.footnote, W - M * 2);
  noticeLines.forEach((line, index) => ctx.fillText(line, rtl ? W - M : M, footTop + 24 + index * 18));

  const urlY = footTop + 24 + noticeLines.length * 18 + 14;
  ctx.direction = "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = NAVY;
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