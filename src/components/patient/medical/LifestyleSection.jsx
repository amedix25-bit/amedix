import React from "react";
import SectionCard from "./SectionCard";
import InfoRow from "./InfoRow";
import { Button } from "@/components/ui/button";
import { SMOKING_LABELS, ALCOHOL_LABELS, PREGNANCY_LABELS } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function LifestyleSection({ number, patient, onEdit }) {
  const { t } = usePatientLanguage();
  const female = patient?.gender === "female";
  const pregnant = patient?.pregnancy_status === "pregnant";

  return (
    <SectionCard
      number={number}
      title={t("Lifestyle and Pregnancy")}
      action={onEdit && <Button variant="outline" size="sm" onClick={onEdit}>{t("Edit")}</Button>}
    >
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
        <InfoRow label={t("Smoking Status")} value={t(SMOKING_LABELS[patient?.smoking_status] || "Not specified")} />
        <InfoRow label={t("Alcohol Use")} value={t(ALCOHOL_LABELS[patient?.alcohol_use] || "Not specified")} />
        <InfoRow label={t("Other Substance Use")} value={patient?.substance_use} />
      </div>
      {female && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            <InfoRow label={t("Pregnancy Status")} value={t(PREGNANCY_LABELS[patient?.pregnancy_status] || "Not specified")} />
            {pregnant && (
              <>
                <InfoRow label={t("Gestational Age")} value={patient?.gestational_age} />
                <InfoRow label={t("Estimated Due Date")} value={patient?.estimated_due_date} />
              </>
            )}
            <InfoRow label={t("Pregnancy History")} value={patient?.pregnancy_history} />
          </div>
        </div>
      )}
    </SectionCard>
  );
}