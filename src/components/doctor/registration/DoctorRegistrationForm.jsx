import React, { useEffect, useRef, useState } from "react";
import { Loader2, X, CheckCircle2, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/specialties";
import VerificationMethodSelector from "@/components/verification/VerificationMethodSelector";
import DocumentVerificationCard from "@/components/verification/DocumentVerificationCard";
import { useAppLanguage } from "@/lib/appLanguage";
import { EMPTY_DOCTOR_FORM, saveDoctorDraft, submitDoctorRegistration } from "@/lib/doctorRegistration";

// The existing doctor registration form, now resumable: saved details and any
// verification already completed are restored, and every change is saved
// automatically so leaving the page never loses a step. The fields, the
// verification requirements and the approval flow are unchanged.
export default function DoctorRegistrationForm({ state = "incomplete", restores = null, onClose, onSubmitted }) {
  const { t } = useAppLanguage();
  const [doctorForm, setDoctorForm] = useState({ ...EMPTY_DOCTOR_FORM, ...(restores?.fields || {}) });
  const [doctorVerification, setDoctorVerification] = useState({
    identity: restores?.identity
      ? { status: restores.identity.status || "verified", verification_id: restores.identity.verification_id, document_type: restores.identity.method }
      : null,
    medical_license: restores?.license
      ? { status: restores.license.status || "verified", verification_id: restores.license.verification_id }
      : null,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const lastSaved = useRef("");
  const restored = !!restores?.fields && Object.values(restores.fields).some((v) => (v || "").toString().trim() !== "");

  const buildPayload = () => {
    const identityDone = ["verified", "pending"].includes(doctorVerification.identity?.status);
    const licenseDone = ["verified", "pending"].includes(doctorVerification.medical_license?.status);
    return {
      ...doctorForm,
      step: licenseDone ? "license_verification" : identityDone ? "identity_verification" : "details",
      identity_verification_id: doctorVerification.identity?.verification_id || "",
      license_verification_id: doctorVerification.medical_license?.verification_id || "",
    };
  };

  // Automatic progress recovery: the draft is created on first open and
  // updated after every change.
  useEffect(() => {
    if (state !== "incomplete") return;
    const payload = buildPayload();
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSaved.current) return;
    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await saveDoctorDraft(payload);
        lastSaved.current = snapshot;
        setSaveState(res.saved ? "saved" : "idle");
      } catch (err) {
        setSaveState("idle");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [doctorForm, doctorVerification.identity, doctorVerification.medical_license, state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctorForm.specialization) {
      setError(t("Please select your specialty."));
      return;
    }
    const submitted = (v) => ["verified", "pending"].includes(v?.status);
    if (!submitted(doctorVerification.identity) || !submitted(doctorVerification.medical_license)) {
      setError(t("Submit your identity and licence documents to continue."));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await submitDoctorRegistration({
        ...buildPayload(),
        identity_verification_id: doctorVerification.identity.verification_id,
        license_verification_id: doctorVerification.medical_license.verification_id,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      onSubmitted(res);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("Unable to submit your registration. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (title, children) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-xl border border-border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{t("Doctor Registration")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{title}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  if (state === "pending_verification") {
    return shell(t("Registration submitted"), (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {t("Your registration has been submitted together with your documents. Your account is awaiting AMedix administration approval.")}
          </p>
        </div>
        <Button className="w-full" onClick={() => onSubmitted({ state })}>{t("Go to Doctor Portal")}</Button>
      </div>
    ));
  }

  if (state === "active") {
    return shell(t("Account already registered"), (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {t("This account is already registered and verified. A second account is never created for the same doctor.")}
          </p>
        </div>
        <Button className="w-full" onClick={() => onSubmitted({ state })}>{t("Go to Doctor Portal")}</Button>
      </div>
    ));
  }

  if (state === "rejected") {
    return shell(t("Registration not approved"), (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <Ban className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {restores?.rejection_reason || t("This registration was not approved. Please contact AMedix administration for help.")}
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={onClose}>{t("Close")}</Button>
      </div>
    ));
  }

  return shell(t("Enter your professional details"), (
    <form onSubmit={handleSubmit} className="space-y-4">
      {restored && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-accent p-3">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {t("Continuing your saved registration — your details and verified documents were restored.")}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="doc-first-name">{t("First Name *")}</Label>
          <Input id="doc-first-name" placeholder={t("First name")} value={doctorForm.first_name} onChange={(e) => setDoctorForm({ ...doctorForm, first_name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc-middle-name">{t("Middle Name")}</Label>
          <Input id="doc-middle-name" placeholder={t("Middle name")} value={doctorForm.middle_name} onChange={(e) => setDoctorForm({ ...doctorForm, middle_name: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="doc-last-name">{t("Last Name *")}</Label>
        <Input id="doc-last-name" placeholder={t("Last name")} value={doctorForm.last_name} onChange={(e) => setDoctorForm({ ...doctorForm, last_name: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>{t("Specialty *")}</Label>
        <Select
          value={doctorForm.specialization || undefined}
          onValueChange={(v) => setDoctorForm((f) => ({ ...f, specialization: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Select your specialty")} />
          </SelectTrigger>
          <SelectContent>
            {SPECIALTIES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t("Your specialty is permanent — it determines the portal and clinical documents you work in.")}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="hospital">{t("Hospital / Clinic")}</Label>
        <Input id="hospital" placeholder={t("Hospital or clinic name")} value={doctorForm.hospital} onChange={(e) => setDoctorForm({ ...doctorForm, hospital: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t("Phone")}</Label>
        <Input id="phone" placeholder={t("Contact number")} value={doctorForm.phone} onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} />
      </div>
      <div className="pt-2">
        <h3 className="text-sm font-semibold text-primary">{t("Verification Process")} *</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          {t("Your documents are verified securely and stored with your profile.")}
        </p>
      </div>
      <VerificationMethodSelector
        profileType="doctor"
        fullName={[doctorForm.first_name, doctorForm.middle_name, doctorForm.last_name].filter(Boolean).join(" ")}
        initialMethod={["birth_certificate", "personal_card", "drivers_licence", "passport"].includes(restores?.identity?.method) ? restores.identity.method : ""}
        result={doctorVerification.identity}
        onResult={(r) => setDoctorVerification((s) => ({ ...s, identity: r }))}
        t={t}
      />
      <DocumentVerificationCard
        profileType="doctor"
        documentType="medical_license"
        title={t("Medical / Professional License Document")}
        description={t("Upload a clear photo or PDF")}
        fields={[{ key: "license_number", label: t("Medical License Number"), placeholder: t("Medical license number") }]}
        values={{ license_number: doctorForm.license_number }}
        onValueChange={(key, value) => {
          setDoctorForm((f) => ({ ...f, license_number: value }));
        }}
        result={doctorVerification.medical_license}
        onResult={(r) => setDoctorVerification((s) => ({ ...s, medical_license: r }))}
        t={t}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : t("Create Doctor Account")}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        {saveState === "saved" ? t("Progress saved — you can continue later.") : t("Your progress is saved automatically.")}
      </p>
    </form>
  ));
}