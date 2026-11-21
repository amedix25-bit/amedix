import React from "react";
import { ChevronRight, CreditCard } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The medical card lives in one place only — the Medical Card section, as a
// single tall printable page. The home screen just offers the way in.
export default function PatientHomeMedicalCard({ onViewCard }) {
  const { t } = usePatientLanguage();
  return (
    <button
      type="button"
      onClick={onViewCard}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-start shadow-[0_10px_30px_-24px_rgba(8,47,107,0.6)] transition hover:border-primary/40"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <CreditCard className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-sm font-bold text-patient-ink">{t("AMedix Medical Card")}</span>
        <span className="mt-0.5 block text-[11px] text-patient-muted">{t("View your printable medical card")}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
    </button>
  );
}