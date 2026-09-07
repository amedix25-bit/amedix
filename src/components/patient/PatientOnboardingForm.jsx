import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { generateUniqueCIN } from "@/lib/cin";
import QrCodeCard from "@/components/QrCodeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2, BadgeCheck, Lock, Fingerprint, ArrowLeft, Check } from "lucide-react";
import {
  MedicalListSection, ConditionEntryForm, MedicationEntryForm, AllergyEntryForm, SurgeryEntryForm,
} from "@/components/patient/onboarding/EntryForms";

const STEPS = ["Personal Information", "Medical History", "Medications & Surgeries", "Lifestyle & Pregnancy"];

export default function PatientOnboardingForm({ user, onComplete, onClose }) {
  const nameParts = (user?.full_name || "").split(" ").filter(Boolean);
  const [step, setStep] = useState(0);
  const [cin, setCin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: nameParts[0] || "",
    middle_name: "",
    last_name: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
    date_of_birth: "",
    gender: "",
    phone: "",
    address: "",
    blood_type: "Unknown",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    identification_number: "",
  });
  const [medical, setMedical] = useState({
    knownCases: [], pastHistory: [], allergies: [], medications: [], surgeries: [],
  });
  const [noneFlags, setNoneFlags] = useState({
    knownCases: false, pastHistory: false, allergies: false, medications: false, surgeries: false,
  });
  const [lifestyle, setLifestyle] = useState({
    smoking_status: "", alcohol_use: "", substance_use: "",
    pregnancy_status: "", gestational_age: "", estimated_due_date: "", pregnancy_history: "",
  });

  const isFemale = form.gender === "female";

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
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
  const step1Valid = ["knownCases", "pastHistory", "allergies"].every(sectionAnswered);
  const step2Valid = ["medications", "surgeries"].every(sectionAnswered);
  const step3Valid =
    !!lifestyle.smoking_status &&
    !!lifestyle.alcohol_use &&
    (!isFemale ||
      (!!lifestyle.pregnancy_status &&
        (lifestyle.pregnancy_status !== "pregnant" ||
          (!!lifestyle.gestational_age && !!lifestyle.estimated_due_date))));

  const nextFromStep0 = (e) => {
    e.preventDefault();
    if (!form.gender) {
      setError("Please select your sex.");
      return;
    }
    setStep(1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const newCin = await generateUniqueCIN();
      const fullName = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ");
      const profile = await base44.entities.PatientProfile.create({
        user_id: user.id,
        cin: newCin,
        full_name: fullName,
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        phone: form.phone,
        address: form.address,
        blood_type: form.blood_type,
        identification_number: form.identification_number,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        emergency_contact_relationship: form.emergency_contact_relationship,
        smoking_status: lifestyle.smoking_status,
        alcohol_use: lifestyle.alcohol_use,
        substance_use: lifestyle.substance_use,
        pregnancy_status: isFemale ? lifestyle.pregnancy_status : "not_applicable",
        gestational_age: isFemale ? lifestyle.gestational_age : "",
        estimated_due_date: isFemale ? lifestyle.estimated_due_date : "",
        pregnancy_history: isFemale ? lifestyle.pregnancy_history : "",
      });
      const meta = { patient_id: profile.id, patient_cin: newCin, patient_name: fullName };
      const conditions = [
        ...medical.knownCases.map((c) => ({ ...meta, ...c, category: "known_case" })),
        ...medical.pastHistory.map((c) => ({ ...meta, ...c, category: "past_history" })),
      ];
      const creates = [];
      if (conditions.length) creates.push(base44.entities.MedicalCondition.bulkCreate(conditions));
      if (medical.allergies.length) {
        creates.push(base44.entities.Allergy.bulkCreate(medical.allergies.map((a) => ({ ...meta, ...a }))));
      }
      if (medical.medications.length) {
        creates.push(base44.entities.Medication.bulkCreate(medical.medications.map((m) => ({ ...meta, ...m }))));
      }
      if (medical.surgeries.length) {
        creates.push(base44.entities.SurgicalHistory.bulkCreate(medical.surgeries.map((s) => ({ ...meta, ...s }))));
      }
      if (creates.length) await Promise.all(creates);
      setCin(newCin);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while creating your profile. Please try again.");
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
                  <h2 className="text-xl font-bold">Patient Registration</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Step {step + 1} of 4 — {STEPS[step]}. Your answers become your locked medical history.
                  </p>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
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
                      <span className="hidden lg:inline">{label}</span>
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
                    <h3 className="text-sm font-semibold text-primary mb-3">Personal Information</h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="first_name">First name *</Label>
                        <Input id="first_name" value={form.first_name} onChange={set("first_name")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="middle_name">Middle name</Label>
                        <Input id="middle_name" value={form.middle_name} onChange={set("middle_name")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="last_name">Last name *</Label>
                        <Input id="last_name" value={form.last_name} onChange={set("last_name")} required />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="dob">Date of birth *</Label>
                        <Input id="dob" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Sex *</Label>
                        <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone number *</Label>
                        <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user?.email || ""} disabled />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-primary mb-3">Address</h3>
                    <div className="space-y-1.5">
                      <Label htmlFor="address">Address *</Label>
                      <Input id="address" placeholder="Street, city, country" value={form.address} onChange={set("address")} required />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-primary mb-3">Emergency Contact</h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="ec_name">Name *</Label>
                        <Input id="ec_name" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ec_phone">Phone *</Label>
                        <Input id="ec_phone" type="tel" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ec_rel">Relationship</Label>
                        <Input id="ec_rel" placeholder="e.g. Spouse, Parent" value={form.emergency_contact_relationship} onChange={set("emergency_contact_relationship")} />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-primary mb-3">Additional Information</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="id_number">Identification number *</Label>
                        <Input id="id_number" placeholder="National ID / passport number" value={form.identification_number} onChange={set("identification_number")} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Blood type</Label>
                        <Select value={form.blood_type} onValueChange={(v) => setForm((f) => ({ ...f, blood_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </section>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" size="lg">
                    Continue
                  </Button>
                </form>
              )}

              {step === 1 && (
                <div className="p-6 space-y-4">
                  <MedicalListSection
                    id="none_knownCases"
                    title="Known Case Of *"
                    description="Established chronic or previous medical conditions"
                    entries={medical.knownCases}
                    entryLabel={(c) => `${c.name}${c.date ? ` (${c.date})` : ""}`}
                    onRemove={removeEntry("knownCases")}
                    noneChecked={noneFlags.knownCases}
                    onNoneChange={toggleNone("knownCases")}
                    noneLabel="I have no known medical conditions"
                  >
                    <ConditionEntryForm onAdd={addEntry("knownCases")} />
                  </MedicalListSection>

                  <MedicalListSection
                    id="none_pastHistory"
                    title="Past Medical History *"
                    description="Previous diseases and important hospitalizations"
                    entries={medical.pastHistory}
                    entryLabel={(c) => `${c.name}${c.date ? ` (${c.date})` : ""}`}
                    onRemove={removeEntry("pastHistory")}
                    noneChecked={noneFlags.pastHistory}
                    onNoneChange={toggleNone("pastHistory")}
                    noneLabel="No past medical history"
                  >
                    <ConditionEntryForm onAdd={addEntry("pastHistory")} />
                  </MedicalListSection>

                  <MedicalListSection
                    id="none_allergies"
                    title="Allergies *"
                    description="Drug, food, or environmental allergies"
                    entries={medical.allergies}
                    entryLabel={(a) => `${a.allergen}${a.reaction ? ` — ${a.reaction}` : ""}`}
                    onRemove={removeEntry("allergies")}
                    noneChecked={noneFlags.allergies}
                    onNoneChange={toggleNone("allergies")}
                    noneLabel="I have no allergies"
                  >
                    <AllergyEntryForm onAdd={addEntry("allergies")} />
                  </MedicalListSection>

                  {!step1Valid && (
                    <p className="text-xs text-muted-foreground">
                      Answer each section — add entries or tick "None".
                    </p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="p-6 space-y-4">
                  <MedicalListSection
                    id="none_medications"
                    title="Current Medications *"
                    description="Medicines you currently take, with dose and frequency"
                    entries={medical.medications}
                    entryLabel={(m) => `${m.name}${m.dose ? ` · ${m.dose}` : ""}${m.frequency ? ` · ${m.frequency}` : ""}`}
                    onRemove={removeEntry("medications")}
                    noneChecked={noneFlags.medications}
                    onNoneChange={toggleNone("medications")}
                    noneLabel="I am not taking any medications"
                  >
                    <MedicationEntryForm onAdd={addEntry("medications")} />
                  </MedicalListSection>

                  <MedicalListSection
                    id="none_surgeries"
                    title="Past Surgical History *"
                    description="Every previous surgery or operation"
                    entries={medical.surgeries}
                    entryLabel={(s) => `${s.surgery_type}${s.surgery_date ? ` (${s.surgery_date})` : ""}`}
                    onRemove={removeEntry("surgeries")}
                    noneChecked={noneFlags.surgeries}
                    onNoneChange={toggleNone("surgeries")}
                    noneLabel="I never had surgery"
                  >
                    <SurgeryEntryForm onAdd={addEntry("surgeries")} />
                  </MedicalListSection>

                  {!step2Valid && (
                    <p className="text-xs text-muted-foreground">
                      Answer each section — add entries or tick "None".
                    </p>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="p-6 space-y-4">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold text-primary mb-3">Lifestyle *</h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>Smoking status *</Label>
                        <Select value={lifestyle.smoking_status} onValueChange={(v) => setLifestyle((s) => ({ ...s, smoking_status: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">Never smoked</SelectItem>
                            <SelectItem value="former">Former smoker</SelectItem>
                            <SelectItem value="current">Current smoker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Alcohol use *</Label>
                        <Select value={lifestyle.alcohol_use} onValueChange={(v) => setLifestyle((s) => ({ ...s, alcohol_use: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="occasional">Occasional</SelectItem>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="former">Former drinker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="substance">Other substance use</Label>
                        <Input id="substance" placeholder="None" value={lifestyle.substance_use} onChange={setL("substance_use")} />
                      </div>
                    </div>
                  </div>

                  {isFemale && (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <h3 className="text-sm font-semibold text-primary mb-3">Pregnancy *</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Pregnancy status *</Label>
                          <Select value={lifestyle.pregnancy_status} onValueChange={(v) => setLifestyle((s) => ({ ...s, pregnancy_status: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_applicable">Not applicable</SelectItem>
                              <SelectItem value="not_pregnant">Not pregnant</SelectItem>
                              <SelectItem value="pregnant">Pregnant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {lifestyle.pregnancy_status === "pregnant" && (
                          <>
                            <div className="space-y-1.5">
                              <Label htmlFor="gest">Gestational age *</Label>
                              <Input id="gest" placeholder="e.g. 18 weeks" value={lifestyle.gestational_age} onChange={setL("gestational_age")} />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="edd">Estimated due date *</Label>
                              <Input id="edd" type="date" value={lifestyle.estimated_due_date} onChange={setL("estimated_due_date")} />
                            </div>
                          </>
                        )}
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="preg_hist">Pregnancy history</Label>
                          <Input id="preg_hist" value={lifestyle.pregnancy_history} onChange={setL("pregnancy_history")} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step > 0 && (
                <div className="flex items-center justify-between p-6 pt-0">
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  {step < 3 ? (
                    <Button type="button" disabled={!stepValid} onClick={() => setStep(step + 1)}>
                      Next
                    </Button>
                  ) : (
                    <Button type="button" size="lg" disabled={!step3Valid || submitting} onClick={handleSubmit}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating your profile...
                        </>
                      ) : (
                        "Complete Registration"
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
              <h2 className="text-2xl font-bold mt-4">Registration Complete</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Your unique Clinical Identification Number has been generated.
              </p>
              <p className="text-3xl font-bold tracking-widest text-primary mt-6">{cin}</p>
              <div className="flex justify-center mt-6">
                <QrCodeCard cin={cin} size={180} />
              </div>
              <div className="text-left max-w-sm mx-auto mt-6 space-y-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Your CIN is permanent and can never be changed or duplicated.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Fingerprint className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>It contains no personal information (such as your date of birth) and doctors can search for you with it.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Your medical history has been saved to My Health and is locked. It can only be updated by an
                    authorized doctor or administrator.
                  </span>
                </div>
              </div>
              <Button className="mt-6 w-full max-w-xs" size="lg" onClick={onComplete}>
                Continue to My Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}