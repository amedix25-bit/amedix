import React, { useState } from "react";
import { Activity, Calendar, CreditCard, Droplet, HeartPulse, Phone, Plus, UserRound } from "lucide-react";
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

// A small labelled value: grey caption above a navy value.
function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-primary truncate">{value || "—"}</p>
    </div>
  );
}

function StripCell({ icon: Icon, label, value, sub, action, onClick }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex-1 min-w-0 px-3 py-2 text-start ${onClick ? "hover:bg-accent/60" : ""}`}
    >
      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      {action ? (
        <span className="mt-1 inline-block rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground">
          {value}
        </span>
      ) : (
        <span className="block text-xs font-semibold text-primary truncate">{value || "—"}</span>
      )}
      {sub && <span className="block text-[10px] text-muted-foreground truncate">{sub}</span>}
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
  const genderLabel = profile?.gender
    ? t(profile.gender === "male" ? "Male" : profile.gender === "female" ? "Female" : "Other")
    : "—";

  return (
    <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Soft brand waves, decorative only */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -top-16 end-0 w-64 h-52 text-info/15"
      >
        <path d="M400 0H120c60 30 90 70 60 110S60 160 0 200h400z" fill="currentColor" />
        <path d="M400 0H210c40 25 60 60 40 95s-90 55-150 105h300z" fill="currentColor" opacity="0.7" />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 300 140"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-7 start-0 w-40 h-20 text-info/10"
      >
        <path d="M0 140V40c50 0 80 40 130 40s90-30 170-40V0C210 20 150 70 90 70S30 100 0 110z" fill="currentColor" />
      </svg>

      <div className="relative p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <BrandLogo className="h-7 w-auto" />
              <p className="text-[11px] text-muted-foreground mt-0.5">{t("Patient Card")}</p>
            </div>
            <span className="w-px h-9 bg-border" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-2.5 py-1 text-[11px] font-medium text-info">
            <HeartPulse className="w-3.5 h-3.5" />
            {t("Medical ID")}
          </span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start gap-4">
          <PatientCardPhoto profile={profile} />

          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground">{t("Patient Name")}</p>
              <p className="font-heading text-base sm:text-lg font-bold text-primary leading-tight">
                {(lang === "ar" ? profile?.full_name_ar : "") || profile?.full_name || "—"}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-info shrink-0 mt-0.5" />
              <Detail label={t("CIN (National ID)")} value={profile?.cin} />
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <Detail label={t("Date of Birth")} value={formatDate(profile?.date_of_birth)} />
              </div>
              <div className="flex items-start gap-2">
                <UserRound className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <Detail label={t("Gender")} value={genderLabel} />
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center gap-2 shrink-0">
            <div className="rounded-xl bg-info/10 p-1.5">
              <QrCodeCard cin={profile?.cin} size={88} />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">{t("AMedix ID")}</p>
              <p className="text-[11px] font-semibold text-primary tracking-wide">{cardNumber}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap divide-x divide-border rounded-xl border border-border bg-background/60 rtl:divide-x-reverse">
          <StripCell
            icon={Droplet}
            label={t("Blood Group")}
            value={profile?.blood_type && profile.blood_type !== "Unknown" ? profile.blood_type : "—"}
          />
          <StripCell icon={Activity} label={t("Allergies")} value={allergyText || profile?.allergies || "—"} />
          {conditionText ? (
            <StripCell
              icon={HeartPulse}
              label={t("Chronic Conditions")}
              value={conditionText}
              onClick={() => setPickerOpen(true)}
            />
          ) : (
            <StripCell
              icon={Plus}
              label={t("Chronic Conditions")}
              value={`(${t("Optional")})`}
              onClick={() => setPickerOpen(true)}
              action
            />
          )}
          <StripCell
            icon={Phone}
            label={t("Emergency Contact")}
            value={emergencyContact?.phone}
            sub={emergencyContact?.relationship ? `(${emergencyContact.relationship})` : emergencyContact?.name}
          />
        </div>
      </div>

      <div className="relative bg-primary text-primary-foreground px-4 sm:px-5 py-2 flex items-center justify-end">
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