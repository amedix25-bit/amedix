import React from "react";
import { Building2 } from "lucide-react";

export default function LabProfileSection({ profile }) {
  const rows = [
    { label: "Laboratory Name", value: profile.lab_name },
    { label: "Company / Laboratory Number", value: profile.lab_number },
    { label: "Email", value: profile.email },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold">{profile.lab_name}</p>
          <p className="text-xs text-muted-foreground">Lab Portal account</p>
        </div>
      </div>
      <div className="divide-y divide-border border-t border-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-3">
            <span className="text-sm text-muted-foreground">{r.label}</span>
            <span className="text-sm font-medium text-right">{r.value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}