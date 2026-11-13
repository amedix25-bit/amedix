import React from "react";
import { SelectField, TextField, TextAreaField, DateInputField } from "./Fields";
import { CYCLE_REGULARITY, MENSTRUAL_FLOW, DYSMENORRHOEA, YES_NO_UNKNOWN } from "@/lib/gynaeObstetric";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Past menstrual history — LMP, menarche, regularity, cycle, flow, pain and
// abnormal bleeding. Every field may stay unanswered (saved as unknown).
export default function MenstrualHistoryFields({ value, onChange }) {
  const { t } = usePatientLanguage();
  const set = (patch) => onChange(patch);

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <DateInputField
          label="Last menstrual period (LMP)"
          value={value.lmp}
          onChange={(lmp) => set({ lmp })}
        />
        <TextField
          label="Age at menarche"
          value={value.age_at_menarche}
          onChange={(age_at_menarche) => set({ age_at_menarche })}
          placeholder="e.g. 12 years"
        />
        <SelectField
          label="Cycle regularity"
          value={value.cycle_regularity}
          onChange={(cycle_regularity) => set({ cycle_regularity })}
          options={CYCLE_REGULARITY}
        />
        <TextField
          label="Cycle length (days)"
          type="number"
          min={0}
          max={120}
          value={value.cycle_length}
          onChange={(cycle_length) => set({ cycle_length })}
        />
        <TextField
          label="Bleeding duration (days)"
          type="number"
          min={0}
          max={60}
          value={value.bleeding_duration}
          onChange={(bleeding_duration) => set({ bleeding_duration })}
        />
        <SelectField
          label="Menstrual flow"
          value={value.flow}
          onChange={(flow) => set({ flow })}
          options={MENSTRUAL_FLOW}
        />
        <SelectField
          label="Dysmenorrhoea (period pain)"
          value={value.dysmenorrhoea}
          onChange={(dysmenorrhoea) => set({ dysmenorrhoea })}
          options={DYSMENORRHOEA}
        />
        <SelectField
          label="Abnormal uterine bleeding"
          value={value.abnormal_uterine_bleeding}
          onChange={(abnormal_uterine_bleeding) => set({ abnormal_uterine_bleeding })}
          options={YES_NO_UNKNOWN}
        />
      </div>
      <TextAreaField
        label="Additional details about your periods"
        value={value.details}
        onChange={(details) => set({ details })}
        placeholder={t("Anything else your doctor should know about your periods")}
      />
    </div>
  );
}