import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Lock, CheckCircle2 } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientProfileEdit({ profile, onSaved }) {
  const { t } = usePatientLanguage();
  const [form, setForm] = useState({
    phone: "",
    address: "",
    blood_type: "Unknown",
    allergies: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        phone: profile.phone || "",
        address: profile.address || "",
        blood_type: profile.blood_type || "Unknown",
        allergies: profile.allergies || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
        emergency_contact_relationship: profile.emergency_contact_relationship || "",
      });
    }
  }, [profile]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.PatientProfile.update(profile.id, form);
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
        <h3 className="font-semibold text-sm mb-4">{t("Contact & Medical Details")}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="p_phone">{t("Phone")}</Label>
            <Input id="p_phone" type="tel" value={form.phone} onChange={set("phone")} />
          </div>
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
          <div className="space-y-1.5 sm:col-span-2">
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
        <h3 className="font-semibold text-sm mb-4">{t("Emergency Contact")}</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="p_ec_name">{t("Name")}</Label>
            <Input id="p_ec_name" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p_ec_phone">{t("Phone")}</Label>
            <Input id="p_ec_phone" type="tel" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p_ec_rel">{t("Relationship")}</Label>
            <Input id="p_ec_rel" value={form.emergency_contact_relationship} onChange={set("emergency_contact_relationship")} />
          </div>
        </div>
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