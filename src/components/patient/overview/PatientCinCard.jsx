import React from "react";
import { CreditCard, QrCode, Shield } from "lucide-react";
import QrCodeCard from "@/components/QrCodeCard";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The patient's identification card on the dashboard — verified badge, the
// permanent CIN with its QR code and the two ways to present it.
export default function PatientCinCard({ cin, onShowQr, onShowCard }) {
  const { t } = usePatientLanguage();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-patient-accent to-patient-ink p-6 text-white shadow-[0_20px_45px_-24px_hsl(211_100%_45%_/_0.8)]">
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">
            <Shield className="h-3.5 w-3.5" />
            {t("Verified Patient")}
          </span>

          <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-white/70">{t("My CIN")}</p>
          <p className="mt-1 text-3xl font-bold tracking-[0.12em]">{cin || "—"}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onShowQr}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-patient-accent transition-colors hover:bg-white/90"
            >
              <QrCode className="h-4 w-4" />
              {t("Show QR Code")}
            </button>
            <button
              type="button"
              onClick={onShowCard}
              className="inline-flex items-center gap-2 rounded-xl border border-white/50 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <CreditCard className="h-4 w-4" />
              {t("View Card")}
            </button>
          </div>
        </div>

        <div className="shrink-0 self-start rounded-2xl bg-white p-2.5 shadow-lg sm:self-center">
          <QrCodeCard cin={cin} size={112} />
        </div>
      </div>
    </div>
  );
}