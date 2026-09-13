import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Lock, CheckCircle2 } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { OccupationsEditor, PhoneNumbersEditor, EmergencyContactsEditor } from "@/components/patient/profile/DemographicsEditors";

export default function PatientProfileEdit({ profile, onSaved }) {
  const { t } = usePatientLanguage();
  const [form, setForm] = useState({ address: "", blood_type: "Unknown", allergies: "", nationality: "" });
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
      });
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
            <p className="font-semibold mt-1">{profile?.date_of_birth || "—"}</p>
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
              "Your medical history (conditions, medications, allergies, surgeries, lifestyle) was recorded at registration and is locked. Contact your doctor or an administrator for any corrections."
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">{t("Emergency Contacts")}</h3>
        <EmergencyContactsEditor value={emergencyContacts} onChange={touch(setEmergencyContacts)} />
      </div>

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
    </div>
  );
}