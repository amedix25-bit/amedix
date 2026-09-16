import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import BrandLogo from "@/components/BrandLogo";
import { SPECIALTIES } from "@/lib/specialties";
import { Loader2, Stethoscope } from "lucide-react";

// "Select Your Specialty" — shown at the doctor's first Doctor Portal entry
// after login, instead of the doctor manually typing a specialty. The
// selection is stored on the verified doctor profile and determines the
// specialty-specific clinical documentation (Surgeons get Surgical Records
// in place of Clinical Notes). All other Doctor Portal features are the
// same for every specialty.
export default function SpecialtySelection({ profile, onSelected }) {
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");

  const select = async (specialization) => {
    if (saving) return;
    setSaving(specialization);
    setError("");
    try {
      await base44.entities.DoctorProfile.update(profile.id, { specialization });
      onSelected({ ...profile, specialization });
    } catch (err) {
      console.error(err);
      setError("Could not save your specialty. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <BrandLogo className="w-16 h-16 rounded-2xl mb-6" />
      <h1 className="text-2xl sm:text-3xl font-bold text-center">Select Your Specialty</h1>
      <p className="text-muted-foreground text-sm text-center mt-3 max-w-md">
        Welcome, Dr. {(profile?.full_name || "").replace(/^Dr\.?\s*/i, "").trim() || "Doctor"}. Choose your
        specialty from the list — it is saved to your verified doctor profile and personalizes your clinical
        documentation. All standard Doctor Portal features remain the same.
      </p>
      {error && <p className="text-sm text-destructive mt-3">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-8 w-full max-w-4xl">
        {SPECIALTIES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => select(s)}
            disabled={!!saving}
            className="rounded-xl border border-border bg-card p-4 text-center font-medium text-sm hover:border-primary/50 hover:bg-accent/50 transition-colors disabled:opacity-60"
          >
            {saving === s ? (
              <Loader2 className="w-4 h-4 mx-auto animate-spin" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                <span>{s}</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}