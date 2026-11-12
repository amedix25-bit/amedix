import React from "react";
import SectionCard from "./SectionCard";
import InfoRow from "./InfoRow";
import { Button } from "@/components/ui/button";
import { SMOKING_LABELS, ALCOHOL_LABELS } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorText } from "@/lib/doctorMedicalTranslations";
import {
  DIET_TYPES,
  SLEEP_PATTERNS,
  LIVING_SITUATIONS,
  VACCINATION_STATUSES,
  VACCINES,
  VACCINE_RECEIVED,
  optionLabel,
  optionsLabel,
} from "@/lib/lifestyleOptions";

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
  const dietTypes = optionsLabel(DIET_TYPES, patient?.diet_types, t);
  const sleepPatterns = optionsLabel(SLEEP_PATTERNS, patient?.sleep_patterns, t);
  const vaccineRecords = (patient?.vaccination_records || []).filter((r) => r?.received);

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
        <InfoRow label={t("Diet type")} value={dietTypes} />
        <InfoRow label={t("Diet details")} value={dv("typical_diet")} />
        <InfoRow label={t("Food allergies & intolerances")} value={dv("food_allergies_intolerances")} />
        <InfoRow label={t("Sleep pattern")} value={sleepPatterns} />
        <InfoRow label={t("Sleep details")} value={dv("sleep_pattern_other")} />
        <InfoRow label={t("Sleep concerns")} value={dv("sleep_concerns")} />
        <InfoRow label={t("Living situation")} value={optionLabel(LIVING_SITUATIONS, patient?.living_situation_type, t)} />
        <InfoRow label={t("Living situation details")} value={dv("living_situation")} />
        <InfoRow
          label={t("Vaccination status")}
          value={optionLabel(VACCINATION_STATUSES, patient?.vaccination_status, t)}
        />
      </div>

      {vaccineRecords.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("Vaccination history")}</p>
          <ul className="space-y-1">
            {vaccineRecords.map((record) => {
              const name =
                record.vaccine === "other" && record.other_label
                  ? record.other_label
                  : optionLabel(VACCINES, record.vaccine, t);
              const details = [
                t(optionLabel(VACCINE_RECEIVED, record.received, t)),
                record.date,
                record.doses ? `${t("Doses")}: ${record.doses}` : "",
                record.notes,
              ].filter(Boolean);
              return (
                <li key={record.vaccine} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground shrink-0">{name}</span>
                  <span className="font-medium text-right">{details.join(" · ")}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}