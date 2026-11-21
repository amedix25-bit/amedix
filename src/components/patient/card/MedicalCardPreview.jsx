import React from "react";
import { ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

// The on-screen medical card. Deliberately shows identification only — name,
// patient ID, card status and dates — never a diagnosis, an allergy or any
// other clinical value, because this screen can be seen by anyone nearby.
const STATUS_STYLES = {
  active: "bg-emerald-400/15 text-emerald-100 ring-emerald-300/40",
  expired: "bg-white/10 text-white/80 ring-white/25",
  revoked: "bg-red-500/20 text-red-100 ring-red-300/40",
};

function formatDay(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MedicalCardPreview({ card, verifyUrl, lang = "en", t = (key) => key }) {
  const isArabic = lang === "ar";
  const name = isArabic ? card.patient_name_ar || card.patient_name : card.patient_name;
  const qrSrc = verifyUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&qzone=1&data=${encodeURIComponent(verifyUrl)}`
    : null;

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="mx-auto w-full max-w-[440px]">
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-primary via-[#1c3e5e] to-[#24506f] p-5 text-primary-foreground shadow-[0_18px_40px_-18px_rgba(23,50,77,0.65)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/5" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-52 w-52 rounded-full bg-sky-400/10" aria-hidden="true" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="font-heading text-xl font-bold leading-tight">AMedix</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-white/65">
                {t("Digital Medical Card")}
              </p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${STATUS_STYLES[card.status] || STATUS_STYLES.expired}`}>
            {t(card.status)}
          </span>
        </div>

        <div className="relative mt-6 flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">{t("Patient")}</p>
            <p className="mt-1 break-words text-lg font-semibold leading-snug">{name}</p>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-white/55">{t("Patient ID")}</dt>
                <dd className="mt-0.5 break-all font-mono text-sm font-semibold tracking-wide">{card.patient_cin}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-white/55">{t("Issued")}</dt>
                <dd className="mt-0.5 text-sm font-medium">{formatDay(card.issued_datetime)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-white/55">{t("Valid until")}</dt>
                <dd className="mt-0.5 text-sm font-medium">{formatDay(card.expires_datetime)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-white/55">{t("Card number")}</dt>
                <dd className="mt-0.5 break-all font-mono text-[13px] font-semibold">{card.card_number}</dd>
              </div>
            </dl>
          </div>

          <div className="shrink-0 text-center">
            <div className="rounded-2xl bg-white p-2 shadow-lg">
              {qrSrc ? (
                <img src={qrSrc} alt={t("Card verification QR code")} className="h-[92px] w-[92px]" />
              ) : (
                <div className="h-[92px] w-[92px]" />
              )}
            </div>
            <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-white/60">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {t("Scan to verify")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}