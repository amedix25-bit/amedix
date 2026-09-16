import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X } from "lucide-react";

// Specialty manager shown next to the doctor's name — the doctor's verified
// specialties are stored on the profile. The active specialty is used by
// default; a doctor with more than one verified specialty picks the
// practicing specialty when opening each encounter, and that selection is
// saved to the encounter and all its documents.
export default function DoctorSpecialtySelect({ profile, onSelected }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const verified = (Array.isArray(profile.specialties) && profile.specialties.length
    ? profile.specialties
    : [profile.specialization]
  ).filter(Boolean);
  const active = profile.specialization || "";

  const save = async (specialization, specialties) => {
    if (saving) return;
    setSaving(true);
    setError(false);
    try {
      await base44.entities.DoctorProfile.update(profile.id, { specialization, specialties });
      onSelected({ ...profile, specialization, specialties });
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  // The doctor only switches BETWEEN their verified specialties — new ones
  // are never added from here.
  const makeActive = (s) => {
    if (s !== active) save(s, verified);
  };
  const removeSpecialty = (s) => {
    if (s === active) return;
    const next = verified.filter((v) => v !== s);
    if (next.length > 0) save(next[0], next);
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {!active && (
        <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
          — select your specialty:
        </span>
      )}
      {verified.map((s) => (
        <span
          key={s}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            s === active
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground border border-border"
          }`}
        >
          <button type="button" onClick={() => makeActive(s)} title={s === active ? "Active specialty" : "Make active specialty"}>
            {s}
          </button>
          {s !== active && (
            <button
              type="button"
              onClick={() => removeSpecialty(s)}
              aria-label={`Remove ${s}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
      {error && <span className="text-xs text-destructive">Could not save — try again</span>}
    </span>
  );
}