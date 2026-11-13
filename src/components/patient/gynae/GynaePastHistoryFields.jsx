import React from "react";
import { Input } from "@/components/ui/input";
import { TextField, TextAreaField, CheckField } from "./Fields";
import { GYNAE_CONDITIONS } from "@/lib/gynaeObstetric";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Previous gynaecological diseases, infections, operations, treatments and
// investigations. Each selected condition can carry its own details.
export default function GynaePastHistoryFields({ value, onChange }) {
  const { t } = usePatientLanguage();
  const toggle = (key, checked) => {
    const conditions = checked
      ? [...(value.conditions || []), key]
      : (value.conditions || []).filter((c) => c !== key);
    const details = { ...(value.condition_details || {}) };
    if (!checked) delete details[key];
    onChange({ conditions, condition_details: details });
  };
  const setDetail = (key, text) =>
    onChange({ condition_details: { ...(value.condition_details || {}), [key]: text } });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t("Select any condition you have had, and add details where you can.")}
        </p>
        {GYNAE_CONDITIONS.map((condition) => {
          const checked = (value.conditions || []).includes(condition.key);
          return (
            <div key={condition.key} className="space-y-1.5">
              <CheckField
                id={`gynae_cond_${condition.key}`}
                label={condition.label}
                checked={checked}
                onChange={(next) => toggle(condition.key, next)}
              />
              {checked && (
                <Input
                  value={value.condition_details?.[condition.key] || ""}
                  onChange={(e) => setDetail(condition.key, e.target.value)}
                  placeholder={t("Details — when, treatment, outcome (optional)")}
                  className="ml-6 w-[calc(100%-1.5rem)]"
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <TextField
          label="Previous pelvic infections"
          value={value.infections}
          onChange={(infections) => onChange({ infections })}
          placeholder="e.g. Pelvic infection treated in 2019"
        />
        <TextField
          label="Previous gynaecological operations"
          value={value.surgeries}
          onChange={(surgeries) => onChange({ surgeries })}
          placeholder="e.g. Ovarian cyst removal, 2021"
        />
        <TextField
          label="Treatments received"
          value={value.treatments}
          onChange={(treatments) => onChange({ treatments })}
          placeholder="e.g. Hormonal treatment, physiotherapy"
        />
        <TextField
          label="Relevant investigations"
          value={value.investigations}
          onChange={(investigations) => onChange({ investigations })}
          placeholder="e.g. Ultrasound, cervical smear, biopsy"
        />
        <TextField
          label="Contraception history"
          value={value.contraception}
          onChange={(contraception) => onChange({ contraception })}
        />
        <TextField
          label="Fertility-related history"
          value={value.fertility}
          onChange={(fertility) => onChange({ fertility })}
        />
      </div>
      <TextAreaField
        label="Other gynaecological details"
        value={value.other_details}
        onChange={(other_details) => onChange({ other_details })}
      />
    </div>
  );
}