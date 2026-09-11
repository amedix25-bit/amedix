import React from "react";
import SectionCard from "@/components/patient/medical/SectionCard";
import InfoRow from "@/components/patient/medical/InfoRow";
import ConditionsSection from "@/components/patient/medical/ConditionsSection";
import CurrentDiagnosisSection from "@/components/patient/medical/CurrentDiagnosisSection";
import SurgicalSection from "@/components/patient/medical/SurgicalSection";
import MedicationsSection from "@/components/patient/medical/MedicationsSection";
import AllergiesSection from "@/components/patient/medical/AllergiesSection";
import LifestyleSection from "@/components/patient/medical/LifestyleSection";
import MedicalHistorySection from "@/components/patient/medical/MedicalHistorySection";
import { calcAge, capitalize } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { Lock } from "lucide-react";

export default function PatientHealth({ profile, onGoToProfile, doctorView }) {
  const { t } = usePatientLanguage();
  const age = calcAge(profile?.date_of_birth);

  return (
    <div className="space-y-4">
      {!doctorView && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {t(
              "Your medical history was recorded at registration and is locked. Contact your doctor or an administrator for any corrections or updates."
            )}
          </span>
        </div>
      )}
      <MedicalHistorySection patientId={profile?.id} />
      <SectionCard number="1" title={t("Demographics")}>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow label={t("Name")} value={profile?.full_name} />
          <InfoRow label={t("CIN")} value={profile?.cin} />
          <InfoRow label={t("Age")} value={age === null ? null : t("{age} years", { age })} />
          <InfoRow label={t("Sex")} value={profile?.gender ? t(capitalize(profile.gender)) : null} />
          <InfoRow label={t("Date of Birth")} value={profile?.date_of_birth} />
        </div>
      </SectionCard>

      <ConditionsSection
        number="2"
        title={t("Known Case Of")}
        category="known_case"
        patient={profile}
        emptyText={t("No known conditions were recorded at registration.")}
        doctorView={doctorView}
      />

      <CurrentDiagnosisSection number="3" patient={profile} />

      <ConditionsSection
        number="4"
        title={t("Past Medical History")}
        category="past_history"
        patient={profile}
        emptyText={t("No past medical history was recorded at registration.")}
        doctorView={doctorView}
      />

      <SurgicalSection number="5" patient={profile} doctorView={doctorView} />
      <MedicationsSection number="6" patient={profile} editable={doctorView} doctorView={doctorView} />
      <AllergiesSection number="7" patient={profile} doctorView={doctorView} />
      <LifestyleSection number="8" patient={profile} onEdit={onGoToProfile} doctorView={doctorView} />
    </div>
  );
}