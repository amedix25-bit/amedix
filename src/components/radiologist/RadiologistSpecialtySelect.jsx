import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SPECIALTIES } from "@/lib/specialties";

// Radiology sub-specialties plus the full medical specialty catalog — the
// selection becomes the CURRENTLY ACTIVE specialty shown throughout the portal.
const RADIOLOGY_SPECIALTIES = [
  "Diagnostic Radiology",
  "Interventional Radiology",
  "Neuroradiology",
  "Musculoskeletal Radiology",
  "Pediatric Radiology",
  "Breast Imaging",
  "Emergency Radiology",
  "Nuclear Medicine",
];

export default function RadiologistSpecialtySelect({ profile, onSelected }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const active = profile.specialization || "";
  const options = [...new Set([...SPECIALTIES, ...RADIOLOGY_SPECIALTIES, active].filter(Boolean))];

  const makeActive = async (s) => {
    if (!s || s === active || saving) return;
    setSaving(true);
    setError(false);
    try {
      await base44.entities.RadiologistProfile.update(profile.id, { specialization: s });
      onSelected({ ...profile, specialization: s });
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