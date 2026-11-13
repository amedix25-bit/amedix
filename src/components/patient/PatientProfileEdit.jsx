import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Lock, CheckCircle2, Pencil } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { OccupationsEditor, PhoneNumbersEditor, EmergencyContactsEditor } from "@/components/patient/profile/DemographicsEditors";
import DietNutritionFields from "@/components/patient/lifestyle/DietNutritionFields";
import SleepPatternFields from "@/components/patient/lifestyle/SleepPatternFields";
import LivingSituationFields from "@/components/patient/lifestyle/LivingSituationFields";
import VaccinationStatusFields from "@/components/patient/lifestyle/VaccinationStatusFields";
import { vaccinationMapToRecords, vaccinationRecordsToMap } from "@/lib/lifestyleOptions";
import { formatDateDisplay } from "@/lib/dateFormat";
import GynaeHistoryEditorDialog from "@/components/patient/gynae/GynaeHistoryEditorDialog";
import { normalizeGynaeHistory, hasAnyGynaeAnswer } from "@/lib/gynaeObstetric";

export default function PatientProfileEdit({ profile, onSaved }) {
  const { t } = usePatientLanguage();
  const [gynaeOpen, setGynaeOpen] = useState(false);
  const [form, setForm] = useState({
    address: "",
    blood_type: "Unknown",
    allergies: "",
    nationality: "",
    typical_diet: "",
    food_allergies_intolerances: "",
    sleep_pattern_other: "",
    sleep_concerns: "",
    living_situation: "",
  });
  const [dietTypes, setDietTypes] = useState([]);
  const [sleepPatterns, setSleepPatterns] = useState([]);
  const [livingType, setLivingType] = useState("");
  const [vaccStatus, setVaccStatus] = useState("");
  const [vaccRecords, setVaccRecords] = useState({});
  const [occupations, setOccupations] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        address: profile.address || "",
        blood_type: profile.blood_type || "Unknown",
        allergies: profile.allergies || "",
        nationality: profile.nationality || "",
        typical_diet: profile.typical_diet || "",
        food_allergies_intolerances: profile.food_allergies_intolerances || "",
        sleep_pattern_other: profile.sleep_pattern_other || "",
        sleep_concerns: profile.sleep_concerns || "",
        living_situation: profile.living_situation || "",
      });
      setDietTypes(profile.diet_types || []);
      setSleepPatterns(profile.sleep_patterns || []);
      setLivingType(profile.living_situation_type || "");
      setVaccStatus(profile.vaccination_status || "");
      setVaccRecords(vaccinationRecordsToMap(profile.vaccination_records));
      // Seed the multi-entry lists from the legacy single fields so existing
      // profiles upgrade automatically.
      setPhoneNumbers(
        profile.phone_numbers?.length
          ? profile.phone_numbers
          : profile.phone ? [{ label: "Primary", number: profile.phone }] : []
      );
      setEmergencyContacts(
        profile.emergency_contacts?.length
          ? profile.emergency_contacts
          : profile.emergency_contact_name
            ? [{
                name: profile.emergency_contact_name,
                relationship: profile.emergency_contact_relationship || "",
                phone: profile.emergency_contact_phone || "",
              }]
            : []
      );
      setOccupations(profile.occupations || []);
    }
  }, [profile]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSaved(false);
  };
  const touch = (setter) => (value) => {
    setter(value);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const phones = phoneNumbers.filter((p) => (p.number || "").trim());
      const contacts = emergencyContacts.filter((c) => (c.name || "").trim() || (c.phone || "").trim());
      const occs = occupations.map((o) => (o || "").trim()).filter(Boolean);
      await base44.entities.PatientProfile.update(profile.id, {
        address: form.address,
        blood_type: form.blood_type,
        allergies: form.allergies,
        nationality: form.nationality,
        occupations: occs,
        phone_numbers: phones,
        emergency_contacts: contacts,
        // Diet, sleep, living situation and vaccination answers stay
        // patient-editable — they are lifestyle information, not the locked
        // clinical history.
        diet_types: dietTypes,
        typical_diet: form.typical_diet,
        food_allergies_intolerances: form.food_allergies_intolerances,
        sleep_patterns: sleepPatterns,
        sleep_pattern_other: form.sleep_pattern_other,
        sleep_concerns: form.sleep_concerns,
        living_situation_type: livingType,
        living_situation: form.living_situation,
        vaccination_status: vaccStatus,
        vaccination_records: vaccinationMapToRecords(vaccRecords),
        // Keep the legacy single fields in sync so every existing view of the
        // patient's demographics stays up to date.
        phone: phones[0]?.number || "",
        emergency_contact_name: contacts[0]?.name || "",
        emergency_contact_phone: contacts[0]?.phone || "",
        emergency_contact_relationship: contacts[0]?.relationship || "",
      });
      setSaved(true);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">{t("Identity")}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" /> {t("CIN (permanent)")}
            </p>
            <p className="font-bold tracking-wider text-primary mt-1">{profile?.cin}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">{t("Full Name")}</p>
            <p className="font-semibold mt-1">{profile?.full_name}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">{t("Date of Birth")}</p>
            <p className="font-semibold mt-1">{profile?.date_of_birth ? formatDateDisplay(profile.date_of_birth) : "—"}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">{t("Identification Number")}</p>
            <p className="font-semibold mt-1">{profile?.identification_number || "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">{t("Demographics")}</h3>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="p_nationality">{t("Nationality")}</Label>
            <Input id="p_nationality" placeholder={t("Nationality, e.g. Libyan")} value={form.nationality} onChange={set("nationality")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Occupations")}</Label>
            <OccupationsEditor value={occupations} onChange={touch(setOccupations)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Phone Numbers")}</Label>
            <PhoneNumbersEditor value={phoneNumbers} onChange={touch(setPhoneNumbers)} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">{t("Contact & Medical Details")}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("Blood type")}</Label>
            <Select value={form.blood_type} onValueChange={(v) => { setForm((f) => ({ ...f, blood_type: v })); setSaved(false); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((bt) => (
                  <SelectItem key={bt} value={bt}>{bt === "Unknown" ? t("Unknown") : bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p_address">{t("Address")}</Label>
            <Input id="p_address" value={form.address} onChange={set("address")} />
          </div>
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            {t(
              "Your medical history (conditions, medications, allergies and surgeries) was recorded at registration and is locked. Contact your doctor or an administrator for any corrections. Your diet, sleep, living situation and vaccination answers can be updated here."
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">{t("Diet & Nutrition")}</h3>
        <DietNutritionFields
          dietTypes={dietTypes}
          dietOther={form.typical_diet}
          foodRestrictions={form.food_allergies_intolerances}
          onChange={(patch) => {
            if (patch.dietTypes !== undefined) setDietTypes(patch.dietTypes);
            if (patch.dietOther !== undefined) setForm((f) => ({ ...f, typical_diet: patch.dietOther }));
            if (patch.foodRestrictions !== undefined) {
              setForm((f) => ({ ...f, food_allergies_intolerances: patch.foodRestrictions }));
            }
            setSaved(false);
          }}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">{t("Sleep Pattern")}</h3>
        <SleepPatternFields
          patterns={sleepPatterns}
          other={form.sleep_pattern_other}
          concerns={form.sleep_concerns}
          onChange={(patch) => {
            if (patch.patterns !== undefined) setSleepPatterns(patch.patterns);
            if (patch.other !== undefined) setForm((f) => ({ ...f, sleep_pattern_other: patch.other }));
            if (patch.concerns !== undefined) setForm((f) => ({ ...f, sleep_concerns: patch.concerns }));
            setSaved(false);
          }}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">{t("Living Situation")}</h3>
        <LivingSituationFields
          type={livingType}
          details={form.living_situation}
          onChange={(patch) => {
            if (patch.type !== undefined) setLivingType(patch.type);
            if (patch.details !== undefined) setForm((f) => ({ ...f, living_situation: patch.details }));
            setSaved(false);
          }}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">{t("Vaccination Status")}</h3>
        <VaccinationStatusFields
          status={vaccStatus}
          records={vaccRecords}
          onChange={(patch) => {
            if (patch.status !== undefined) setVaccStatus(patch.status);
            if (patch.records !== undefined) setVaccRecords(patch.records);
            setSaved(false);
          }}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">{t("Emergency Contacts")}</h3>
        <EmergencyContactsEditor value={emergencyContacts} onChange={touch(setEmergencyContacts)} />
      </div>

      {profile?.gender === "female" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-1">
            {t("Gynaecological, Obstetric & Postmenopausal History")}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {hasAnyGynaeAnswer(profile?.gynae_obstetric_history) &&
            normalizeGynaeHistory(profile?.gynae_obstetric_history).updated_datetime
              ? `${t("Last updated")}: ${new Date(
                  normalizeGynaeHistory(profile.gynae_obstetric_history).updated_datetime
                ).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
              : t(
                  "Complete or update your gynaecological, obstetric and postmenopausal history. Your earlier answers are kept, every update is recorded, and it is shown to your treating doctors."
                )}
          </p>
          <Button variant="outline" size="sm" onClick={() => setGynaeOpen(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1" />
            {hasAnyGynaeAnswer(profile?.gynae_obstetric_history) ? t("Update") : t("Complete")}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {t("Save Changes")}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> {t("Saved")}
          </span>
        )}
      </div>

      <GynaeHistoryEditorDialog
        open={gynaeOpen}
        onOpenChange={setGynaeOpen}
        profile={profile}
        onSaved={() => onSaved?.()}
      />
    </div>
  );
}