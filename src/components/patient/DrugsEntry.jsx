import React from "react";
import { Pill, ScrollText, ChevronRight } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";


// Patient Portal → Drugs. The single entry point for everything medication —
// the patient chooses what to open: their medications or their prescriptions.
// Offers from AMedix partner pharmacies show automatically at the top.
export default function DrugsEntry({ onOpen }) {
  const { t } = usePatientLanguage();

  const choices = [
    {
      key: "medications",
      icon: Pill,
      title: t("Medications"),
      description: t("Your current and past medications, dose reminders and adherence"),
    },
    {
      key: "prescriptions",
      icon: ScrollText,
      title: t("Prescriptions"),
      description: t("Your prescriptions and their journey through affiliated pharmacies — from issue to dispensing."),
    },
  ];

  return (
    <div className="space-y-3">
      {choices.map((choice) => (
        <button
          key={choice.key}
          type="button"
          onClick={() => onOpen(choice.key)}
          className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <choice.icon className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">{choice.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{choice.description}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-180" />
          </div>
        </button>
      ))}
    </div>
  );
}