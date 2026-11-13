import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, FlaskConical, Image as ImageIcon, FileText, Pill, Shield, QrCode, X, Pencil, CreditCard } from "lucide-react";
import QrCodeCard from "@/components/QrCodeCard";
import PatientMedicalIdCard from "@/components/patient/PatientMedicalIdCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InfoRow from "@/components/patient/medical/InfoRow";
import { Button } from "@/components/ui/button";
import { calcAge, capitalize, patientDisplayName, SMOKING_LABELS, ALCOHOL_LABELS, PREGNANCY_LABELS } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientOverview({ profile, stats, loading, onGoToProfile }) {
  const { t, lang } = usePatientLanguage();
  const [showQr, setShowQr] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [med, setMed] = useState({ conditions: [], pastHistory: [], events: [], medications: [], allergies: [] });

  const loadMedical = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [conditions, pastHistory, events, medications, allergies] = await Promise.all([
        base44.entities.MedicalCondition.filter({ patient_id: profile.id, category: "known_case" }),
        base44.entities.MedicalCondition.filter({ patient_id: profile.id, category: "past_history" }),
        base44.entities.MedicalHistoryEvent
          .filter({ patient_id: profile.id }, { sort: "-created_date", limit: 100 })
          .then((page) => (page?.items ? page.items : page || []))
          .catch(() => []),
        base44.entities.Medication.filter({ patient_id: profile.id }),
        base44.entities.Allergy.filter({ patient_id: profile.id }),
      ]);
      setMed({ conditions, pastHistory, events, medications, allergies });
    } catch (err) {
      console.error(err);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    loadMedical();
    const unsubscribe = base44.entities.Medication.subscribe(() => loadMedical());
    return unsubscribe;
  }, [profile?.id, loadMedical]);

  if (loading) {
    return <div className="text-muted-foreground text-sm">{t("Loading...")}</div>;
  }

  const statCards = [
    { label: t("Appointments"), value: stats.appointments, icon: Calendar, color: "text-primary" },
    { label: t("Lab Requests"), value: stats.labs, icon: FlaskConical, color: "text-blue-500" },
    { label: t("Imaging"), value: stats.imaging, icon: ImageIcon, color: "text-purple-500" },
    { label: t("Documents"), value: stats.documents, icon: FileText, color: "text-amber-500" },
    { label: t("Medications"), value: stats.medications, icon: Pill, color: "text-emerald-500" },
  ];

  const age = calcAge(profile?.date_of_birth);
  const knownCaseText = med.conditions.map((c) => c.name_ar || c.name).join(", ");
  // Everything else the patient reported at registration — past medical
  // history entries and significant medical events.
  const pastHistoryText = [
    ...med.pastHistory.map((c) => c.name_ar || c.name),
    ...med.events.map((e) => e.title || e.event_type),
  ]
    .filter(Boolean)
    .join(", ");
  const allergyText = med.allergies
    .map((a) => `${a.allergen}${a.severity ? ` (${t(capitalize(a.severity))})` : ""}`)
    .join(", ");
  const isFemale = profile?.gender === "female";
  const isPregnant = isFemale && profile?.pregnancy_status === "pregnant";
  const pregnancyText = isFemale
    ? isPregnant
      ? [
          t("Pregnant"),
          profile?.gestational_age,
          profile?.estimated_due_date ? `${t("EDD")} ${profile.estimated_due_date}` : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : t(PREGNANCY_LABELS[profile?.pregnancy_status] || "Not pregnant")
    : null;
  const phoneNumbers = profile?.phone_numbers?.length
    ? profile.phone_numbers
    : profile?.phone ? [{ label: "Primary", number: profile.phone }] : [];
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">{t("My CIN")}</p>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                <Shield className="w-3 h-3" />
                {t("Verified Patient")}
              </div>
            </div>
            <p className="text-3xl font-bold tracking-wider text-primary mt-1">{profile?.cin}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {t("Your permanent Clinical Identification Number — unique to you.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowQr(true)}>
                <QrCode className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t("Show QR Code")}
              </Button>
              <Button size="sm" onClick={() => setShowCard(true)}>
                <CreditCard className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t("View card")}
              </Button>
            </div>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">{t("Personal Information")}</h3>
            {onGoToProfile && (
              <Button variant="ghost" size="sm" onClick={onGoToProfile}>
                <Pencil className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                {t("Edit")}
              </Button>
            )}
          </div>
          <div className="space-y-3">
            <InfoRow label={t("Full Name")} value={patientDisplayName(profile, lang) || null} />
            <InfoRow label={t("Date of Birth")} value={profile?.date_of_birth} />
            <InfoRow label={t("Age")} value={age === null ? null : t("{age} years", { age })} />
            <InfoRow label={t("Sex")} value={profile?.gender ? t(capitalize(profile.gender)) : null} />
            <InfoRow label={t("Nationality")} value={profile?.nationality} />
            <InfoRow label={t("Occupation")} value={(profile?.occupations || []).join(", ") || null} />
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground shrink-0">{t("Phone Numbers")}</span>
              <span className="font-medium text-end">
                {phoneNumbers.length === 0
                  ? "—"
                  : phoneNumbers.map((p, i) => (
                      <span key={i} className="block">
                        {t(p.label)}: {p.number}
                      </span>
                    ))}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground shrink-0">{t("Emergency Contacts")}</span>
              <span className="font-medium text-end">
                {emergencyContacts.length === 0
                  ? "—"
                  : emergencyContacts.map((c, i) => (
                      <span key={i} className="block">
                        {c.name}{c.relationship ? ` (${c.relationship})` : ""} · {c.phone}
                      </span>
                    ))}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4">{t("Medical Information")}</h3>
          <div className="space-y-3">
            <InfoRow label={t("Known Case Of")} value={knownCaseText || null} />
            <InfoRow label={t("Past Medical History")} value={pastHistoryText || null} />
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground shrink-0">{t("Current Medication")}</span>
              <span className="font-medium text-end">
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
            <InfoRow label={t("Allergies")} value={allergyText || profile?.allergies || null} />
            <InfoRow label={t("Smoking Status")} value={t(SMOKING_LABELS[profile?.smoking_status] || "Not specified")} />
            <InfoRow label={t("Alcohol Use")} value={t(ALCOHOL_LABELS[profile?.alcohol_use] || "Not specified")} />
            {pregnancyText && <InfoRow label={t("Pregnancy Status")} value={pregnancyText} />}
          </div>
        </div>
      </div>

      <Dialog open={showCard} onOpenChange={setShowCard}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full text-center relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQr(false)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <p className="text-sm font-medium text-slate-600">{t("Show this to your doctor")}</p>
            <p className="text-2xl font-bold tracking-wider text-primary mt-1">{profile?.cin}</p>
            <div className="mt-5 flex justify-center">
              <QrCodeCard cin={profile?.cin} size={220} />
            </div>
            <p className="text-xs text-slate-500 mt-4">
              {t("Doctors can find your record by scanning this code or searching your CIN.")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}