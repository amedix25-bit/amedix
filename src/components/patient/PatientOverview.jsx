import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatientLanguage } from "@/lib/patientLanguage";
import PatientHomeMedicalCard from "@/components/patient/home/PatientHomeMedicalCard";
import PatientHomeQuickTiles from "@/components/patient/home/PatientHomeQuickTiles";
import PatientHomeHealthOverview from "@/components/patient/home/PatientHomeHealthOverview";
import PatientHomeRecentActivity from "@/components/patient/home/PatientHomeRecentActivity";

const today = () => new Date().toISOString().slice(0, 10);

export default function PatientOverview({ profile, loading, onNavigate, onViewActivity }) {
  const { t } = usePatientLanguage();
  const [card, setCard] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [activity, setActivity] = useState([]);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const page = await base44.entities.MedicalCard.filter(
        { patient_user_id: profile.user_id },
        { sort: "-created_date", limit: 1 },
      );
      setCard((page?.items || page || [])[0] || null);
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
    try {
      const page = await base44.entities.PatientNotification.filter(
        { patient_id: profile.id },
        { sort: "-created_date", limit: 6 },
      );
      setActivity(page?.items || page || []);
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
      <PatientHomeRecentActivity items={activity} onNavigate={onNavigate} onViewAll={onViewActivity} />
    </div>
  );
}