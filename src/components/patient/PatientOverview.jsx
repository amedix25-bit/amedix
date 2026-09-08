import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, FlaskConical, Image as ImageIcon, FileText, Pill, Shield, QrCode, X } from "lucide-react";
import QrCodeCard from "@/components/QrCodeCard";
import InfoRow from "@/components/patient/medical/InfoRow";
import { Button } from "@/components/ui/button";
import { calcAgeLabel, capitalize, SMOKING_LABELS, ALCOHOL_LABELS, PREGNANCY_LABELS } from "@/lib/patientUtils";

export default function PatientOverview({ profile, stats, loading }) {
  const [showQr, setShowQr] = useState(false);
  const [med, setMed] = useState({ conditions: [], medications: [], allergies: [] });

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
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
    };
    load();
    const unsubscribe = base44.entities.Medication.subscribe(() => load());
    return unsubscribe;
  }, [profile?.id]);

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading...</div>;
  }

  const statCards = [
    { label: "Appointments", value: stats.appointments, icon: Calendar, color: "text-primary" },
    { label: "Lab Requests", value: stats.labs, icon: FlaskConical, color: "text-blue-500" },
    { label: "Imaging", value: stats.imaging, icon: ImageIcon, color: "text-purple-500" },
    { label: "Documents", value: stats.documents, icon: FileText, color: "text-amber-500" },
    { label: "Medications", value: stats.medications, icon: Pill, color: "text-emerald-500" },
  ];

  const knownCaseText = med.conditions.map((c) => c.name).join(", ");
  const allergyText = med.allergies
    .map((a) => `${a.allergen}${a.severity ? ` (${a.severity})` : ""}`)
    .join(", ");
  const isFemale = profile?.gender === "female";
  const isPregnant = isFemale && profile?.pregnancy_status === "pregnant";
  const pregnancyText = isFemale
    ? isPregnant
      ? `Pregnant${profile?.gestational_age ? ` · ${profile.gestational_age}` : ""}${profile?.estimated_due_date ? ` · EDD ${profile.estimated_due_date}` : ""}`
      : PREGNANCY_LABELS[profile?.pregnancy_status] || "Not pregnant"
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">My CIN</p>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                <Shield className="w-3 h-3" />
                Verified Patient
              </div>
            </div>
            <p className="text-3xl font-bold tracking-wider text-primary mt-1">{profile?.cin}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Your permanent Clinical Identification Number — unique to you.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowQr(true)}>
              <QrCode className="w-4 h-4 mr-2" />
              Show QR Code
            </Button>
          </div>
          <div className="mx-auto sm:mx-0">
            <QrCodeCard cin={profile?.cin} size={120} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4">Personal Information</h3>
          <div className="space-y-3">
            <InfoRow label="Full Name" value={profile?.full_name} />
            <InfoRow label="Date of Birth" value={profile?.date_of_birth} />
            <InfoRow label="Age" value={calcAgeLabel(profile?.date_of_birth)} />
            <InfoRow label="Sex" value={profile?.gender ? capitalize(profile.gender) : null} />
            <InfoRow label="Emergency Contact Name" value={profile?.emergency_contact_name} />
            <InfoRow label="Emergency Contact Phone" value={profile?.emergency_contact_phone} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4">Medical Information</h3>
          <div className="space-y-3">
            <InfoRow label="Known Case Of" value={knownCaseText || null} />
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground shrink-0">Current Medication</span>
              <span className="font-medium text-right">
                {med.medications.filter((m) => m.is_active !== false).length === 0
                  ? "—"
                  : med.medications
                      .filter((m) => m.is_active !== false)
                      .map((m) => (
                        <span key={m.id} className="block">
                          {m.name}
                        </span>
                      ))}
              </span>
            </div>
            <InfoRow label="Allergies" value={allergyText || profile?.allergies || null} />
            <InfoRow label="Smoking Status" value={SMOKING_LABELS[profile?.smoking_status] || "Not specified"} />
            <InfoRow label="Alcohol Use" value={ALCOHOL_LABELS[profile?.alcohol_use] || "Not specified"} />
            {pregnancyText && <InfoRow label="Pregnancy Status" value={pregnancyText} />}
          </div>
        </div>
      </div>

      {showQr && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full text-center relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQr(false)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <p className="text-sm font-medium text-slate-600">Show this to your doctor</p>
            <p className="text-2xl font-bold tracking-wider text-primary mt-1">{profile?.cin}</p>
            <div className="mt-5 flex justify-center">
              <QrCodeCard cin={profile?.cin} size={220} />
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Doctors can find your record by scanning this code or searching your CIN.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}