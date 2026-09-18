import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { generateUniqueCIN } from "@/lib/cin";
import QrCodeCard from "@/components/QrCodeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2, BadgeCheck, Lock, Fingerprint, ArrowLeft, Check } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import {
  MedicalListSection, ConditionEntryForm, MedicationEntryForm, AllergyEntryForm, SurgeryEntryForm,
} from "@/components/patient/onboarding/EntryForms";
import FamilyHistoryEntryForm, { familyConditionLabel, relationLabel } from "@/components/patient/onboarding/FamilyHistoryEntryForm";
import VerificationMethodSelector from "@/components/verification/VerificationMethodSelector";

const STEPS = ["Personal Information", "Medical History", "Medications & Surgeries", "Lifestyle & Pregnancy"];

// Pregnancy-history counters — selection-only questions with predefined
// number options, answered by married female patients during registration.
const PREGNANCY_COUNTS = [
  { key: "gravida", label: "Number of pregnancies (Gravida)" },
  { key: "para", label: "Number of births (Para)" },
  { key: "living_children", label: "Number of living children" },
  { key: "miscarriages", label: "Number of miscarriages/abortions" },
  { key: "stillbirths", label: "Number of stillbirths" },
];

export default function PatientOnboardingForm({ user, onComplete, onClose }) {
  const { lang, t, setLang } = usePatientLanguage();
  const nameParts = (user?.full_name || "").split(" ").filter(Boolean);
  const [step, setStep] = useState(0);
  const [cin, setCin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: nameParts[0] || "",
    father_name: "",
    grandfather_name: "",
    last_name: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
    first_name_ar: "",
    father_name_ar: "",
    grandfather_name_ar: "",
    last_name_ar: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    address: "",
    blood_type: "Unknown",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    identification_number: "",
    preferred_language: lang === "ar" ? "ar" : "en",
  });
  const [medical, setMedical] = useState({
    familyHistory: [], pastHistory: [], allergies: [], medications: [], surgeries: [],
  });
  const [noneFlags, setNoneFlags] = useState({
    familyHistory: false, pastHistory: false, allergies: false, medications: false, surgeries: false,
  });
  const [lifestyle, setLifestyle] = useState({
    smoking_status: "", alcohol_use: "", substance_use: "",
    marital_status: "",
    pregnancy_status: "", gestational_age: "", estimated_due_date: "",
    gravida: "", para: "", living_children: "", miscarriages: "", stillbirths: "",
  });

  const isFemale = form.gender === "female";

  // Backend verdict for the Verification Process section — { status, reason, verification_id }.
  const [verification, setVerification] = useState(null);
  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    // The entered identity information is part of the verification — editing
    // it invalidates any previous verdict.
    if ([
      "date_of_birth", "identification_number",
      "first_name", "father_name", "grandfather_name", "last_name",
      "first_name_ar", "father_name_ar", "grandfather_name_ar", "last_name_ar",
    ].includes(field)) setVerification(null);
    setError("");
  };
  const setL = (field) => (e) => setLifestyle((s) => ({ ...s, [field]: e.target.value }));
  const addEntry = (list) => (entry) => setMedical((m) => ({ ...m, [list]: [...m[list], entry] }));
  const removeEntry = (list) => (i) => setMedical((m) => ({ ...m, [list]: m[list].filter((_, idx) => idx !== i) }));
  const toggleNone = (flag) => (checked) => {
    setNoneFlags((n) => ({ ...n, [flag]: checked }));
    setError("");
  };

  const sectionAnswered = (flag) => noneFlags[flag] || medical[flag].length > 0;
  const step1Valid = ["familyHistory", "pastHistory", "allergies"].every(sectionAnswered);
  const step2Valid = ["medications", "surgeries"].every(sectionAnswered);
  const pregnancyCountsAnswered = PREGNANCY_COUNTS.every(({ key }) => lifestyle[key] !== "");
  const step3Valid =
    !!lifestyle.smoking_status &&
    !!lifestyle.alcohol_use &&
    (!isFemale ||
      (!!lifestyle.marital_status &&
        (lifestyle.marital_status !== "married" ||
          (!!lifestyle.pregnancy_status &&
            pregnancyCountsAnswered &&
            (lifestyle.pregnancy_status !== "pregnant" ||
              (!!lifestyle.gestational_age && !!lifestyle.estimated_due_date))))));

  const switchLang = (v) => {
    setLang(v);
    setForm((f) => ({ ...f, preferred_language: v }));
  };

  const nextFromStep0 = (e) => {
    e.preventDefault();
    if (!form.gender) {
      setError(t("Please select your sex."));
      return;
    }
    if (verification?.status !== "verified") {
      setError(t("Verification is required before you can continue."));
      return;
    }
    setStep(1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    const marriedFemale = isFemale && lifestyle.marital_status === "married";
    const isPregnant = marriedFemale && lifestyle.pregnancy_status === "pregnant";
    try {
      const newCin = await generateUniqueCIN();
      const fullName = [form.first_name, form.father_name, form.grandfather_name, form.last_name].filter(Boolean).join(" ");
      const fullNameAr = [form.first_name_ar, form.father_name_ar, form.grandfather_name_ar, form.last_name_ar].filter(Boolean).join(" ");
      const profile = await base44.entities.PatientProfile.create({
        user_id: user.id,
        cin: newCin,
        full_name: fullName,
        first_name: form.first_name,
        father_name: form.father_name,
        grandfather_name: form.grandfather_name,
        last_name: form.last_name,
        middle_name: form.father_name,
        first_name_ar: form.first_name_ar,
        father_name_ar: form.father_name_ar,
        grandfather_name_ar: form.grandfather_name_ar,
        last_name_ar: form.last_name_ar,
        full_name_ar: fullNameAr,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        phone: form.phone,
        address: form.address,
        blood_type: form.blood_type,
        identification_number: form.identification_number,
        preferred_language: form.preferred_language,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        emergency_contact_relationship: form.emergency_contact_relationship,
        smoking_status: lifestyle.smoking_status,
        alcohol_use: lifestyle.alcohol_use,
        substance_use: lifestyle.substance_use,
        marital_status: isFemale ? lifestyle.marital_status : "",
        pregnancy_status: marriedFemale ? lifestyle.pregnancy_status : "not_applicable",
        gestational_age: isPregnant ? lifestyle.gestational_age : "",
        estimated_due_date: isPregnant ? lifestyle.estimated_due_date : "",
        gravida: marriedFemale ? Number(lifestyle.gravida) : 0,
        para: marriedFemale ? Number(lifestyle.para) : 0,
        living_children: marriedFemale ? Number(lifestyle.living_children) : 0,
        miscarriages_abortions: marriedFemale ? Number(lifestyle.miscarriages) : 0,
        stillbirths: marriedFemale ? Number(lifestyle.stillbirths) : 0,
        pregnancy_history: marriedFemale
          ? `G${lifestyle.gravida} P${lifestyle.para} · ${lifestyle.living_children} living children · ${lifestyle.miscarriages} miscarriages/abortions · ${lifestyle.stillbirths} stillbirths`
          : "",
        medication_info_completed: true,
      });
      const meta = { patient_id: profile.id, patient_cin: newCin, patient_name: fullName };
      const conditions = medical.pastHistory.map((c) => ({ ...meta, ...c, category: "past_history" }));
      const creates = [];
      if (conditions.length) creates.push(base44.entities.MedicalCondition.bulkCreate(conditions));
      if (medical.familyHistory.length) {
        creates.push(base44.entities.FamilyHistory.bulkCreate(medical.familyHistory.map((f) => ({ ...meta, ...f }))));
      }
      if (medical.allergies.length) {
        creates.push(base44.entities.Allergy.bulkCreate(medical.allergies.map((a) => ({ ...meta, ...a }))));
      }
      if (medical.medications.length) {
        creates.push(
          base44.entities.Medication.bulkCreate(
            medical.medications.map((m) => ({ ...meta, ...m, source: "patient_reported" }))
          )
        );
      }
      if (medical.surgeries.length) {
        creates.push(base44.entities.SurgicalHistory.bulkCreate(medical.surgeries.map((s) => ({ ...meta, ...s }))));
      }
      if (creates.length) await Promise.all(creates);
      // Associate the verified identity document with the new profile.
      if (verification?.status === "verified" && verification.verification_id) {
        try {
          await base44.functions.invoke("attachVerificationToProfile", {
            record_ids: [verification.verification_id],
            profile_type: "patient",
            patient_id: profile.id,
          });
        } catch (verr) {
          console.error(verr);
        }
      }
      setCin(newCin);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(t("Something went wrong while creating your profile. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const stepValid = step === 1 ? step1Valid : step === 2 ? step2Valid : step3Valid;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="flex items-start sm:items-center justify-center p-4 min-h-full">
        <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-2xl my-4">
          {step < 4 ? (
            <>
              <div className="flex items-start justify-between p-6 pb-0">
                <div>
                  <h2 className="text-xl font-bold">{t("Patient Registration")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("Step {current} of {total} — {step}. Your answers become your locked medical history.", {
                      current: step + 1,
                      total: 4,
                      step: t(STEPS[step]),
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center rounded-full border border-border p-0.5">
                    <button
                      type="button"
                      onClick={() => switchLang("en")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
                        lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => switchLang("ar")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
                        lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      العربية
                    </button>
                  </div>
                  <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 px-6 pt-4">
                {STEPS.map((label, i) => (
                  <React.Fragment key={label}>
                    <div
                      className={`flex items-center gap-1.5 text-xs shrink-0 ${
                        i === step ? "text-primary font-semibold" : i < step ? "text-emerald-600" : "text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          i === step
                            ? "bg-primary text-primary-foreground"
                            : i < step
                              ? "bg-emerald-100"
                              : "bg-muted"
                        }`}
                      >
                        {i < step ? <Check className="w-3 h-3" /> : i + 1}
                      </span>
                      <span className="hidden lg:inline">{t(label)}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px min-w-2 ${i < step ? "bg-emerald-400" : "bg-border"}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {step === 0 && (
                <form onSubmit={nextFromStep0} className="p-6 space-y-6">
                  <section>
                    <h3 className="text-sm font-semibold text-primary mb-3">{t("Personal Information")}</h3>
                    {/* The full name is required in BOTH Arabic and English.
                        The interface language only changes the labels — it
                        never removes either name block. */}
                    <h4 className="text-xs font-semibold">{t("Name (English)")}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
                      {t("Exactly as it appears on your Passport or official English identification document, including the same spelling and order.")}
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="first_name">{t("First Name")} *</Label>
                        <Input id="first_name" value={form.first_name} onChange={set("first_name")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="father_name">{t("Father's Name")} *</Label>
                        <Input id="father_name" value={form.father_name} onChange={set("father_name")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="grandfather_name">{t("Grandfather's Name")} *</Label>
                        <Input id="grandfather_name" value={form.grandfather_name} onChange={set("grandfather_name")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="last_name">{t("Last Name")} *</Label>
                        <Input id="last_name" value={form.last_name} onChange={set("last_name")} required />
                      </div>
                    </div>
                    <div className="mt-4" dir="rtl">
                      <h4 className="text-xs font-semibold">{t("Name (Arabic)")}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
                        {t("Exactly as it appears on your official Arabic document.")}
                      </p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="first_name_ar">الاسم الأول *</Label>
                          <Input id="first_name_ar" value={form.first_name_ar} onChange={set("first_name_ar")} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="father_name_ar">اسم الأب *</Label>
                          <Input id="father_name_ar" value={form.father_name_ar} onChange={set("father_name_ar")} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="grandfather_name_ar">اسم الجد *</Label>
                          <Input id="grandfather_name_ar" value={form.grandfather_name_ar} onChange={set("grandfather_name_ar")} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="last_name_ar">اللقب *</Label>
                          <Input id="last_name_ar" value={form.last_name_ar} onChange={set("last_name_ar")} required />
                        </div>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="dob">{t("Date of birth")} *</Label>
                        <Input id="dob" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("Sex")} *</Label>
                        <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                          <SelectTrigger><SelectValue placeholder={t("Select")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">{t("Male")}</SelectItem>
                            <SelectItem value="female">{t("Female")}</SelectItem>
                            <SelectItem value="other">{t("Other")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">{t("Phone number")} *</Label>
                        <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">{t("Email")}</Label>
                        <Input id="email" value={user?.email || ""} disabled />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-primary mb-3">{t("Address")}</h3>
                    <div className="space-y-1.5">
                      <Label htmlFor="address">{t("Address")} *</Label>
                      <Input id="address" placeholder={t("Street, city, country")} value={form.address} onChange={set("address")} required />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-primary mb-3">{t("Emergency Contact")}</h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="ec_name">{t("Name")} *</Label>
                        <Input id="ec_name" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ec_phone">{t("Phone")} *</Label>
                        <Input id="ec_phone" type="tel" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ec_rel">{t("Relationship")}</Label>
                        <Input id="ec_rel" placeholder={t("e.g. Spouse, Parent")} value={form.emergency_contact_relationship} onChange={set("emergency_contact_relationship")} />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-primary mb-3">{t("Additional Information")}</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="id_number">{t("Identification number")} *</Label>
                        <Input id="id_number" placeholder={t("National ID / passport number")} value={form.identification_number} onChange={set("identification_number")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("Blood type")}</Label>
                        <Select value={form.blood_type} onValueChange={(v) => setForm((f) => ({ ...f, blood_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((bt) => (
                              <SelectItem key={bt} value={bt}>{bt === "Unknown" ? t("Unknown") : bt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-primary mb-3">{t("Verification Process")} *</h3>
                    <VerificationMethodSelector
                      profileType="patient"
                      fullName={[form.first_name, form.father_name, form.grandfather_name, form.last_name].filter(Boolean).join(" ")}
                      fullNameAr={[form.first_name_ar, form.father_name_ar, form.grandfather_name_ar, form.last_name_ar].filter(Boolean).join(" ")}
                      birthCertificateReadOnly
                      dateOfBirth={form.date_of_birth}
                      nationalIdNumber={form.identification_number}
                      result={verification}
                      onResult={setVerification}
                      t={t}
                    />
                  </section>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" size="lg">
                    {t("Continue")}
                  </Button>
                </form>
              )}

              {step === 1 && (
                <div className="p-6 space-y-4">
                  <MedicalListSection
                    id="none_familyHistory"
                    title={`${t("Family History")} *`}
                    description={t("Diseases or medical conditions that run in your family")}
                    entries={medical.familyHistory}
                    entryLabel={(c) => `${familyConditionLabel(c, lang === "ar")} — ${relationLabel(c.relation, lang === "ar")}`}
                    onRemove={removeEntry("familyHistory")}
                    noneChecked={noneFlags.familyHistory}
                    onNoneChange={toggleNone("familyHistory")}
                    noneLabel={t("No family history of diseases")}
                  >
                    <FamilyHistoryEntryForm onAdd={addEntry("familyHistory")} />
                  </MedicalListSection>

                  <MedicalListSection
                    id="none_pastHistory"
                    title={`${t("Past Medical History")} *`}
                    description={t("Previous diseases and important hospitalizations")}
                    entries={medical.pastHistory}
                    entryLabel={(c) => `${c.name_ar || c.name}${c.date ? ` (${c.date})` : ""}`}
                    onRemove={removeEntry("pastHistory")}
                    noneChecked={noneFlags.pastHistory}
                    onNoneChange={toggleNone("pastHistory")}
                    noneLabel={t("No past medical history")}
                  >
                    <ConditionEntryForm onAdd={addEntry("pastHistory")} />
                  </MedicalListSection>

                  <MedicalListSection
                    id="none_allergies"
                    title={`${t("Allergies")} *`}
                    description={t("Drug, food, or environmental allergies")}
                    entries={medical.allergies}
                    entryLabel={(a) => `${a.allergen}${a.reaction ? ` — ${a.reaction}` : ""}`}
                    onRemove={removeEntry("allergies")}
                    noneChecked={noneFlags.allergies}
                    onNoneChange={toggleNone("allergies")}
                    noneLabel={t("I have no allergies")}
                  >
                    <AllergyEntryForm onAdd={addEntry("allergies")} />
                  </MedicalListSection>

                  {!step1Valid && (
                    <p className="text-xs text-muted-foreground">
                      {t("Answer each section — add entries or tick \"None\".")}
                    </p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="p-6 space-y-4">
                  <MedicalListSection
                    id="none_medications"
                    title={`${t("Current Medications")} *`}
                    description={t("Medicines you currently take, with dose and frequency")}
                    entries={medical.medications}
                    entryLabel={(m) => `${m.name}${m.dose ? ` · ${m.dose}` : ""}${m.frequency ? ` · ${m.frequency}` : ""}`}
                    onRemove={removeEntry("medications")}
                    noneChecked={noneFlags.medications}
                    onNoneChange={toggleNone("medications")}
                    noneLabel={t("I am not taking any medications")}
                  >
                    <MedicationEntryForm onAdd={addEntry("medications")} />
                  </MedicalListSection>

                  <MedicalListSection
                    id="none_surgeries"
                    title={`${t("Past Surgical History")} *`}
                    description={t("Every previous surgery or operation")}
                    entries={medical.surgeries}
                    entryLabel={(s) => `${s.surgery_type_ar || s.surgery_type}${s.surgery_date ? ` (${s.surgery_date})` : ""}`}
                    onRemove={removeEntry("surgeries")}
                    noneChecked={noneFlags.surgeries}
                    onNoneChange={toggleNone("surgeries")}
                    noneLabel={t("I never had surgery")}
                  >
                    <SurgeryEntryForm onAdd={addEntry("surgeries")} />
                  </MedicalListSection>

                  {!step2Valid && (
                    <p className="text-xs text-muted-foreground">
                      {t("Answer each section — add entries or tick \"None\".")}
                    </p>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="p-6 space-y-4">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold text-primary mb-3">{t("Lifestyle")} *</h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>{t("Smoking status")} *</Label>
                        <Select value={lifestyle.smoking_status} onValueChange={(v) => setLifestyle((s) => ({ ...s, smoking_status: v }))}>
                          <SelectTrigger><SelectValue placeholder={t("Select")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">{t("Never smoked")}</SelectItem>
                            <SelectItem value="former">{t("Former smoker")}</SelectItem>
                            <SelectItem value="current">{t("Current smoker")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("Alcohol use")} *</Label>
                        <Select value={lifestyle.alcohol_use} onValueChange={(v) => setLifestyle((s) => ({ ...s, alcohol_use: v }))}>
                          <SelectTrigger><SelectValue placeholder={t("Select")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t("None")}</SelectItem>
                            <SelectItem value="occasional">{t("Occasional")}</SelectItem>
                            <SelectItem value="regular">{t("Regular")}</SelectItem>
                            <SelectItem value="former">{t("Former drinker")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="substance">{t("Other substance use")}</Label>
                        <Input id="substance" placeholder={t("None")} value={lifestyle.substance_use} onChange={setL("substance_use")} />
                      </div>
                    </div>
                  </div>

                  {isFemale && (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <h3 className="text-sm font-semibold text-primary mb-3">{t("Marital Status")} *</h3>
                      <Select value={lifestyle.marital_status} onValueChange={(v) => setLifestyle((s) => ({ ...s, marital_status: v }))}>
                        <SelectTrigger className="sm:max-w-xs"><SelectValue placeholder={t("Select")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="married">{t("Married")}</SelectItem>
                          <SelectItem value="not_married">{t("Not Married")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {isFemale && lifestyle.marital_status === "married" && (
                    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-primary">{t("Pregnancy History")} *</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>{t("Pregnancy status")} *</Label>
                          <Select value={lifestyle.pregnancy_status} onValueChange={(v) => setLifestyle((s) => ({ ...s, pregnancy_status: v }))}>
                            <SelectTrigger><SelectValue placeholder={t("Select")} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_pregnant">{t("Not pregnant")}</SelectItem>
                              <SelectItem value="pregnant">{t("Pregnant")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {lifestyle.pregnancy_status === "pregnant" && (
                          <>
                            <div className="space-y-1.5">
                              <Label>{t("Gestational age")} *</Label>
                              <Select value={lifestyle.gestational_age} onValueChange={(v) => setLifestyle((s) => ({ ...s, gestational_age: v }))}>
                                <SelectTrigger><SelectValue placeholder={t("Select")} /></SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 40 }, (_, i) => i + 1).map((w) => (
                                    <SelectItem key={w} value={`${w} weeks`}>{w} {t("weeks")}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edd">{t("Estimated due date")} *</Label>
                              <Input id="edd" type="date" value={lifestyle.estimated_due_date} onChange={setL("estimated_due_date")} />
                            </div>
                          </>
                        )}
                      </div>
                      {lifestyle.pregnancy_status === "not_pregnant" && (
                        <p className="text-xs text-muted-foreground">
                          {t("Answer about previous pregnancies even if you are not pregnant now.")}
                        </p>
                      )}
                      <div className="grid sm:grid-cols-3 gap-3">
                        {PREGNANCY_COUNTS.map(({ key, label }) => (
                          <div key={key} className="space-y-1.5">
                            <Label>{t(label)} *</Label>
                            <Select value={lifestyle[key]} onValueChange={(v) => setLifestyle((s) => ({ ...s, [key]: v }))}>
                              <SelectTrigger><SelectValue placeholder={t("Select")} /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 13 }, (_, i) => String(i)).map((n) => (
                                  <SelectItem key={n} value={n}>{n}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step > 0 && (
                <div className="flex items-center justify-between p-6 pt-0">
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="w-4 h-4 mr-1 rtl:rotate-180 rtl:ml-1 rtl:mr-0" />
                    {t("Back")}
                  </Button>
                  {step < 3 ? (
                    <Button type="button" disabled={!stepValid} onClick={() => setStep(step + 1)}>
                      {t("Next")}
                    </Button>
                  ) : (
                    <Button type="button" size="lg" disabled={!step3Valid || submitting} onClick={handleSubmit}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
                          {t("Creating your profile...")}
                        </>
                      ) : (
                        t("Complete Registration")
                      )}
                    </Button>
                  )}
                </div>
              )}

              {step > 0 && error && <p className="text-sm text-destructive px-6 pb-6">{error}</p>}
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <BadgeCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mt-4">{t("Registration Complete")}</h2>
              <p className="text-muted-foreground text-sm mt-2">
                {t("Your unique Clinical Identification Number has been generated.")}
              </p>
              <p className="text-3xl font-bold tracking-widest text-primary mt-6">{cin}</p>
              <div className="flex justify-center mt-6">
                <QrCodeCard cin={cin} size={180} />
              </div>
              <div className="text-start rtl:text-end max-w-sm mx-auto mt-6 space-y-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t("Your CIN is permanent and can never be changed or duplicated.")}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Fingerprint className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t("It contains no personal information (such as your date of birth) and doctors can search for you with it.")}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {t("Your medical history has been saved to My Health and is locked. It can only be updated by an authorized doctor or administrator.")}
                  </span>
                </div>
              </div>
              <Button className="mt-6 w-full max-w-xs" size="lg" onClick={onComplete}>
                {t("Continue to My Dashboard")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}