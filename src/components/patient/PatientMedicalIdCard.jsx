import React, { useMemo, useState } from "react";
import { Activity, Calendar, CreditCard, Droplet, HeartPulse, Phone, Plus, Printer, ShieldCheck, UserRound } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import QrCodeCard from "@/components/QrCodeCard";
import ChronicConditionPicker from "@/components/patient/ChronicConditionPicker";
import { PATIENT_ID_CONDITIONS } from "@/lib/patientIdConditions";
import { usePatientLanguage } from "@/lib/patientLanguage";
import MedicalIdCardDownload from "@/components/patient/card/MedicalIdCardDownload";
import "@/components/patient/card/medicalCardPrint.css";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
      <p className="text-sm font-semibold text-primary break-words">{value || "—"}</p>
    </div>
  );
}

function StripCell({ icon: Icon, label, value, sub, extra, action, onClick }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`w-1/2 sm:w-1/4 sm:flex-1 min-w-0 px-3 py-2 text-start ${onClick ? "hover:bg-accent/60" : ""}`}
    >
      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground whitespace-nowrap">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      {action ? (
        <span className="mt-1 inline-block rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground">
          {value}
        </span>
      ) : (
        <span className="mt-0.5 flex items-baseline gap-1">
          <span className="text-xs font-semibold text-primary line-clamp-2 break-words">{value || "—"}</span>
          {extra > 0 && <span className="text-[10px] text-muted-foreground shrink-0">+{extra}</span>}
        </span>
      )}
      {sub && <span className="block text-[10px] text-muted-foreground truncate">{sub}</span>}
    </Wrapper>
  );
}

// One labelled fact inside the QR pop-up.
function CardFact({ label, value, wide }) {
  return (
    <div className={wide ? "col-span-2 min-w-0" : "min-w-0"}>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-semibold text-primary">{value || "—"}</dd>
    </div>
  );
}

// The patient's Medical ID card — every value comes from the patient's own
// account. Only the emergency-relevant conditions listed on the card are
// shown; anything else stays in the full clinical record.
export default function PatientMedicalIdCard({ profile, card, conditions = [], allergyText, emergencyContact, onConditionsChanged }) {
  const { t, lang } = usePatientLanguage();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const allowedNames = useMemo(
    () => new Set(PATIENT_ID_CONDITIONS.map((c) => c.en.toLowerCase())),
    []
  );

  const cardConditions = useMemo(
    () => conditions.filter((c) => allowedNames.has(String(c.name || "").trim().toLowerCase())),
    [conditions, allowedNames]
  );

  const conditionLabels = cardConditions
    .map((c) => (lang === "ar" ? c.name_ar || c.name : c.name))
    .filter(Boolean);

  const cardNumber = card?.card_number
    || (profile?.id ? `P-${String(profile.id).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}` : "—");
  const genderLabel = profile?.gender
    ? t(profile.gender === "male" ? "Male" : profile.gender === "female" ? "Female" : "Other")
    : "—";
  const name = (lang === "ar" ? profile?.full_name_ar : "") || profile?.full_name || "—";
  const bloodGroup = profile?.blood_type && profile.blood_type !== "Unknown" ? profile.blood_type : "—";
  const allergiesText = allergyText || profile?.allergies || "—";
  const emergencyText = emergencyContact?.phone
    ? `${emergencyContact.phone}${emergencyContact.relationship ? ` (${emergencyContact.relationship})` : ""}`
    : "—";

  // The QR always carries the secure verification link, so any phone camera
  // opens the AMedix verification page without the app installed.
  const qrValue = card?.verify_url
    || (card?.verification_token ? `${window.location.origin}/verify-card?token=${card.verification_token}` : profile?.cin || "");

  return (
    <div className="pp-print-card relative rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
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
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo className="h-11 w-11 shrink-0" />
            <div className="min-w-0">
              <p className="font-heading text-[17px] sm:text-lg font-bold text-primary leading-none whitespace-nowrap">
                AMedix
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap">{t("Patient Card")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="w-px h-10 bg-border" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-2.5 py-1 text-[11px] font-medium text-info whitespace-nowrap">
              <HeartPulse className="w-3.5 h-3.5" />
              {t("Medical ID")}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground">{t("Patient Name")}</p>
              <p className="font-heading text-base sm:text-lg font-bold text-primary leading-tight break-words">
                {name}
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

          <div className="flex flex-wrap sm:flex-col items-center gap-3 shrink-0 justify-center">
            <div className="flex flex-col items-center gap-1">
              <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("Open card QR code")}
                    className="rounded-xl bg-info/10 p-1.5 transition hover:bg-info/20"
                  >
                    <QrCodeCard cin={profile?.cin} value={qrValue} size={116} />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogTitle className="font-heading text-base font-bold text-primary">
                    {t("AMedix Medical Card")}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {t("Patient medical card information")}
                  </DialogDescription>

                  <div className="flex flex-col items-center gap-2">
                    <QrCodeCard cin={profile?.cin} value={qrValue} size={220} />
                    <p className="text-center text-[11px] text-muted-foreground">
                      {t("Scan with any phone camera to open the secure verification page.")}
                    </p>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-border bg-muted/40 p-3 text-start">
                    <CardFact label={t("Patient Name")} value={name} wide />
                    <CardFact label={t("Patient ID")} value={cardNumber} />
                    <CardFact label={t("CIN (National ID)")} value={profile?.cin} />
                    <CardFact label={t("Date of Birth")} value={formatDate(profile?.date_of_birth)} />
                    <CardFact label={t("Gender")} value={genderLabel} />
                    <CardFact label={t("Blood Group")} value={bloodGroup} />
                    <CardFact label={t("Allergies")} value={allergiesText} />
                    <CardFact label={t("Chronic Conditions")} value={conditionLabels.join(", ")} wide />
                    <CardFact label={t("Emergency Contact")} value={emergencyText} wide />
                  </dl>

                  <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-2.5 text-[11px] text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t("The scanned page confirms the card's status only. Clinical records need the patient's authorization.")}</span>
                  </p>

                  <button
                    type="button"
                    onClick={() => setQrOpen(false)}
                    className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    {t("Close")}
                  </button>
                </DialogContent>
              </Dialog>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">{t("AMedix Patient QR")}</p>
                <span className="inline-block rounded-full bg-info/10 px-2 py-0.5 text-[11px] font-semibold text-primary tracking-wide">
                  {cardNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap sm:flex-nowrap divide-x divide-border rounded-xl border border-border bg-background/60 rtl:divide-x-reverse">
          <StripCell icon={Droplet} label={t("Blood Group")} value={bloodGroup} />
          <StripCell icon={Activity} label={t("Allergies")} value={allergiesText} />
          {conditionLabels.length > 0 ? (
            <StripCell
              icon={HeartPulse}
              label={t("Chronic Conditions")}
              value={conditionLabels[0]}
              extra={conditionLabels.length - 1}
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

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-primary/50 bg-white px-3 text-xs font-semibold text-primary transition hover:bg-primary/5"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t("Print card")}
          </button>
          <MedicalIdCardDownload />
        </div>
      </div>

      <div className="relative bg-primary text-primary-foreground px-4 sm:px-5 py-2 flex items-center justify-end">
        <span className="text-[11px]">AMedix | {t("Your Health. Connected.")}</span>
      </div>

      <ChronicConditionPicker
        patientId={profile?.id}
        existing={cardConditions}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onAdded={onConditionsChanged}
      />
    </div>
  );
}