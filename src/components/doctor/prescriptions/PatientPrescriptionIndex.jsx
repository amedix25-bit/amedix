import React, { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Pill, User } from "lucide-react";
import PrescriptionCard from "@/components/doctor/pharmacy/PrescriptionCard";

// Patient-indexed view of the doctor's prescriptions — one row per patient,
// opening into that patient's medication list.
export default function PatientPrescriptionIndex({ items, onIssued }) {
  const [selectedKey, setSelectedKey] = useState(null);

  const patients = useMemo(() => {
    const map = new Map();
    items.forEach((p) => {
      const key = p.patient_id || p.patient_name || p.id;
      const entry = map.get(key) || {
        key,
        name: p.patient_name || "Unnamed patient",
        cin: p.patient_cin || "",
        items: [],
      };
      entry.items.push(p);
      if (!entry.cin && p.patient_cin) entry.cin = p.patient_cin;
      map.set(key, entry);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const selected = patients.find((p) => p.key === selectedKey) || null;

  if (selected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedKey(null)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All patients
          </button>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="font-heading font-semibold text-sm">{selected.name}</p>
          <p className="text-xs text-muted-foreground">
            {selected.cin ? `CIN ${selected.cin} · ` : ""}
            {selected.items.length} prescription{selected.items.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="space-y-3">
          {selected.items.map((p) => (
            <PrescriptionCard key={p.id} prescription={p} onIssued={onIssued} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
      {patients.map((p) => (
        <button
          key={p.key}
          onClick={() => setSelectedKey(p.key)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors"
        >
          <span className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium truncate">{p.name}</span>
            <span className="block text-xs text-muted-foreground truncate">
              {p.cin ? `CIN ${p.cin} · ` : ""}
              {p.items.length} prescription{p.items.length > 1 ? "s" : ""}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Pill className="w-3.5 h-3.5" /> Drugs
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      ))}
    </div>
  );
}