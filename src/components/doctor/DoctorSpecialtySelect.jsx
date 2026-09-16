import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Specialty switcher shown next to the doctor's name. The doctor's verified
// specialties are stored on the profile — this control only switches the
// ACTIVE specialty between them (new ones are never added here). The active
// specialty drives the specialty-specific clinical documentation.
export default function DoctorSpecialtySelect({ profile, onSelected }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const verified = (Array.isArray(profile.specialties) && profile.specialties.length
    ? profile.specialties
    : [profile.specialization]
  ).filter(Boolean);
  const active = profile.specialization || "";

  const makeActive = async (s) => {
    if (!s || s === active || saving) return;
    setSaving(true);
    setError(false);
    try {
      await base44.entities.DoctorProfile.update(profile.id, { specialization: s, specialties: verified });
      onSelected({ ...profile, specialization: s, specialties: verified });
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      {!active && (
        <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
          — select your specialty:
        </span>
      )}
      <Select value={active || undefined} onValueChange={makeActive} disabled={saving}>
        <SelectTrigger
          className="h-7 w-auto gap-1 rounded-full text-xs px-3"
          title="Change your active specialty"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <SelectValue placeholder="Select specialty" />
        </SelectTrigger>
        <SelectContent>
          {verified.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="text-xs text-destructive">Could not save — try again</span>}
    </span>
  );
}