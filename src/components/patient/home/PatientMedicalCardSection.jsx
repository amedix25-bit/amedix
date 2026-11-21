import React, { useState } from "react";
import { ChevronDown, CreditCard } from "lucide-react";
import PatientMedicalIdCard from "@/components/patient/PatientMedicalIdCard";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Keeps the full medical card off the home screen until the patient asks for
// it — the card itself is unchanged, only how it is revealed.
export default function PatientMedicalCardSection(props) {
  const { t } = usePatientLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-start shadow-sm transition hover:bg-accent/40"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info/10 text-info">
          <CreditCard className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-primary">{t("Medical Card")}</span>
          <span className="block text-[11px] text-muted-foreground">
            {open ? t("Tap to hide your medical card") : t("Tap to show your medical card")}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && <PatientMedicalIdCard {...props} />}
    </div>
  );
}