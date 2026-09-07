import React from "react";
import SectionCard from "@/components/patient/medical/SectionCard";
import InfoRow from "@/components/patient/medical/InfoRow";
import ConditionsSection from "@/components/patient/medical/ConditionsSection";
import CurrentDiagnosisSection from "@/components/patient/medical/CurrentDiagnosisSection";
import SurgicalSection from "@/components/patient/medical/SurgicalSection";
import MedicationsSection from "@/components/patient/medical/MedicationsSection";
import AllergiesSection from "@/components/patient/medical/AllergiesSection";
import LifestyleSection from "@/components/patient/medical/LifestyleSection";
import { calcAgeLabel, capitalize } from "@/lib/patientUtils";

export default function PatientHealth({ profile, onGoToProfile }) {
  return (
    <div className="space-y-4">
      <SectionCard number="1" title="Demographics">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          <InfoRow label="Name" value={profile?.full_name} />
          <InfoRow label="CIN" value={profile?.cin} />
          <InfoRow label="Age" value={calcAgeLabel(profile?.date_of_birth)} />
          <InfoRow label="Sex" value={profile?.gender ? capitalize(profile.gender) : null} />
          <InfoRow label="Date of Birth" value={profile?.date_of_birth} />
        </div>
      </SectionCard>

      <ConditionsSection
        number="2"
        title="Known Case Of"
        category="known_case"
        patient={profile}
        emptyText="No established conditions recorded. Add chronic or previous medical conditions here."
      />

      <CurrentDiagnosisSection number="3" patient={profile} />

      <ConditionsSection
        number="4"
        title="Past Medical History"
        category="past_history"
        patient={profile}
        emptyText="No past medical history recorded. Add previous diseases and important hospitalizations here."
      />

      <SurgicalSection number="5" patient={profile} />
      <MedicationsSection number="6" patient={profile} />
      <AllergiesSection number="7" patient={profile} />
      <LifestyleSection number="8" patient={profile} onEdit={onGoToProfile} />
    </div>
  );
}