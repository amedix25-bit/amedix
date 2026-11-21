import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatientLanguage } from "@/lib/patientLanguage";
import PatientHomeMedicalCard from "@/components/patient/home/PatientHomeMedicalCard";
import PatientHomeQuickTiles from "@/components/patient/home/PatientHomeQuickTiles";
import PatientHomeHealthOverview from "@/components/patient/home/PatientHomeHealthOverview";

const today = () => new Date().toISOString().slice(0, 10);

export default function PatientOverview({ profile, loading, onNavigate }) {
  const { t } = usePatientLanguage();
  const [card, setCard] = useState(null);
  const [appointment, setAppointment] = useState(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      // The card is issued server-side on the patient's first visit, so the
      // home card's QR always carries this patient's own card token — never a
      // bare identifier that no scanner could resolve.
      const response = await base44.functions.invoke("medicalCard", { action: "get" });
      setCard(response.data?.card || null);
    } catch (err) {
      console.error(err);
    }
    try {
      const page = await base44.entities.Appointment.filter(
        { patient_id: profile.id, status: "scheduled" },
        { sort: "date", limit: 30 },
      );
      const list = page?.items || page || [];
      setAppointment(list.find((a) => a.date && a.date >= today()) || null);
    } catch (err) {
      console.error(err);
    }
  }, [profile?.id, profile?.user_id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="text-sm text-patient-muted">{t("Loading...")}</div>;
  }

  return (
    <div className="space-y-4 pb-2">
      <PatientHomeMedicalCard profile={profile} card={card} onViewCard={() => onNavigate("medicalcard")} />
      <PatientHomeQuickTiles onNavigate={onNavigate} />
      <PatientHomeHealthOverview appointment={appointment} onNavigate={onNavigate} />
    </div>
  );
}