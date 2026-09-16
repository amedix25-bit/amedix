import React from "react";
import { Stethoscope, Loader2, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Always-visible specialty section on the Doctor Portal Overview page. It
// shows the CURRENTLY ACTIVE specialty and lets the doctor switch between
// their own verified specialties. The active specialty immediately controls
// the specialty-specific clinical documentation (Clinical Note templates,
// encounters and new clinical documents) — previous notes and documents
// keep the specialty they were created under.
export default function ActiveSpecialtyCard({ profile, onUpdated }) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(false);

  const verified = (Array.isArray(profile?.specialties) && profile.specialties.length
    ? profile.specialties
    : [profile?.specialization]
  ).filter(Boolean);
  const active = profile?.specialization || "";

  const switchTo = async (s) => {
    if (!s || s === active || saving) return;
    setSaving(true);
    setError(false);
    try {
      await base44.entities.DoctorProfile.update(profile.id, { specialization: s, specialties: verified });
      if (onUpdated) onUpdated({ ...profile, specialization: s, specialties: verified });
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Specialty</p>
            <p className="text-sm">
              Currently Active Specialty: <span className="font-semibold">{active || "—"}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your active specialty automatically loads its clinical note templates for every new encounter and document.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-destructive">Could not save — try again</span>}
          <Select value={active || undefined} onValueChange={switchTo} disabled={saving}>
            <SelectTrigger className="w-44" title="Switch between your verified specialties">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4 text-muted-foreground" />}
              <SelectValue placeholder="Switch Specialty" />
              <ChevronDown className="w-4 h-4 opacity-50" />
            </SelectTrigger>
            <SelectContent>
              {verified.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}