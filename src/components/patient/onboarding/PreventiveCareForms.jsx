import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, X } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

export const IMMUNIZATION_KINDS = [
  { value: "vaccination", label: "Vaccination" },
  { value: "screening", label: "Screening test" },
  { value: "preventive_care", label: "Preventive care" },
];

export const immunizationKindLabel = (v, t) => {
  const item = IMMUNIZATION_KINDS.find((k) => k.value === v);
  return item ? t(item.label) : v;
};

export const CHRONIC_CARE_TYPES = [
  { value: "implanted_device", label: "Implanted medical device (e.g. pacemaker)" },
  { value: "prosthesis", label: "Prosthesis / surgical implant" },
  { value: "dialysis", label: "Dialysis" },
  { value: "home_oxygen", label: "Home oxygen / ongoing medical support" },
  { value: "mobility_aid", label: "Mobility aid" },
  { value: "sensory_assistance", label: "Hearing / visual assistance" },
  { value: "accessibility_requirement", label: "Communication / accessibility requirement" },
  { value: "care_plan", label: "Care plan for a chronic condition" },
  { value: "advance_directive", label: "Advance directive / care preferences" },
  { value: "other", label: "Other" },
];

export const chronicCareTypeLabel = (v, t) => {
  const item = CHRONIC_CARE_TYPES.find((c) => c.value === v);
  return item ? t(item.label) : v;
};

// Immunization / screening / preventive-care entry. Supporting documents
// (vaccination cards, screening reports) can be uploaded instead of entering
// every historical dose — the file is attached to the Vaccination Records
// documents section when registration completes.
export function ImmunizationEntryForm({ onAdd }) {
  const { t } = usePatientLanguage();
  const EMPTY = { kind: "vaccination", name: "", date: "", result_notes: "" };
  const [form, setForm] = useState(EMPTY);
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm(EMPTY);
  };
  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-[1fr_2fr_1fr] gap-2">
        <Select value={form.kind} onValueChange={(v) => setForm((s) => ({ ...s, kind: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {IMMUNIZATION_KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>{t(k.label)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder={`${t("e.g. Tetanus booster, Hepatitis B, Mammography")} *`} value={form.name} onChange={set("name")} />
        <Input placeholder={t("Approximate date, if known")} value={form.date} onChange={set("date")} />
      </div>
      <div className="grid sm:grid-cols-[3fr_auto] gap-2">
        <Input placeholder={t("Result / notes (optional)")} value={form.result_notes} onChange={set("result_notes")} />
        <Button type="button" variant="outline" onClick={add} disabled={!form.name.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Chronic care, devices and special needs entry.
export function ChronicCareEntryForm({ onAdd }) {
  const { t } = usePatientLanguage();
  const EMPTY = { item_type: "implanted_device", title: "", details: "" };
  const [form, setForm] = useState(EMPTY);
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const add = () => {
    onAdd(form);
    setForm(EMPTY);
  };
  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <Select value={form.item_type} onValueChange={(v) => setForm((s) => ({ ...s, item_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CHRONIC_CARE_TYPES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{t(c.label)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder={`${t("e.g. Pacemaker, Hearing aid")} *`} value={form.title} onChange={set("title")} />
      </div>
      <div className="grid sm:grid-cols-[3fr_auto] gap-2">
        <Input placeholder={t("Details (optional)")} value={form.details} onChange={set("details")} />
        <Button type="button" variant="outline" onClick={add} disabled={!form.title.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Upload button for a vaccination card or other supporting document.
// The file is uploaded immediately; the document record is created when
// registration completes (the patient profile must exist first).
export default function VaccinationDocumentUpload({ uploadedDocs, onUploaded, onRemove, uploading, onFile }) {
  const { t } = usePatientLanguage();
  const inputRef = useRef(null);
  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? (
          <span className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {t("Upload vaccination card or supporting document")}
      </Button>
      {uploadedDocs.map((d, i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
          <p className="text-sm truncate">{d.file_name}</p>
          <button type="button" onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}