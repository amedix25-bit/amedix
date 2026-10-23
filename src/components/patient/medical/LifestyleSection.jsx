import React from "react";
import SectionCard from "./SectionCard";
import InfoRow from "./InfoRow";
import { Button } from "@/components/ui/button";
import { SMOKING_LABELS, ALCOHOL_LABELS } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorText } from "@/lib/doctorMedicalTranslations";

export default function LifestyleSection({ number, patient, onEdit, doctorView }) {
  const { t } = usePatientLanguage();
  const doctorText = useDoctorText();
  // Doctor Portal display value — English translation of patient-entered
  // Arabic text; unchanged for English values and in the Patient Portal.
  const dv = (field) =>
    doctorView ? doctorText("PatientProfile", patient, field, patient?.[field]) : patient?.[field];
  // Pregnancy moved to its own section (point 9) — this card is lifestyle only.
  // The patient can still edit lifestyle from the Profile tab; every other
  // section of the record is locked for the patient.
  return (
    <SectionCard
      number={number}
      title={t("Lifestyle")}
      action={onEdit && <Button variant="outline" size="sm" onClick={onEdit}>{t("Edit")}</Button>}
    >
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
        <InfoRow label={t("Smoking Status")} value={t(SMOKING_LABELS[patient?.smoking_status] || "Not specified")} />
        <InfoRow label={t("Alcohol Use")} value={t(ALCOHOL_LABELS[patient?.alcohol_use] || "Not specified")} />
        <InfoRow label={t("Other Substance Use")} value={dv("substance_use")} />
      </div>
    </SectionCard>
  );
}