import React from "react";
import { SelectField, TextField } from "./Fields";
import { CONTRACEPTION_METHODS, ORAL_CONTRACEPTION_TYPES } from "@/lib/gynaeObstetric";

// Contraception History of the female patient — one question, and the oral
// contraception type asked only when Oral contraception was chosen. The same
// controls are used at registration and whenever she completes or updates her
// history, so her saved answers come back exactly as she entered them.
export default function ContraceptionHistoryFields({ value = {}, onChange }) {
  const method = value.contraception_method || "";
  const oral = method === "oral";

  return (
    <div className="space-y-3">
      <SelectField
        label="What type of contraception are you currently using?"
        value={method}
        onChange={(next) =>
          onChange({
            contraception_method: next,
            contraception_oral_type: next === "oral" ? value.contraception_oral_type || "" : "",
            contraception_oral_other: next === "oral" ? value.contraception_oral_other || "" : "",
          })
        }
        options={CONTRACEPTION_METHODS}
      />
      {oral && (
        <>
          <SelectField
            label="Which type of oral contraception are you using?"
            value={value.contraception_oral_type || ""}
            onChange={(next) =>
              onChange({
                contraception_oral_type: next,
                contraception_oral_other: next === "other" ? value.contraception_oral_other || "" : "",
              })
            }
            options={ORAL_CONTRACEPTION_TYPES}
          />
          {value.contraception_oral_type === "other" && (
            <TextField
              label="Please specify"
              value={value.contraception_oral_other || ""}
              onChange={(contraception_oral_other) => onChange({ contraception_oral_other })}
              placeholder="The type of oral contraception you are using"
            />
          )}
        </>
      )}
    </div>
  );
}