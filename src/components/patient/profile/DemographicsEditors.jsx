import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

export const PHONE_LABELS = ["Primary", "Secondary", "Work", "Other"];

// Editable list of occupations — each entry is editable inline and removable.
export function OccupationsEditor({ value = [], onChange }) {
  const { t } = usePatientLanguage();
  const update = (i, v) => onChange(value.map((o, idx) => (idx === i ? v : o)));
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, ""]);
  return (
    <div className="space-y-2">
      {value.map((occupation, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={occupation}
            placeholder={t("Occupation, e.g. Student, Physician")}
            onChange={(e) => update(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label={t("Remove")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Add Occupation")}
      </Button>
    </div>
  );
}

// Editable list of labeled phone numbers (Primary / Secondary / Work / Other).
export function PhoneNumbersEditor({ value = [], onChange }) {
  const { t } = usePatientLanguage();
  const update = (i, patch) => onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { label: "Primary", number: "" }]);
  return (
    <div className="space-y-2">
      {value.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={p.label} onValueChange={(v) => update(i, { label: v })}>
            <SelectTrigger className="w-36 shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PHONE_LABELS.map((l) => (
                <SelectItem key={l} value={l}>{t(l)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="tel" value={p.number} placeholder={t("Phone number")} onChange={(e) => update(i, { number: e.target.value })} />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label={t("Remove")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Add Phone Number")}
      </Button>
    </div>
  );
}

// Editable list of emergency contacts — each with their own name, relationship
// and phone number, editable or removable individually.
export function EmergencyContactsEditor({ value = [], onChange }) {
  const { t } = usePatientLanguage();
  const update = (i, patch) => onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { name: "", relationship: "", phone: "" }]);
  return (
    <div className="space-y-3">
      {value.map((c, i) => (
        <div key={i} className="rounded-lg border border-border p-3 grid sm:grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label>{t("Name")}</Label>
            <Input value={c.name} onChange={(e) => update(i, { name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Relationship")}</Label>
            <Input value={c.relationship} placeholder={t("e.g. Spouse, Parent")} onChange={(e) => update(i, { relationship: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Phone")}</Label>
            <div className="flex gap-2">
              <Input type="tel" value={c.phone} onChange={(e) => update(i, { phone: e.target.value })} />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-destructive shrink-0 self-center"
                aria-label={t("Remove")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Add Emergency Contact")}
      </Button>
    </div>
  );
}