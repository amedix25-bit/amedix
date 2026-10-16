import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SPECIALTIES } from "@/lib/specialties";
import { RADIOLOGY_SPECIALTIES, isRadiologySpecialty } from "@/lib/radiologyAccess";

export default function RadiologistSpecialtySelect({ profile, onSelected }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const active = profile.specialization || "";
  const options = [...new Set([...SPECIALTIES, ...RADIOLOGY_SPECIALTIES, active].filter(Boolean))];

  const makeActive = async (s) => {
    if (!s || s === active || saving) return;
    setSaving(true);
    setError(false);
    try {
      if (isRadiologySpecialty(s)) {
        // Radiology sub-specialty — stays in the Radiologist Portal.
        await base44.entities.RadiologistProfile.update(profile.id, { specialization: s });
        onSelected({ ...profile, specialization: s });
      } else {
        // Any other specialty — open the regular Doctor Portal with that
        // specialty's clinical notes. The radiologist profile keeps its
        // radiology specialty for when they switch back.
        const doctorProfiles = await base44.entities.DoctorProfile.filter({ user_id: profile.user_id });
        if (doctorProfiles.length > 0) {
          await base44.entities.DoctorProfile.update(doctorProfiles[0].id, { specialization: s });
        } else {
          await base44.entities.DoctorProfile.create({
            user_id: profile.user_id,
            full_name: profile.full_name,
            specialization: s,
            license_number: profile.license_number || "",
            hospital: profile.hospital || "",
            phone: profile.phone || "",
            name_edited: true,
          });
        }
        navigate("/doctor");
      }
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