import React from "react";
import SectionCard from "./SectionCard";
import InfoRow from "./InfoRow";
import { calcAge, capitalize } from "@/lib/patientUtils";
import { formatDateDisplay } from "@/lib/dateFormat";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorText } from "@/lib/doctorMedicalTranslations";

// My Health point 1 — the patient's identity and contact details, exactly as
// recorded on the record: personal details, how to reach the patient and who
// to call in an emergency. Shared by the Patient Portal and the Doctor Portal.
export default function DemographicsSection({ number, patient, doctorView }) {
  const { t } = usePatientLanguage();
  const doctorText = useDoctorText();
  // Doctor Portal display value — English translation of patient-entered
  // Arabic text; unchanged for English values and in the Patient Portal.
  const dv = (field) =>
    doctorView ? doctorText("PatientProfile", patient, field, patient?.[field]) : patient?.[field];
  const age = calcAge(patient?.date_of_birth);
  const occupations = (patient?.occupations || []).filter(Boolean);
  const phones = (patient?.phone_numbers || []).filter((p) => p?.number);
  const contacts = (patient?.emergency_contacts || []).filter((c) => c?.name || c?.phone);

  return (
    <SectionCard number={number} title={t("Demographics")}>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
        <InfoRow label={t("Name")} value={patient?.full_name} />
        <InfoRow label={t("CIN")} value={patient?.cin} />
        <InfoRow label={t("Age")} value={age === null ? null : t("{age} years", { age })} />
        <InfoRow label={t("Sex")} value={patient?.gender ? t(capitalize(patient.gender)) : null} />
        <InfoRow
          label={t("Date of Birth")}
          value={patient?.date_of_birth ? formatDateDisplay(patient.date_of_birth) : null}
        />
        <InfoRow label={t("Nationality")} value={dv("nationality")} />
        <InfoRow label={t("Occupation")} value={occupations.join(", ")} />
        <InfoRow label={t("Identification Number")} value={dv("identification_number")} />
        <InfoRow label={t("Address")} value={dv("address")} />
        <InfoRow label={t("Marital status")} value={patient?.marital_status ? t(capitalize(patient.marital_status.replace(/_/g, " "))) : null} />
      </div>

      {(phones.length > 0 || patient?.phone) && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("Phone numbers")}</p>
          <ul className="space-y-1">
            {phones.length > 0 ? (
              phones.map((p, i) => (
                <li key={`${p.number}-${i}`} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground shrink-0">{t(p.label)}</span>
                  <span className="font-medium text-right" dir="ltr">{p.number}</span>
                </li>
              ))
            ) : (
              <li className="text-sm font-medium" dir="ltr">{patient.phone}</li>
            )}
          </ul>
        </div>
      )}

      {contacts.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("Emergency contacts")}</p>
          <ul className="space-y-1">
            {contacts.map((c, i) => (
              <li key={`${c.name}-${i}`} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground">
                  {[c.relationship, c.phone].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}