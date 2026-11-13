import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectField, TextField, TextAreaField } from "./Fields";
import {
  PREGNANCY_OUTCOMES,
  DELIVERY_MODES,
  NEONATAL_OUTCOMES,
  isDeliveryOutcome,
  labelFor,
} from "@/lib/gynaeObstetric";
import { usePatientLanguage } from "@/lib/patientLanguage";

const emptyEntry = () => ({
  year: "",
  outcome: "",
  gestational_age: "",
  mode_of_delivery: "",
  complications: "",
  delivery_complications: "",
  neonatal_outcome: "",
  neonatal_details: "",
  notes: "",
});

// One previous pregnancy. A pregnancy is stored once and never merged into
// another — adding a new pregnancy never overwrites an existing entry.
export default function ObstetricEntryDialog({ open, onOpenChange, entry, onSave }) {
  const { t } = usePatientLanguage();
  const [form, setForm] = useState(emptyEntry);

  useEffect(() => {
    if (open) setForm({ ...emptyEntry(), ...(entry || {}) });
  }, [open, entry]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isDelivery = isDeliveryOutcome(form.outcome);

  const save = () => {
    onSave({ ...form, entry_id: form.entry_id || `preg_${Date.now()}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {entry ? t("Edit previous pregnancy") : t("Add a previous pregnancy")}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto space-y-3 pr-1">
          <div className="grid sm:grid-cols-2 gap-3">
            <TextField
              label="Year"
              value={form.year}
              onChange={(year) => set({ year })}
              placeholder="e.g. 2021"
            />
            <SelectField
              label="Outcome"
              value={form.outcome}
              onChange={(outcome) =>
                set({ outcome, ...(isDeliveryOutcome(outcome) ? {} : { mode_of_delivery: "" }) })
              }
              options={PREGNANCY_OUTCOMES}
              required
            />
            <TextField
              label="Gestational age at delivery or loss"
              value={form.gestational_age}
              onChange={(gestational_age) => set({ gestational_age })}
              placeholder="e.g. 38 weeks"
            />
            {isDelivery && (
              <SelectField
                label="Mode of delivery"
                value={form.mode_of_delivery}
                onChange={(mode_of_delivery) => set({ mode_of_delivery })}
                options={DELIVERY_MODES}
              />
            )}
            <SelectField
              label="Neonatal outcome"
              value={form.neonatal_outcome}
              onChange={(neonatal_outcome) => set({ neonatal_outcome })}
              options={NEONATAL_OUTCOMES}
            />
          </div>
          <TextAreaField
            label="Pregnancy complications"
            value={form.complications}
            onChange={(complications) => set({ complications })}
            placeholder={t("e.g. Diabetes in pregnancy, high blood pressure")}
          />
          {isDelivery && (
            <TextAreaField
              label="Delivery complications"
              value={form.delivery_complications}
              onChange={(delivery_complications) => set({ delivery_complications })}
              placeholder={t("e.g. Prolonged labour, bleeding after delivery")}
            />
          )}
          <TextField
            label="Neonatal details"
            value={form.neonatal_details}
            onChange={(neonatal_details) => set({ neonatal_details })}
            placeholder={t("e.g. Birth weight, time in neonatal unit")}
          />
          <TextAreaField
            label="Notes"
            value={form.notes}
            onChange={(notes) => set({ notes })}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel")}
          </Button>
          <Button onClick={save} disabled={!form.outcome}>
            {t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const pregnancyEntryLabel = (entry, index, t) => {
  const parts = [
    entry.year,
    labelFor(PREGNANCY_OUTCOMES, entry.outcome),
    entry.gestational_age,
    labelFor(DELIVERY_MODES, entry.mode_of_delivery),
  ].filter(Boolean);
  return `${t("Pregnancy")} ${index + 1}${parts.length ? ` — ${parts.join(" · ")}` : ""}`;
};