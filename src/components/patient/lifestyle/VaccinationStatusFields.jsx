import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import DateField from "@/components/ui/date-field";
import { ChevronDown, ChevronUp } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { VACCINATION_STATUSES, VACCINES, VACCINE_RECEIVED } from "@/lib/lifestyleOptions";

const RECORDED = VACCINE_RECEIVED.map((o) => o.value);

// Vaccination history — a checklist instead of typing each vaccine by hand.
// Ticking a vaccine records that it was received (the answer can be changed to
// not received or unknown), with an optional date, dose count and free text.
// A vaccine left unticked is never recorded as "not received": the patient's
// answer and the absence of an answer stay different things.
export default function VaccinationStatusFields({ status = "", records = {}, onChange }) {
  const { t } = usePatientLanguage();
  const [expanded, setExpanded] = useState(() => Object.keys(records).length > 0);
  const answered = Object.keys(records).filter((k) => RECORDED.includes(records[k]?.received));

  const setRecords = (next) => onChange({ records: next });

  const patchRecord = (vaccine, patch) =>
    setRecords({ ...records, [vaccine]: { ...(records[vaccine] || {}), ...patch } });

  const removeRecord = (vaccine) => {
    const next = { ...records };
    delete next[vaccine];
    setRecords(next);
  };

  const toggleVaccine = (vaccine, checked) => {
    if (!checked) {
      removeRecord(vaccine);
      return;
    }
    // Ticking a box means "I received this vaccine"; the patient can still
    // switch the answer to not received or unknown.
    patchRecord(vaccine, { received: records[vaccine]?.received || "received" });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">{t("Overall vaccination status — select one")}</Label>
        <RadioGroup
          value={status}
          onValueChange={(value) => onChange({ status: value })}
          className="grid gap-2 mt-2"
        >
          {VACCINATION_STATUSES.map((option) => (
            <div key={option.value} className="flex items-center gap-3">
              <RadioGroupItem id={`vacc_status_${option.value}`} value={option.value} />
              <Label htmlFor={`vacc_status_${option.value}`} className="text-sm font-normal cursor-pointer">
                {t(option.label)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="rounded-lg border border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setExpanded((v) => !v)}
          className="w-full justify-between h-auto py-2.5 px-3 font-normal"
        >
          <span className="text-sm font-medium">
            {t("Vaccination checklist")}
            {answered.length > 0 ? (
              <span className="text-muted-foreground font-normal"> · {t("{count} selected", { count: answered.length })}</span>
            ) : null}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        {expanded && (
          <div className="px-3 pb-3 space-y-2">
            <p className="text-[11px] text-muted-foreground">
              {t("Tick the vaccines you have received. A vaccine you leave unticked is saved as not recorded — never as not received.")}
            </p>
            {VACCINES.map((vaccine) => {
              const record = records[vaccine.value] || {};
              const checked = RECORDED.includes(record.received);
              return (
                <div
                  key={vaccine.value}
                  className={`rounded-lg border p-3 ${checked ? "border-primary/40 bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`vacc_${vaccine.value}`}
                      checked={checked}
                      onCheckedChange={(v) => toggleVaccine(vaccine.value, v === true)}
                      className="h-5 w-5 mt-0.5"
                    />
                    <Label htmlFor={`vacc_${vaccine.value}`} className="text-sm font-normal cursor-pointer">
                      {t(vaccine.label)}
                    </Label>
                  </div>
                  {checked && (
                    <div className="mt-2 ps-8 space-y-2">
                      <Select
                        value={record.received || ""}
                        onValueChange={(value) => patchRecord(vaccine.value, { received: value })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t("Not recorded")} />
                        </SelectTrigger>
                        <SelectContent>
                          {VACCINE_RECEIVED.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{t(o.label)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {vaccine.value === "other" && (
                        <Input
                          value={record.other_label || ""}
                          onChange={(e) => patchRecord(vaccine.value, { other_label: e.target.value })}
                          placeholder={t("Name of the vaccine")}
                        />
                      )}
                      <div className="grid sm:grid-cols-2 gap-2">
                        <DateField
                          value={record.date || ""}
                          onChange={(date) => patchRecord(vaccine.value, { date })}
                          disableFuture
                          placeholder={t("Date (optional)")}
                        />
                        <Input
                          value={record.doses || ""}
                          onChange={(e) => patchRecord(vaccine.value, { doses: e.target.value })}
                          placeholder={t("Doses (optional)")}
                          inputMode="numeric"
                        />
                      </div>
                      <Input
                        value={record.notes || ""}
                        onChange={(e) => patchRecord(vaccine.value, { notes: e.target.value })}
                        placeholder={t("Notes (optional)")}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}