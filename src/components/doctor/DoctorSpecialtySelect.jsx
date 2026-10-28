import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ensureRadiologistProfile, RADIOLOGY_SPECIALTY } from "@/lib/radiologyAccess";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lock } from "lucide-react";
import { SPECIALTIES } from "@/lib/specialties";
import { canSwitchSpecialty } from "@/lib/specialtyLock";

// Specialty shown next to the doctor's name. The specialty is chosen at
// registration and is permanent: it determines which specialty portal and
// clinical documentation the doctor works in. Accounts listed in
// specialtyLock keep the dropdown and can switch; everyone else sees a locked
// badge. A legacy account with no specialty yet still gets the one-time pick.
export default function DoctorSpecialtySelect({ profile, onSelected }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const verified = (Array.isArray(profile.specialties) ? profile.specialties : []).filter(Boolean);
  const active = profile.specialization || "";
  const options = [...new Set([...SPECIALTIES, ...verified, active].filter(Boolean))];
  const locked = !!active && !canSwitchSpecialty(user);

  const makeActive = async (s) => {
    if (!s || s === active || saving) return;
    setSaving(true);
    setError(false);
    try {
      const specialties = [...new Set([...verified, s])];
      await base44.entities.DoctorProfile.update(profile.id, { specialization: s, specialties });
      if (s === RADIOLOGY_SPECIALTY) {
        // A doctor who chooses Radiology works in the Radiologist Portal —
        // the same portal dedicated radiologists use.
        await ensureRadiologistProfile({ ...profile, specialization: s }, user);
        onSelected({ ...profile, specialization: s, specialties });
        navigate("/radiologist");
        return;
      }
      onSelected({ ...profile, specialization: s, specialties });
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (locked) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground"
        title="Your specialty is set at registration and cannot be changed."
      >
        <Lock className="w-3 h-3 text-muted-foreground" />
        {active}
      </span>
    );
  }

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