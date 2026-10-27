import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Plus, X, Activity } from "lucide-react";

// Vital Signs as clickable options: every vital is offered as a chip and the
// clinician adds only the ones measured — nothing is assumed and nothing is
// preselected. The value is saved as the readable summary string the note, the
// note view and the printed PDF already render ("Temperature: 37.2 °C · …"),
// so existing notes and every export keep working unchanged.
const VITALS = [
  { key: "temperature", label: "Temperature", unit: "°C", type: "number", step: "0.1", placeholder: "37.0" },
  { key: "pulse", label: "Pulse", unit: "bpm", type: "number", placeholder: "78" },
  { key: "respiratory_rate", label: "Respiratory Rate", unit: "breaths/min", type: "number", placeholder: "16" },
  { key: "blood_pressure", label: "Blood Pressure", unit: "mmHg", placeholder: "120/80" },
  { key: "spo2", label: "Oxygen Saturation (SpO₂)", unit: "%", type: "number", placeholder: "98" },
  { key: "map", label: "Mean Arterial Pressure", unit: "mmHg", type: "number", placeholder: "90" },
  { key: "pain_score", label: "Pain Score", unit: "/10", type: "number", placeholder: "0" },
  { key: "gcs", label: "Glasgow Coma Scale", unit: "/15", type: "number", placeholder: "15" },
  { key: "blood_glucose", label: "Blood Glucose", unit: "mmol/L", type: "number", step: "0.1", placeholder: "5.5" },
  { key: "weight", label: "Weight", unit: "kg", type: "number", step: "0.1", placeholder: "70" },
  { key: "height", label: "Height", unit: "cm", type: "number", placeholder: "170" },
  { key: "bmi", label: "BMI", unit: "kg/m²", type: "number", step: "0.1", placeholder: "24" },
  { key: "urine_output", label: "Urine Output", unit: "mL/hr", type: "number", placeholder: "60" },
];

const SEPARATOR = " · ";

// Splits the stored summary back into per-vital values. Text that does not
// match a known vital (an older free-text entry) is preserved as-is.
const parseVitals = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return { entries: {}, other: "" };
  const entries = {};
  const other = [];
  raw.split(SEPARATOR).forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const idx = trimmed.lastIndexOf(":");
    const label = idx > 0 ? trimmed.slice(0, idx).trim().toLowerCase() : "";
    const def = VITALS.find((v) => v.label.toLowerCase() === label);
    if (!def) {
      other.push(trimmed);
      return;
    }
    let val = trimmed.slice(idx + 1).trim();
    if (def.unit && val.endsWith(def.unit)) val = val.slice(0, -def.unit.length).trim();
    entries[def.key] = val;
  });
  return { entries, other: other.join(SEPARATOR) };
};

const composeVitals = (entries, other) => {
  const parts = VITALS.filter((v) => entries[v.key] !== undefined && entries[v.key] !== "").map(
    (v) => `${v.label}: ${entries[v.key]}${v.unit ? ` ${v.unit}` : ""}`
  );
  if (other.trim()) parts.push(other.trim());
  return parts.join(SEPARATOR);
};

export default function VitalSignsField({ value, onChange }) {
  const { entries, other } = parseVitals(value);
  // Vitals the clinician just clicked but has not typed a value into yet.
  const [opened, setOpened] = useState([]);
  const added = VITALS.filter((v) => entries[v.key] !== undefined || opened.includes(v.key));
  const available = VITALS.filter((v) => !added.includes(v));

  const addVital = (key) => setOpened((o) => (o.includes(key) ? o : [...o, key]));

  const setVital = (key, val) => {
    const next = { ...entries, [key]: val };
    onChange(composeVitals(next, other));
  };

  const removeVital = (key) => {
    const next = { ...entries };
    delete next[key];
    setOpened((o) => o.filter((k) => k !== key));
    onChange(composeVitals(next, other));
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
        <span className="text-sm font-medium inline-flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-primary" />
          Vital Signs
        </span>
        <span className="text-xs text-muted-foreground">
          {added.length > 0 ? `${added.length} recorded` : "Click to add"}
        </span>
      </div>

      <div className="p-3 space-y-3">
        {added.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {added.map((v) => (
              <div key={v.key} className="flex items-end gap-1.5">
                <div className="flex-1 space-y-1">
                  <p className="text-[11px] text-muted-foreground">
                    {v.label}
                    {v.unit ? ` (${v.unit})` : ""}
                  </p>
                  <Input
                    type={v.type || "text"}
                    step={v.step}
                    placeholder={v.placeholder || ""}
                    value={entries[v.key] || ""}                    onChange={(e) => setVital(v.key, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVital(v.key)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent"
                  aria-label={`Remove ${v.label}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {available.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {available.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setVital(v.key, "")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-border bg-card text-foreground hover:bg-accent transition-colors"
              >
                <Plus className="w-3 h-3" />
                {v.label}
              </button>
            ))}
          </div>
        )}

        {other && (
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground">Previously recorded entry</p>
            <Input
              value={other}
              onChange={(e) => onChange(composeVitals(entries, e.target.value))}
              className="h-8 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}