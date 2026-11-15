import React from "react";
import { Syringe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { VACCINES, VACCINE_RECEIVED, VACCINATION_STATUSES, optionLabel } from "@/lib/lifestyleOptions";

export default function PatientVaccinations({ profile, onOpenDocuments }) {
  const { t } = usePatientLanguage();
  const records = (profile?.vaccination_records || []).filter((record) => record.received);
  return <div className="space-y-4">
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold"><Syringe className="h-5 w-5 text-primary" />{t("Vaccination history")}</h2>
      <p className="mb-4 text-sm">{t("Vaccination Status")}: <strong>{optionLabel(VACCINATION_STATUSES, profile?.vaccination_status, t) || t("Not recorded")}</strong></p>
      {records.length ? <dl className="space-y-3">{records.map((record, index) => <div key={`${record.vaccine}-${index}`} className="border-t border-border pt-3">
        <dt className="font-medium">{record.vaccine === "other" ? record.other_label || t("Other") : optionLabel(VACCINES, record.vaccine, t)}</dt>
        <dd className="mt-1 text-sm text-muted-foreground">{[optionLabel(VACCINE_RECEIVED, record.received, t), record.date, record.doses ? `${t("Doses")}: ${record.doses}` : "", record.notes].filter(Boolean).join(" · ")}</dd>
      </div>)}</dl> : <p className="text-sm text-muted-foreground">{t("Not recorded")}</p>}
    </div>
    <Button variant="outline" onClick={onOpenDocuments}><FileText className="mr-2 h-4 w-4" />{t("Vaccination Records")}</Button>
  </div>;
}