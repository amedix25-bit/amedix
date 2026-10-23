import React from "react";
import { Building2 } from "lucide-react";

// Radiologist Portal — facility switcher. Shown only when the radiologist is
// authorized at more than one facility (home facility + administrator-granted
// memberships). The selection filters the worklist to one facility; cleared
// shows all authorized facilities.
export default function RadiologistFacilitySwitcher({ profile, value, onChange }) {
  const names = [];
  const legacy = String((profile && profile.hospital) || "").trim();
  if (legacy) names.push(legacy);
  const granted = (profile && profile.authorized_facilities) || [];
  for (const f of granted) {
    const n = String((f && f.hospital_name) || "").trim();
    if (n && !names.includes(n)) names.push(n);
  }
  if (names.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      {names.map((n) => (
        <button
          key={n}
          onClick={() => onChange(value === n ? "" : n)}
          className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
            value === n
              ? "bg-primary text-primary-foreground border-primary font-medium"
              : "bg-card border-border text-muted-foreground hover:bg-accent"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}