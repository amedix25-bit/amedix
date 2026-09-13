import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  { key: "temperature", label: "Temperature", unit: "°C", type: "number", step: "0.1", min: 30, max: 45 },
  { key: "pulse", label: "Pulse", unit: "bpm", type: "number", min: 20, max: 250 },
  { key: "respiratory_rate", label: "Respiratory Rate", unit: "breaths/min", type: "number", min: 5, max: 80 },
  { key: "blood_pressure", label: "Blood Pressure", unit: "mmHg", placeholder: "120/80" },
  { key: "spo2", label: "Oxygen Saturation (SpO₂)", unit: "%", type: "number", min: 50, max: 100 },
];

// Structured Vital Signs inputs for the Clinical Note form. Values are kept as
// strings and composed into the note's vital_signs summary on save.
export default function VitalSignsForm({ value = {}, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label className="text-xs">
            {f.label}
            {f.unit ? <span className="text-muted-foreground"> ({f.unit})</span> : null}
          </Label>
          <Input
            type={f.type || "text"}
            min={f.min}
            max={f.max}
            step={f.step}
            placeholder={f.placeholder || ""}
            value={value[f.key] || ""}
            onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}