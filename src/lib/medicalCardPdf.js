import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { loadRequestLogo } from "@/lib/requestPdfLayout";

// The downloadable AMedix medical card.
//
// The card is laid out as real HTML (so Arabic is shaped and ordered by the
// browser, not by a PDF font table that cannot join Arabic letters), rendered
// to a high-resolution image and placed on an A4 page. The page prints, saves
// and shares like any other PDF.

const COPY = {
  en: {
    dir: "ltr",
    brand: "AMedix",
    kind: "DIGITAL MEDICAL CARD",
    patient: "PATIENT",
    patientId: "PATIENT ID",
    status: "STATUS",
    issued: "ISSUED",
    expires: "VALID UNTIL",
    scan: "Scan to verify",
    statuses: { active: "ACTIVE", expired: "EXPIRED", revoked: "REVOKED" },
    footnote: "This card is an AMedix digital medical identification card. It is not an Apple-issued identity document. Scanning the code confirms the card's current status only; clinical records are never shown and remain protected by the patient's authorization.",
  },
  ar: {
    dir: "rtl",
    brand: "AMedix",
    kind: "البطاقة الطبية الرقمية",
    patient: "المريض",
    patientId: "رقم المريض",
    status: "الحالة",
    issued: "تاريخ الإصدار",
    expires: "صالحة حتى",
    scan: "امسح للتحقق",
    statuses: { active: "نشطة", expired: "منتهية", revoked: "ملغاة" },
    footnote: "هذه بطاقة تعريف طبية رقمية من AMedix، وليست وثيقة هوية صادرة عن Apple. مسح الرمز يؤكد حالة البطاقة الحالية فقط، ولا يعرض أي سجلات طبية محمية.",
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function day(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

async function qrDataUrl(value, size = 520) {
  try {
    const res = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&qzone=1&data=${encodeURIComponent(value)}`
    );
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
}

function cardMarkup({ card, lang, logoDataUrl, qr }) {
  const copy = COPY[lang] || COPY.en;
  const name = lang === "ar" ? (card.patient_name_ar || card.patient_name) : card.patient_name;
  const status = copy.statuses[card.status] || card.status;
  const statusColor = card.status === "active" ? "#7DE2A8" : card.status === "expired" ? "#D7DEE7" : "#FF9C9C";

  return `
    <div style="width:900px;height:568px;box-sizing:border-box;padding:38px 42px;display:flex;flex-direction:column;justify-content:space-between;
      font-family:'Geist','Space Grotesk',Arial,Helvetica,sans-serif;color:#FFFFFF;direction:${copy.dir};
      background:linear-gradient(135deg,#17324D 0%,#1C3E5E 52%,#24506F 100%);position:relative;overflow:hidden;">
      <div style="position:absolute;right:-90px;top:-110px;width:330px;height:330px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
      <div style="position:absolute;left:-70px;bottom:-130px;width:300px;height:300px;border-radius:50%;background:rgba(56,189,248,0.10);"></div>

      <div style="display:flex;align-items:center;justify-content:space-between;position:relative;">
        <div style="display:flex;align-items:center;gap:16px;">
          ${logoDataUrl ? `<img src="${logoDataUrl}" alt="AMedix" style="height:64px;width:auto;object-fit:contain;" />` : ""}
          <div>
            <div style="font-family:'Space Grotesk',Arial,sans-serif;font-size:30px;font-weight:700;letter-spacing:0.5px;">${copy.brand}</div>
            <div style="font-size:12px;letter-spacing:2.4px;color:#B9CEDF;margin-top:4px;">${copy.kind}</div>
          </div>
        </div>
        <div style="text-align:${copy.dir === "rtl" ? "left" : "right"};">
          <div style="font-size:10px;letter-spacing:2px;color:#9FB6C9;">${copy.status}</div>
          <div style="margin-top:6px;display:inline-block;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,0.12);
            border:1px solid ${statusColor};color:${statusColor};font-size:13px;font-weight:700;letter-spacing:1px;">${status}</div>
        </div>
      </div>

      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:30px;position:relative;">
        <div style="min-width:0;flex:1;">
          <div style="font-size:11px;letter-spacing:2px;color:#9FB6C9;">${copy.patient}</div>
          <div style="font-size:34px;font-weight:700;line-height:1.2;margin-top:6px;word-break:break-word;">${escapeHtml(name)}</div>

          <div style="display:flex;gap:44px;margin-top:26px;">
            <div>
              <div style="font-size:10px;letter-spacing:2px;color:#9FB6C9;">${copy.patientId}</div>
              <div style="font-size:19px;font-weight:700;letter-spacing:1.4px;margin-top:4px;font-family:'SFMono-Regular',Consolas,monospace;">${escapeHtml(card.patient_cin)}</div>
            </div>
            <div>
              <div style="font-size:10px;letter-spacing:2px;color:#9FB6C9;">${copy.issued}</div>
              <div style="font-size:17px;font-weight:600;margin-top:4px;">${day(card.issued_datetime)}</div>
            </div>
            <div>
              <div style="font-size:10px;letter-spacing:2px;color:#9FB6C9;">${copy.expires}</div>
              <div style="font-size:17px;font-weight:600;margin-top:4px;">${day(card.expires_datetime)}</div>
            </div>
          </div>
        </div>

        <div style="text-align:center;flex-shrink:0;">
          <div style="background:#FFFFFF;padding:10px;border-radius:16px;box-shadow:0 10px 24px rgba(0,0,0,0.25);">
            ${qr ? `<img src="${qr}" alt="QR" style="width:138px;height:138px;display:block;" />` : ""}
          </div>
          <div style="font-size:11px;color:#B9CEDF;margin-top:8px;letter-spacing:1px;">${copy.scan}</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.16);
        padding-top:14px;font-size:11px;color:#A9C0D3;position:relative;">
        <span>AMedix · amedixly.com</span>
        <span style="font-family:'SFMono-Regular',Consolas,monospace;letter-spacing:1px;">${escapeHtml(card.card_number)}</span>
      </div>
    </div>
  `;
}

export async function downloadMedicalCardPdf({ card, verifyUrl, lang = "en" }) {
  const copy = COPY[lang] || COPY.en;
  const [logo, qr] = await Promise.all([
    loadRequestLogo().catch(() => null),
    qrDataUrl(verifyUrl),
  ]);

  const node = document.createElement("div");
  node.setAttribute("data-medical-card", "pdf");
  node.style.position = "fixed";
  node.style.top = "0";
  node.style.left = "-10000px";
  node.style.zIndex = "-1";
  node.innerHTML = cardMarkup({ card, lang, logoDataUrl: logo?.dataUrl || "", qr });

  document.body.appendChild(node);
  let canvas;
  try {
    canvas = await html2canvas(node.firstElementChild, {
      scale: 3,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: false,
    });
  } finally {
    node.remove();
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = imageWidth * (canvas.height / canvas.width);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(23, 50, 77);
  doc.text(copy.dir === "rtl" ? "بطاقة AMedix الطبية" : "AMedix Medical Card", margin, 18);

  doc.addImage(canvas.toDataURL("image/png"), "PNG", margin, 24, imageWidth, imageHeight);

  const footerY = 24 + imageHeight + 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 122, 138);
  doc.text(doc.splitTextToSize(copy.footnote, imageWidth), margin, footerY);
  doc.setTextColor(23, 50, 77);
  doc.textWithLink(verifyUrl, margin, footerY + 14, { url: verifyUrl });

  doc.save(`AMedix-Medical-Card-${card.card_number}-${lang.toUpperCase()}.pdf`);
}