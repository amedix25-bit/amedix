import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import ObstetricEntryDialog, { pregnancyEntryLabel } from "./ObstetricEntryDialog";
import { gpaText, obstetricTotalWarning } from "@/lib/gynaeObstetric";
import { usePatientLanguage } from "@/lib/patientLanguage";

// G (pregnancies) / P (births after 24 weeks) / A (abortions before 24 weeks),
// plus the detailed counters. Each pregnancy is entered once in the list below
// and is never merged with, or overwritten by, another pregnancy.
const COUNTERS = [
  { key: "gravida", label: "Number of pregnancies (Gravida)" },
  { key: "para", label: "Number of births after 24 weeks (Para)" },
  { key: "abortions", label: "Number of abortions (before 24 weeks)" },
  { key: "term_deliveries", label: "Term deliveries" },
  { key: "preterm_deliveries", label: "Preterm deliveries" },
  { key: "miscarriages", label: "Miscarriages" },
  { key: "induced_abortions", label: "Induced abortions" },
  { key: "ectopic_pregnancies", label: "Ectopic pregnancies" },
  { key: "stillbirths", label: "Stillbirths" },
  { key: "living_children", label: "Living children" },
];

export default function ObstetricHistoryFields({ value, onChange }) {
  const { t } = usePatientLanguage();
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const pregnancies = value.pregnancies || [];
  const warning = obstetricTotalWarning(value);

  const saveEntry = (entry) => {
    const next = [...pregnancies];
    if (editIndex === null) next.push(entry);
    else next[editIndex] = entry;
    onChange({ pregnancies: next });
    setEditIndex(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {t("Gravida counts every pregnancy. Para counts births from 24 weeks onwards. Abortions counts pregnancies that ended before 24 weeks. Each pregnancy is counted once.")}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COUNTERS.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label>{t(label)}</Label>
            <Select
              value={value[key] === "" || value[key] === undefined ? "" : String(value[key])}
              onValueChange={(next) => onChange({ [key]: next })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select")} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 16 }, (_, i) => String(i)).map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {gpaText(value) && (
        <p className="text-sm font-medium text-primary">{gpaText(value)}</p>
      )}
      {warning && <p className="text-xs text-destructive">{t(warning)}</p>}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{t("Previous pregnancies (details)")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditIndex(null);
              setOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> {t("Add")}
          </Button>
        </div>
        {pregnancies.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {t("No pregnancy details added yet.")}
          </p>
        )}
        {pregnancies.map((entry, index) => (
          <div key={entry.entry_id || index} className="flex items-start justify-between gap-3 rounded-lg bg-muted px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm">{pregnancyEntryLabel(entry, index, t)}</p>
              {entry.complications && <p className="text-xs text-muted-foreground">{entry.complications}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                aria-label={t("Edit")}
                onClick={() => {
                  setEditIndex(index);
                  setOpen(true);
                }}
                className="text-muted-foreground hover:text-primary"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label={t("Delete")}
                onClick={() => onChange({ pregnancies: pregnancies.filter((_, i) => i !== index) })}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {pregnancies.length > 0 && value.gravida !== "" && Number(value.gravida) < pregnancies.length && (
          <p className="text-xs text-destructive">
            {t("You entered more pregnancy details than the number of pregnancies.")}
          </p>
        )}
      </div>

      <ObstetricEntryDialog
        open={open}
        onOpenChange={setOpen}
        entry={editIndex === null ? null : pregnancies[editIndex]}
        onSave={saveEntry}
      />
    </div>
  );
}