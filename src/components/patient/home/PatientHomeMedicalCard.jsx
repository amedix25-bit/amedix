import React from "react";
import { Check, ChevronRight } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import MedicalIdCardDownload from "@/components/patient/card/MedicalIdCardDownload";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// The compact medical card summary on the patient's home screen. It shows
// identification only — name, patient ID, card status and the verification
// code — and opens the full card when the patient taps it.
const PILL = {
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-amber-100 text-amber-800",
  revoked: "bg-red-100 text-red-700",
};

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
    <section className="rounded-2xl border border-white/70 bg-white/65 p-3.5 shadow-[0_10px_30px_-20px_rgba(23,50,77,0.55)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-8 w-8 shrink-0 object-contain" />
            <span className="font-heading text-sm font-bold leading-none text-patient-ink">AMedix</span>
          </div>
          <p className="mt-2.5 break-words text-sm font-bold leading-tight text-patient-ink">{name}</p>
          <p className="mt-0.5 text-[11px] text-patient-muted">
            {t("Patient ID")}: <span className="font-mono tracking-wide">{profile?.cin || "—"}</span>
          </p>
          {status && (
            <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PILL[status] || PILL.expired}`}>
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
                className="shrink-0 rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-border/60 transition hover:bg-white"
              >
                <img src={qrSrc} alt={t("Card verification QR code")} className="h-[68px] w-[68px]" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogTitle className="text-center font-heading text-base font-bold text-patient-ink">
                {t("AMedix Medical Card")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t("Scan this code with any phone camera to verify the card.")}
              </DialogDescription>
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-border">
                  <img src={largeQrSrc} alt={t("Card verification QR code")} className="h-56 w-56" />
                </div>
                <p className="text-center text-xs text-patient-muted">
                  {t("Scan this code with any phone camera to verify the card.")}
                </p>
                <dl className="w-full space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-start">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-patient-muted">{t("Patient")}</dt>
                    <dd className="break-words text-sm font-semibold text-patient-ink">{name}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-patient-muted">{t("Patient ID")}</dt>
                      <dd className="break-all font-mono text-sm font-medium text-patient-ink">{profile?.cin || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-patient-muted">{t("Card number")}</dt>
                      <dd className="break-all font-mono text-sm font-medium text-patient-ink">{card?.card_number || "—"}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onViewCard}
          className="flex flex-1 items-center justify-between gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-semibold text-patient-ink shadow-sm ring-1 ring-border/60 transition hover:bg-white"
        >
          {t("View Medical Card")}
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
        <MedicalIdCardDownload />
      </div>
    </section>
  );
}