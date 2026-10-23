import React, { useState, useEffect } from "react";
import SectionCard from "@/components/patient/medical/SectionCard";
import InfoRow from "@/components/patient/medical/InfoRow";
import ConditionsSection from "@/components/patient/medical/ConditionsSection";
import CurrentDiagnosisSection from "@/components/patient/medical/CurrentDiagnosisSection";
import SurgicalSection from "@/components/patient/medical/SurgicalSection";
import MedicationsSection from "@/components/patient/medical/MedicationsSection";
import AllergiesSection from "@/components/patient/medical/AllergiesSection";
import LifestyleSection from "@/components/patient/medical/LifestyleSection";
import PregnancySection from "@/components/patient/medical/PregnancySection";
import MedicalHistorySection from "@/components/patient/medical/MedicalHistorySection";
import { calcAge, capitalize } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { fetchCheckInStatus, LOCKED_MESSAGE } from "@/lib/checkInGate";
import { Lock, Pencil, Loader2 } from "lucide-react";

// My Health — nine collapsible points. The patient cannot edit any section
// except Lifestyle (from the Profile tab); the doctor may edit the medical
// points during an active visit (check-in gated) and every edit is recorded
// as "Dr. <name> edited <datetime>".
export default function PatientHealth({ profile, onGoToProfile, doctorView }) {
  const { t } = usePatientLanguage();
  const age = calcAge(profile?.date_of_birth);
  const [checkIn, setCheckIn] = useState(null);
  const editable = doctorView && checkIn?.checked_in === true;

  useEffect(() => {
    if (!doctorView || !profile?.id) return;
    let active = true;
    fetchCheckInStatus(profile.id).then((status) => {
      if (active) setCheckIn(status);
    });
    return () => {
      active = false;
    };
  }, [doctorView, profile?.id]);

  return (
    <div className="space-y-4">
      {!doctorView ? (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {t(
              "Your medical history was recorded at registration and is locked. Contact your doctor or an administrator for any corrections or updates."
            )}
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
          {checkIn === null ? (
            <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
          ) : editable ? (
            <Pencil className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>
            {checkIn === null
              ? t("Loading...")
              : editable
                ? t(
                    "You can update this patient's medical history during this active visit. Edits are recorded with your name."
                  )
                : t(LOCKED_MESSAGE)}
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
        editable={editable}
      />

      <CurrentDiagnosisSection number="3" patient={profile} />

      <ConditionsSection
        number="4"
        title={t("Past Medical History")}
        category="past_history"
        patient={profile}
        emptyText={t("No past medical history was recorded at registration.")}
        doctorView={doctorView}
        editable={editable}
      />

      <SurgicalSection number="5" patient={profile} doctorView={doctorView} editable={editable} />
      <MedicationsSection number="6" patient={profile} editable={editable} doctorView={doctorView} />
      <AllergiesSection number="7" patient={profile} doctorView={doctorView} editable={editable} />
      <LifestyleSection number="8" patient={profile} onEdit={onGoToProfile} doctorView={doctorView} />
      <PregnancySection number="9" patient={profile} doctorView={doctorView} editable={editable} />
    </div>
  );
}