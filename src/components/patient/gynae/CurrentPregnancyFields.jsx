import React from "react";
import { SelectField, TextField, DateInputField } from "./Fields";
import { CURRENT_PREGNANCY_OPTIONS } from "@/lib/gynaeObstetric";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Current pregnancy status — always asked first. An unanswered question is never
// saved as "not pregnant": the answer stays unknown. The patient never enters a
// Gravida value: it is calculated from her pregnancies below.
export default function CurrentPregnancyFields({ value, onChange }) {
  const { t } = usePatientLanguage();
  const pregnant = value.status === "pregnant";

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
          <p className="text-xs text-muted-foreground">
            {t("Your previous pregnancies are recorded next, and Gravida is calculated for you.")}
          </p>
        </>
      )}
      {value.status === "not_pregnant" && (
        <p className="text-xs text-muted-foreground">
          {t("Recorded as Not pregnant. Your previous pregnancy outcomes are recorded next.")}
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