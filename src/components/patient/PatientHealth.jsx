import React, { useState, useEffect } from "react";
import DemographicsSection from "@/components/patient/medical/DemographicsSection";
import FamilyHistorySection from "@/components/patient/medical/FamilyHistorySection";
import ConditionsSection from "@/components/patient/medical/ConditionsSection";
import CurrentDiagnosisSection from "@/components/patient/medical/CurrentDiagnosisSection";
import SurgicalSection from "@/components/patient/medical/SurgicalSection";
import MedicationsSection from "@/components/patient/medical/MedicationsSection";
import AllergiesSection from "@/components/patient/medical/AllergiesSection";
import LifestyleSection from "@/components/patient/medical/LifestyleSection";
import GynaeObstetricSection from "@/components/patient/medical/GynaeObstetricSection";
import MedicalHistorySection from "@/components/patient/medical/MedicalHistorySection";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { fetchCheckInStatus, LOCKED_MESSAGE } from "@/lib/checkInGate";
import { Lock, Pencil, Loader2 } from "lucide-react";

// My Health — the ten collapsible points. The patient cannot edit any section
// except Lifestyle (from the Profile tab); the doctor may edit the medical
// points during an active visit (check-in gated) and every edit is recorded
// as "Dr. <name> edited <datetime>".
export default function PatientHealth({
  profile,
  onGoToProfile,
  doctorView,
  registrationEvents,
  doctorData,
  onRefreshData,
}) {
  const { t } = usePatientLanguage();
  const [checkIn, setCheckIn] = useState(null);
  const editable = doctorView && checkIn?.checked_in === true;
  // Doctor Portal: records the doctor cannot read directly are supplied by the
  // authorized backend payload, so the whole record is visible here.
  const preloaded = doctorData
    ? {
        conditions: doctorData.conditions || [],
        surgical: doctorData.surgical || [],
        allergies: doctorData.allergies || [],
        medications: doctorData.medications || [],
        familyHistory: doctorData.family_history || [],
        latestNote: (doctorData.notes || []).find((n) => String(n.diagnosis || "").trim()) || null,
      }
    : null;

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
              "Your medical history was recorded at registration and is shown to your treating doctors. You can complete or update your Gynaecological & Obstetric History at any time — earlier answers are kept and every update is recorded."
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
      <DemographicsSection number="1" patient={profile} doctorView={doctorView} />

      <ConditionsSection
        number="2"
        title={t("Known Case Of")}
        category="known_case"
        patient={profile}
        emptyText={t("No known conditions were recorded at registration.")}
        doctorView={doctorView}
        editable={editable}
        preloadedItems={preloaded?.conditions}
        onRefresh={onRefreshData}
      />

      <CurrentDiagnosisSection
        number="3"
        patient={profile}
        preloadedNote={preloaded ? preloaded.latestNote : undefined}
      />

      <ConditionsSection
        number="4"
        title={t("Past Medical History")}
        category="past_history"
        patient={profile}
        emptyText={t("No past medical history was recorded at registration.")}
        doctorView={doctorView}
        editable={editable}
        registrationEvents={registrationEvents}
        preloadedItems={preloaded?.conditions}
        onRefresh={onRefreshData}
      />

      <SurgicalSection
        number="5"
        patient={profile}
        doctorView={doctorView}
        editable={editable}
        preloadedItems={preloaded?.surgical}
        onRefresh={onRefreshData}
      />
      <MedicationsSection
        number="6"
        patient={profile}
        editable={editable}
        doctorView={doctorView}
        preloadedItems={preloaded?.medications}
        onRefresh={onRefreshData}
      />
      <AllergiesSection
        number="7"
        patient={profile}
        doctorView={doctorView}
        editable={editable}
        preloadedItems={preloaded?.allergies}
        onRefresh={onRefreshData}
      />
      <LifestyleSection number="8" patient={profile} onEdit={onGoToProfile} doctorView={doctorView} />
      <GynaeObstetricSection
        number="9"
        patient={profile}
        doctorView={doctorView}
        editable={editable}
        onProfileChanged={onRefreshData}
      />
      <FamilyHistorySection
        number="10"
        patient={profile}
        doctorView={doctorView}
        records={preloaded?.familyHistory}
      />
    </div>
  );
}