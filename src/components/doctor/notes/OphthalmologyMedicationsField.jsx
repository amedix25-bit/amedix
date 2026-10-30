import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import {
  OPHTH_MED_CLASSES,
  OPHTH_MED_EYES,
  OPHTH_MED_FREQUENCIES,
  OPHTH_MED_ROUTES,
  OPHTH_MONITORING_OPTIONS,
  buildOphthMedicationAlerts,
  emptyOphthMedication,
  emptyOphthMedicationValue,
} from "@/lib/ophthalmologyMedicationSafety";

const asValue = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : emptyOphthMedicationValue());

// The ocular medicines this note documents, each with the facts needed to
// review it: eye, concentration, route, frequency, duration and monitoring.
// The checks shown underneath are advisory and clinician-supervised — they never
// block a save and never change a regimen.
export default function OphthalmologyMedicationsField({ value, onChange }) {
  const v = asValue(value);
  const items = Array.isArray(v.items) ? v.items : [];
  const alerts = buildOphthMedicationAlerts(v);

  const patch = (next) => onChange({ ...emptyOphthMedicationValue(), ...v, ...next });
  const updateItem = (index, changes) => {
    const next = items.map((m, i) => (i === index ? { ...m, ...changes } : m));
    patch({ items: next });
  };
  const addItem = () => patch({ items: [...items, emptyOphthMedication()] });
  const removeItem = (index) => patch({ items: items.filter((_, i) => i !== index) });

  const toggleMonitoring = (index, option) => {
    const current = items[index].monitoring || [];
    const next = current.includes(option)
      ? current.filter((x) => x !== option)
      : [...current, option];
    updateItem(index, { monitoring: next });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">
          Allergies documented on this note
          <span className="text-muted-foreground font-normal"> · drug, preservative and class</span>
        </Label>
        <Textarea
          rows={2}
          value={v.allergies || ""}
          onChange={(e) => patch({ allergies: e.target.value })}
          placeholder="e.g. penicillin (rash); no known ocular allergy — or write 'not established' if unsure"
        />
      </div>

      {items.map((m, index) => (
        <div key={index} className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Medicine {index + 1}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Medicine</Label>
              <Input
                value={m.name || ""}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                placeholder="e.g. Dexamethasone 0.1%"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Class</Label>
              <Select value={m.drug_class || undefined} onValueChange={(val) => updateItem(index, { drug_class: val })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {OPHTH_MED_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Eye</Label>
              <Select value={m.eye || undefined} onValueChange={(val) => updateItem(index, { eye: val })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {OPHTH_MED_EYES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Concentration</Label>
              <Input
                value={m.concentration || ""}
                onChange={(e) => updateItem(index, { concentration: e.target.value })}
                placeholder="as printed on the product, e.g. 0.1%"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Route</Label>
              <Select value={m.route || undefined} onValueChange={(val) => updateItem(index, { route: val })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {OPHTH_MED_ROUTES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Frequency</Label>
              <Select value={m.frequency || undefined} onValueChange={(val) => updateItem(index, { frequency: val })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {OPHTH_MED_FREQUENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duration</Label>
              <Input
                value={m.duration || ""}
                onChange={(e) => updateItem(index, { duration: e.target.value })}
                placeholder="e.g. 14 days, or 'until review'"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Indication</Label>
              <Input
                value={m.indication || ""}
                onChange={(e) => updateItem(index, { indication: e.target.value })}
                placeholder="Why this medicine"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Monitoring recorded with this medicine</Label>
            <div className="flex flex-wrap gap-1.5">
              {OPHTH_MONITORING_OPTIONS.map((option) => {
                const active = (m.monitoring || []).includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleMonitoring(index, option)}
                    className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">What was documented about this medicine</Label>
            <Textarea
              rows={2}
              value={m.documented || ""}
              onChange={(e) => updateItem(index, { documented: e.target.value })}
              placeholder="e.g. tolerating, reduce to twice daily at review; allergy checked; adherence discussed"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="w-4 h-4 mr-1" />
        Add Medicine
      </Button>

      {alerts.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            Medication safety checks — advisory, the prescriber decides
          </p>
          {alerts.map((a) => (
            <div key={a.key} className="text-[11px] leading-relaxed">
              <p className="font-medium">{a.title}</p>
              <p className="text-muted-foreground">{a.action}</p>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs">Clinician review of these medicines</Label>
          <Textarea
            rows={2}
            value={v.review_note || ""}
            onChange={(e) => patch({ review_note: e.target.value })}
            placeholder="Record the review: allergies checked, laterality confirmed, contraindications considered, monitoring arranged — or why a check does not apply."
          />
        </div>
      )}
    </div>
  );
}