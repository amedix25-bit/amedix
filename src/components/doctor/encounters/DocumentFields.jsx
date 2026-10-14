import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMERGENCY_WORKFLOW } from "@/lib/specialtyDocuments";
import { ArrowRight } from "lucide-react";
import MedicalDictationButton from "@/components/doctor/dictation/MedicalDictationButton";

// Renders the structured fields of a specialty clinical document type
// (single-line inputs, numbers, multi-line notes and fixed-option selects),
// plus the emergency workflow strip for Emergency Medicine documents.
export function EmergencyWorkflowStrip() {
  return (
    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Emergency Workflow</p>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {EMERGENCY_WORKFLOW.map((stage, i) => (
          <span key={stage} className="flex items-center gap-1.5">
            <span className="px-2 py-1 rounded-md bg-card border border-border font-medium">{stage}</span>
            {i < EMERGENCY_WORKFLOW.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DocumentFields({ defs = [], values = {}, onChange, specialty = "" }) {
  return (
    <div className="space-y-4">
      {defs.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label>{f.label}</Label>
          {f.type === "textarea" && (
            <>
              <Textarea rows={2} value={values[f.key] ?? ""} onChange={(e) => onChange(f.key, e.target.value)} />
              <MedicalDictationButton
                value={values[f.key] ?? ""}
                onChange={(v) => onChange(f.key, v)}
                specialty={specialty}
                contextLabel={f.label}
              />
            </>
          )}
          {f.type === "input" && (
            <>
              <Input value={values[f.key] ?? ""} onChange={(e) => onChange(f.key, e.target.value)} />
              <MedicalDictationButton
                value={values[f.key] ?? ""}
                onChange={(v) => onChange(f.key, v)}
                specialty={specialty}
                contextLabel={f.label}
              />
            </>
          )}
          {f.type === "number" && (
            <Input type="number" value={values[f.key] ?? ""} onChange={(e) => onChange(f.key, e.target.value)} />
          )}
          {f.type === "select" && (
            <Select value={values[f.key] || undefined} onValueChange={(v) => onChange(f.key, v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  );
}