import React from "react";
import { Check, ChevronRight } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import MedicalIdCardDownload from "@/components/patient/card/MedicalIdCardDownload";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// The card at the top of the patient's home screen. Identification only —
// name, patient ID, card status and the verification code. Never a diagnosis,
// an allergy or any other clinical value.
const PILL = {
  active: "bg-emerald-400 text-emerald-950",
  expired: "bg-white/85 text-slate-700",
  revoked: "bg-red-400 text-red-950",
};

const PLUSES = [
  "left-[42%] top-4 text-[15px]",
  "left-[63%] top-2 text-[11px]",
  "left-[55%] top-16 text-[13px]",
  "left-[30%] top-24 text-[10px]",
  "left-[72%] top-20 text-[10px]",
];

export default function PatientHomeMedicalCard({ profile, card, onViewCard }) {
  const { t, lang } = usePatientLanguage();
  const name = (lang === "ar" ? profile?.full_name_ar : "") || profile?.full_name || "—";
  const status = card?.status || null;

  const qrValue = card?.verification_token
    ? `${window.location.origin}/verify-card?token=${card.verification_token}`
    : profile?.cin || "";
  const qrSrc = qrValue
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&qzone=1&data=${encodeURIComponent(qrValue)}`
    : null;
  const largeQrSrc = qrValue
    ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&qzone=1&data=${encodeURIComponent(qrValue)}`
    : null;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#1c3e5e] to-[#24506f] p-4 text-primary-foreground shadow-[0_16px_36px_-20px_rgba(23,50,77,0.85)] sm:p-5">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none font-bold text-white/10">
        {PLUSES.map((position) => (
          <span key={position} className={`absolute ${position}`}>+</span>
        ))}
        <span className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/5" />
        <span className="absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-sky-400/10" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-9 w-9 shrink-0 object-contain" />
            <span className="font-heading text-base font-bold leading-none">AMedix</span>
          </div>
          <p className="mt-3 break-words text-[15px] font-semibold leading-tight sm:text-base">{name}</p>
          <p className="mt-1 text-[11px] text-white/70">
            {t("Patient ID")}: <span className="font-mono tracking-wide text-white/90">{profile?.cin || "—"}</span>
          </p>
          {status && (
            <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PILL[status] || PILL.expired}`}>
              {status === "active" && <Check className="h-3 w-3" aria-hidden="true" />}
              {t(status)}
            </span>
          )}
        </div>

        {qrSrc && (
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label={t("Open card QR code")}
                className="shrink-0 rounded-xl bg-white p-1.5 shadow-lg transition hover:bg-white/90"
              >
                <img src={qrSrc} alt={t("Card verification QR code")} className="h-[74px] w-[74px] sm:h-20 sm:w-20" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogTitle className="text-center font-heading text-base font-bold text-primary">
                {t("AMedix Medical Card")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t("Scan this code with any phone camera to verify the card.")}
              </DialogDescription>
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-border">
                  <img src={largeQrSrc} alt={t("Card verification QR code")} className="h-56 w-56" />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {t("Scan this code with any phone camera to verify the card.")}
                </p>
                <dl className="w-full space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-start">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("Patient")}</dt>
                    <dd className="break-words text-sm font-semibold text-primary">{name}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("Patient ID")}</dt>
                      <dd className="break-all font-mono text-sm font-medium text-primary">{profile?.cin || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("Card number")}</dt>
                      <dd className="break-all font-mono text-sm font-medium text-primary">{card?.card_number || "—"}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative mt-4 flex items-start gap-2">
        <button
          type="button"
          onClick={onViewCard}
          className="flex flex-1 items-center justify-between gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-white/90"
        >
          {t("View Medical Card")}
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
        <MedicalIdCardDownload />
      </div>
    </section>
  );
}