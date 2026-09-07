import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Lock, CheckCircle2 } from "lucide-react";

export default function PatientProfileEdit({ profile, onSaved }) {
  const [form, setForm] = useState({
    phone: "",
    address: "",
    blood_type: "Unknown",
    allergies: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    smoking_status: "never",
    alcohol_use: "none",
    substance_use: "",
    pregnancy_status: "not_applicable",
    gestational_age: "",
    estimated_due_date: "",
    pregnancy_history: "",
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
        smoking_status: profile.smoking_status || "never",
        alcohol_use: profile.alcohol_use || "none",
        substance_use: profile.substance_use || "",
        pregnancy_status: profile.pregnancy_status || "not_applicable",
        gestational_age: profile.gestational_age || "",
        estimated_due_date: profile.estimated_due_date || "",
        pregnancy_history: profile.pregnancy_history || "",
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
        <h3 className="font-semibold text-sm mb-4">Identity</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" /> CIN (permanent)
            </p>
            <p className="font-bold tracking-wider text-primary mt-1">{profile?.cin}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Full Name</p>
            <p className="font-semibold mt-1">{profile?.full_name}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Date of Birth</p>
            <p className="font-semibold mt-1">{profile?.date_of_birth || "—"}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Identification Number</p>
            <p className="font-semibold mt-1">{profile?.identification_number || "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">Contact & Medical Details</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="p_phone">Phone</Label>
            <Input id="p_phone" type="tel" value={form.phone} onChange={set("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label>Blood type</Label>
            <Select value={form.blood_type} onValueChange={(v) => { setForm((f) => ({ ...f, blood_type: v })); setSaved(false); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p_address">Address</Label>
            <Input id="p_address" value={form.address} onChange={set("address")} />
          </div>
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            Allergies are managed in My Health → Allergies.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">Emergency Contact</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="p_ec_name">Name</Label>
            <Input id="p_ec_name" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p_ec_phone">Phone</Label>
            <Input id="p_ec_phone" type="tel" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p_ec_rel">Relationship</Label>
            <Input id="p_ec_rel" value={form.emergency_contact_relationship} onChange={set("emergency_contact_relationship")} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">Lifestyle</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Smoking status</Label>
            <Select value={form.smoking_status} onValueChange={(v) => { setForm((f) => ({ ...f, smoking_status: v })); setSaved(false); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never smoked</SelectItem>
                <SelectItem value="former">Former smoker</SelectItem>
                <SelectItem value="current">Current smoker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Alcohol use</Label>
            <Select value={form.alcohol_use} onValueChange={(v) => { setForm((f) => ({ ...f, alcohol_use: v })); setSaved(false); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="occasional">Occasional</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="former">Former drinker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p_substance">Other substance use</Label>
            <Input id="p_substance" value={form.substance_use} onChange={set("substance_use")} />
          </div>
        </div>
      </div>

      {profile?.gender === "female" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4">Pregnancy</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pregnancy status</Label>
              <Select value={form.pregnancy_status} onValueChange={(v) => { setForm((f) => ({ ...f, pregnancy_status: v })); setSaved(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_applicable">Not applicable</SelectItem>
                  <SelectItem value="not_pregnant">Not pregnant</SelectItem>
                  <SelectItem value="pregnant">Pregnant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.pregnancy_status === "pregnant" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="p_gest">Gestational age</Label>
                  <Input id="p_gest" placeholder="e.g. 18 weeks" value={form.gestational_age} onChange={set("gestational_age")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p_edd">Estimated due date</Label>
                  <Input id="p_edd" type="date" value={form.estimated_due_date} onChange={set("estimated_due_date")} />
                </div>
              </>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p_preg_hist">Pregnancy history</Label>
              <Input id="p_preg_hist" value={form.pregnancy_history} onChange={set("pregnancy_history")} />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}