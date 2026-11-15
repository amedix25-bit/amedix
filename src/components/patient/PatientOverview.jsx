import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import QrCodeCard from "@/components/QrCodeCard";
import PatientMedicalIdCard from "@/components/patient/PatientMedicalIdCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { calcAge, capitalize } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";
import PatientCinCard from "@/components/patient/overview/PatientCinCard";
import PatientNextAppointment from "@/components/patient/overview/PatientNextAppointment";
import PatientQuickActions from "@/components/patient/overview/PatientQuickActions";
import PatientHealthSummary from "@/components/patient/overview/PatientHealthSummary";
import PatientRecentActivity from "@/components/patient/overview/PatientRecentActivity";
import PatientQuickAccess from "@/components/patient/overview/PatientQuickAccess";

const today = () => new Date().toISOString().slice(0, 10);

export default function PatientOverview({ profile, stats, loading, onGoToProfile, onNavigate, onViewActivity }) {
  const { t, lang } = usePatientLanguage();
  const [showQr, setShowQr] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [med, setMed] = useState({ conditions: [], medications: [], allergies: [] });
  const [appointment, setAppointment] = useState(null);
  const [activity, setActivity] = useState([]);
  const [messages, setMessages] = useState(0);

  const loadMedical = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [conditions, medications, allergies] = await Promise.all([
        base44.entities.MedicalCondition.filter({ patient_id: profile.id, category: "known_case" }),
        base44.entities.Medication.filter({ patient_id: profile.id }),
        base44.entities.Allergy.filter({ patient_id: profile.id }),
      ]);
      setMed({ conditions, medications, allergies });
    } catch (err) {
      console.error(err);
    }
  }, [profile?.id]);

  const loadDashboard = useCallback(async () => {
    if (!profile?.id) return;
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
        { sort: "-created_date", limit: 5 },
      );
      setActivity(page?.items || page || []);
    } catch (err) {
      console.error(err);
    }
    try {
      setMessages(await base44.entities.MessageThread.count({ patient_user_id: profile.user_id, channel: "patient" }));
    } catch (err) {
      setMessages(0);
    }
  }, [profile?.id, profile?.user_id]);

  useEffect(() => {
    if (!profile?.id) return;
    loadMedical();
    loadDashboard();
    const unsubscribe = base44.entities.Medication.subscribe(() => loadMedical());
    return unsubscribe;
  }, [profile?.id, loadMedical, loadDashboard]);

  if (loading) {
    return <div className="text-sm text-patient-muted">{t("Loading...")}</div>;
  }

  const age = calcAge(profile?.date_of_birth);
  const allergyText = med.allergies
    .map((a) => `${a.allergen}${a.severity ? ` (${t(capitalize(a.severity))})` : ""}`)
    .join(", ");
  const emergencyContacts = profile?.emergency_contacts?.length
    ? profile.emergency_contacts
    : profile?.emergency_contact_name
      ? [{
          name: profile.emergency_contact_name,
          relationship: profile.emergency_contact_relationship,
          phone: profile.emergency_contact_phone,
        }]
      : [];

  return (
    <div className="pp-overview">
      <div className="pp-hero-row">
        <PatientCinCard cin={profile?.cin} onShowQr={() => setShowQr(true)} onShowCard={() => setShowCard(true)} />
        <PatientNextAppointment appointment={appointment} onOpenAppointments={() => onNavigate("appointments")} />
      </div>

      <PatientQuickActions
        labs={stats.labs}
        imaging={stats.imaging}
        medications={stats.medications}
        messages={messages}
        onNavigate={onNavigate}
      />

      <div className="pp-summary-row">
          <PatientHealthSummary
            age={age}
            gender={profile?.gender ? capitalize(profile.gender) : ""}
            nationality={profile?.nationality}
            conditions={med.conditions}
            medications={med.medications.filter((m) => m.is_active !== false)}
            allergies={allergyText || profile?.allergies || ""}
            onNavigate={onNavigate}
          />
        <PatientRecentActivity items={activity} onNavigate={onNavigate} onViewAll={onViewActivity} />
      </div>

      <PatientQuickAccess onNavigate={onNavigate} />

      <Dialog open={showCard} onOpenChange={setShowCard}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("My Medical ID card")}</DialogTitle>
          </DialogHeader>
          <PatientMedicalIdCard
            profile={profile}
            conditions={med.conditions}
            allergyText={allergyText}
            emergencyContact={emergencyContacts[0]}
            onConditionsChanged={loadMedical}
          />
        </DialogContent>
      </Dialog>

      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowQr(false)}>
          <div className="relative w-full max-w-xs rounded-2xl bg-card p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQr(false)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <p className="text-sm font-medium text-patient-muted">{t("Show this to your doctor")}</p>
            <p className="mt-1 text-2xl font-bold tracking-wider text-patient-accent">{profile?.cin}</p>
            <div className="mt-5 flex justify-center">
              <QrCodeCard cin={profile?.cin} size={220} />
            </div>
            <p className="mt-4 text-xs text-patient-muted">
              {t("Doctors can find your record by scanning this code or searching your CIN.")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}