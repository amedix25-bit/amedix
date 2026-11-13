import React from "react";
import { SelectField, TextField, DateInputField } from "./Fields";
import { CURRENT_PREGNANCY_OPTIONS, gpaText } from "@/lib/gynaeObstetric";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Current pregnancy status — asked of every female patient. An unanswered
// question is never saved as "not pregnant": the answer stays unknown.
export default function CurrentPregnancyFields({ value, onChange, obstetric }) {
  const { t } = usePatientLanguage();
  const pregnant = value.status === "pregnant";
  const summary = gpaText(obstetric);

  return (
    <div className="space-y-3">
      <SelectField
        label="Are you currently pregnant?"
        value={value.status}
        onChange={(status) => onChange({ status })}
        options={CURRENT_PREGNANCY_OPTIONS}
        required
      />
      {pregnant && (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <DateInputField
              label="Last menstrual period (LMP)"
              value={value.lmp}
              onChange={(lmp) => onChange({ lmp })}
            />
            <TextField
              label="Estimated gestational age"
              value={value.gestational_age}
              onChange={(gestational_age) => onChange({ gestational_age })}
              placeholder="e.g. 18 weeks"
            />
            <DateInputField
              label="Estimated due date"
              value={value.edd}
              onChange={(edd) => onChange({ edd })}
              disableFuture={false}
            />
          </div>
          {summary && (
            <p className="text-sm font-medium text-primary">
              {t("Pregnancy number")}: {summary}
            </p>
          )}
        </>
      )}
      {value.status === "not_pregnant" && (
        <p className="text-xs text-muted-foreground">
          {t("Recorded as Not pregnant.")}
        </p>
      )}
      {value.status === "unknown" && (
        <p className="text-xs text-muted-foreground">
          {t("Recorded as unknown — please confirm with your doctor at your next visit.")}
        </p>
      )}
    </div>
  );
}