import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SPECIALTIES } from "@/lib/specialties";

// Specialty selector shown next to the doctor's name. Existing accounts can
// change their specialty right here — the dropdown offers the complete
// predefined specialty catalog (plus any verified specialties already on the
// profile). Selecting a specialty immediately makes it the doctor's CURRENTLY
// ACTIVE specialty, which is the source of truth for the Clinical Note system:
// Create New Note automatically opens the template for this specialty. The
// doctor is never asked to pick the specialty again inside Clinical Note, and
// old notes keep the specialty they were created under.
export default function DoctorSpecialtySelect({ profile, onSelected }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const verified = (Array.isArray(profile.specialties) ? profile.specialties : []).filter(Boolean);
  const active = profile.specialization || "";
  const options = [...new Set([...SPECIALTIES, ...verified, active].filter(Boolean))];

  const makeActive = async (s) => {
    if (!s || s === active || saving) return;
    setSaving(true);
    setError(false);
    try {
      const specialties = [...new Set([...verified, s])];
      await base44.entities.DoctorProfile.update(profile.id, { specialization: s, specialties });
      onSelected({ ...profile, specialization: s, specialties });
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
          {options.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="text-xs text-destructive">Could not save — try again</span>}
    </span>
  );
}