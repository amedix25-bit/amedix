import React, { useState } from "react";
import { Activity, Cake, CreditCard, Droplet, HeartPulse, Phone, Plus, ShieldAlert, UserRound } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import QrCodeCard from "@/components/QrCodeCard";
import PatientCardPhoto from "@/components/patient/PatientCardPhoto";
import ChronicConditionPicker from "@/components/patient/ChronicConditionPicker";
import { usePatientLanguage } from "@/lib/patientLanguage";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold truncate">{value || "—"}</span>
    </div>
  );
}

function StripCell({ icon: Icon, label, value, action, onClick }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`text-start rounded-lg border p-2 ${
        action ? "border-dashed border-border hover:bg-accent" : "border-border/70 bg-muted/40"
      }`}
    >
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className={`block text-xs mt-0.5 ${action ? "text-primary font-medium" : "font-semibold truncate"}`}>
        {value}
      </span>
    </Wrapper>
  );
}

// The patient's Medical ID card — every value comes from the patient's own
// account. Empty sections invite the patient to complete them.
export default function PatientMedicalIdCard({ profile, conditions = [], allergyText, emergencyContact, onConditionsChanged }) {
  const { t, lang } = usePatientLanguage();
  const [pickerOpen, setPickerOpen] = useState(false);

  const conditionText = conditions.map((c) => (lang === "ar" ? c.name_ar || c.name : c.name)).filter(Boolean).join(", ");
  const cardNumber = profile?.id ? `P-${String(profile.id).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}` : "—";
  const contactText = emergencyContact
    ? `${emergencyContact.name || ""}${emergencyContact.relationship ? ` (${emergencyContact.relationship})` : ""} · ${emergencyContact.phone || ""}`
    : "";

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <BrandLogo className="h-7 w-auto" />
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("Patient Card")}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-info/30 bg-info/10 px-2.5 py-1 text-[11px] font-medium text-info">
            <HeartPulse className="w-3.5 h-3.5" />
            {t("Medical ID")}
          </span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start gap-4">
          <PatientCardPhoto profile={profile} />

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("Patient name")}</p>
              <p className="font-heading text-base sm:text-lg font-bold text-primary leading-tight">
                {(lang === "ar" ? profile?.full_name_ar : "") || profile?.full_name || "—"}
              </p>
            </div>
            <InfoLine icon={CreditCard} label={t("CIN")} value={profile?.cin} />
            <InfoLine icon={Cake} label={t("Date of birth")} value={formatDate(profile?.date_of_birth)} />
            <InfoLine icon={UserRound} label={t("Gender")} value={profile?.gender ? t(profile.gender === "male" ? "Male" : profile.gender === "female" ? "Female" : "Other") : ""} />
          </div>

          <div className="flex sm:flex-col items-center gap-2 shrink-0">
            <QrCodeCard cin={profile?.cin} size={92} />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">{t("AMedix ID")}</p>
              <p className="text-[11px] font-semibold tracking-wide">{cardNumber}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StripCell icon={Droplet} label={t("Blood group")} value={profile?.blood_type && profile.blood_type !== "Unknown" ? profile.blood_type : "—"} />
          <StripCell icon={ShieldAlert} label={t("Allergies")} value={allergyText || profile?.allergies || "—"} />
          {conditionText ? (
            <StripCell icon={Activity} label={t("Chronic conditions")} value={conditionText} onClick={() => setPickerOpen(true)} action />
          ) : (
            <StripCell
              icon={Plus}
              label={t("Chronic conditions")}
              value={t("Add a chronic condition")}
              onClick={() => setPickerOpen(true)}
              action
            />
          )}
          <StripCell icon={Phone} label={t("Emergency contact")} value={contactText || "—"} />
        </div>
      </div>

      <div className="bg-primary text-primary-foreground px-4 sm:px-5 py-2 flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider opacity-70">{t("Medical ID")}</span>
        <span className="text-[11px]">AMedix | {t("Your Health. Connected.")}</span>
      </div>

      <ChronicConditionPicker
        patientId={profile?.id}
        existing={conditions}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onAdded={onConditionsChanged}
      />
    </div>
  );
}