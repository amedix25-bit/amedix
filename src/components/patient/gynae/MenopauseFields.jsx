import React from "react";
import { SelectField, TextField, TextAreaField, DateInputField, CheckField } from "./Fields";
import {
  MENOPAUSE_STATUS_OPTIONS,
  MENOPAUSE_SYMPTOMS,
  YES_NO_UNKNOWN,
} from "@/lib/gynaeObstetric";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Menopause status and postmenopausal history, including surgical menopause
// recorded on its own (reason and age at surgery).
export default function MenopauseFields({ value, onChange, pregnant }) {
  const { t } = usePatientLanguage();
  const postmenopausal = value.status === "postmenopausal" && !pregnant;

  const toggleSymptom = (key, checked) => {
    const symptoms = checked
      ? [...(value.symptoms || []), key]
      : (value.symptoms || []).filter((s) => s !== key);
    onChange({ symptoms });
  };

  return (
    <div className="space-y-3">
      <SelectField
        label="Have you reached menopause?"
        value={pregnant ? "premenopausal" : value.status}
        onChange={(status) =>
          onChange({
            status,
            ...(status === "postmenopausal"
              ? {}
              : {
                  age_at_menopause: "",
                  year_of_menopause: "",
                  last_menstrual_period: "",
                  postmenopausal_bleeding: "",
                  symptoms: [],
                  hrt: "",
                  hrt_details: "",
                  osteoporosis: "",
                  fragility_fracture: "",
                  other_details: "",
                }),
            ...(status === "postmenopausal" ? {} : { surgical_menopause: "", surgical_menopause_reason: "", surgical_menopause_age: "" }),
          })
        }
        options={MENOPAUSE_STATUS_OPTIONS}
        required
        disabled={pregnant}
      />
      {pregnant && (
        <p className="text-xs text-muted-foreground">
          {t("Recorded as Premenopausal — a pregnant patient is never classified as postmenopausal.")}
        </p>
      )}
      {!pregnant && value.status === "premenopausal" && (
        <p className="text-xs text-muted-foreground">{t("Recorded as Premenopausal.")}</p>
      )}
      {!pregnant && value.status === "unknown" && (
        <p className="text-xs text-muted-foreground">
          {t("Recorded as unknown — please confirm with your doctor at your next visit.")}
        </p>
      )}

      {postmenopausal && (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <TextField
              label="Age at menopause"
              value={value.age_at_menopause}
              onChange={(age_at_menopause) => onChange({ age_at_menopause })}
              placeholder="e.g. 49 years"
            />
            <TextField
              label="Year of menopause"
              value={value.year_of_menopause}
              onChange={(year_of_menopause) => onChange({ year_of_menopause })}
              placeholder="e.g. 2019"
            />
            <DateInputField
              label="Date of last menstrual period"
              value={value.last_menstrual_period}
              onChange={(last_menstrual_period) => onChange({ last_menstrual_period })}
            />
            <SelectField
              label="Postmenopausal vaginal bleeding"
              value={value.postmenopausal_bleeding}
              onChange={(postmenopausal_bleeding) => onChange({ postmenopausal_bleeding })}
              options={YES_NO_UNKNOWN}
            />
            <SelectField
              label="Hormone replacement therapy (HRT)"
              value={value.hrt}
              onChange={(hrt) => onChange({ hrt })}
              options={YES_NO_UNKNOWN}
            />
            <TextField
              label="HRT details"
              value={value.hrt_details}
              onChange={(hrt_details) => onChange({ hrt_details })}
              placeholder="e.g. Type and duration"
            />
            <SelectField
              label="Osteoporosis"
              value={value.osteoporosis}
              onChange={(osteoporosis) => onChange({ osteoporosis })}
              options={YES_NO_UNKNOWN}
            />
            <SelectField
              label="Fragility fracture"
              value={value.fragility_fracture}
              onChange={(fragility_fracture) => onChange({ fragility_fracture })}
              options={YES_NO_UNKNOWN}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t("Menopausal symptoms")}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {MENOPAUSE_SYMPTOMS.map((symptom) => (
                <CheckField
                  key={symptom.key}
                  id={`meno_${symptom.key}`}
                  label={symptom.label}
                  checked={(value.symptoms || []).includes(symptom.key)}
                  onChange={(next) => toggleSymptom(symptom.key, next)}
                />
              ))}
            </div>
          </div>

          <TextAreaField
            label="Other postmenopausal conditions or treatments"
            value={value.other_details}
            onChange={(other_details) => onChange({ other_details })}
          />

          <div className="space-y-3 rounded-lg border border-border p-3">
            <SelectField
              label="Surgical menopause"
              value={value.surgical_menopause}
              onChange={(surgical_menopause) => onChange({ surgical_menopause })}
              options={YES_NO_UNKNOWN}
            />
            {value.surgical_menopause === "yes" && (
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField
                  label="Reason for surgery"
                  value={value.surgical_menopause_reason}
                  onChange={(surgical_menopause_reason) => onChange({ surgical_menopause_reason })}
                  placeholder="e.g. Hysterectomy with removal of both ovaries"
                />
                <TextField
                  label="Age at surgery"
                  value={value.surgical_menopause_age}
                  onChange={(surgical_menopause_age) => onChange({ surgical_menopause_age })}
                  placeholder="e.g. 42 years"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}