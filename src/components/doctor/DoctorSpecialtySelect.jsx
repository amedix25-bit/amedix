import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { SPECIALTIES } from "@/lib/specialties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Compact specialty picker shown next to the doctor's name in the Doctor
// Portal header — used by accounts that were created before specialty
// selection was introduced, so they pick their specialty from the predefined
// list without leaving the portal. Saved to the verified doctor profile.
export default function DoctorSpecialtySelect({ profile, onSelected }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const select = async (specialization) => {
    if (saving) return;
    setSaving(true);
    setError(false);
    try {
      await base44.entities.DoctorProfile.update(profile.id, { specialization });
      onSelected({ ...profile, specialization });
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      {!profile.specialization && (
        <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">— select your specialty:</span>
      )}
      <Select value={profile.specialization || undefined} onValueChange={select} disabled={saving}>
        <SelectTrigger className="h-7 w-56 text-xs border-amber-300 dark:border-amber-700">
          <SelectValue placeholder="Select specialty" />
        </SelectTrigger>
        <SelectContent>
          {SPECIALTIES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      {error && <span className="text-xs text-destructive">Could not save — try again</span>}
    </span>
  );
}