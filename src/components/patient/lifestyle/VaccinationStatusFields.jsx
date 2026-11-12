import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import DateField from "@/components/ui/date-field";
import { ChevronDown, ChevronUp } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { VACCINATION_STATUSES, VACCINES, VACCINE_RECEIVED } from "@/lib/lifestyleOptions";

// Vaccination Status — one overall status (radio buttons) plus an expandable
// history. Each vaccine records whether it was received, with the date, doses
// and notes where known. A vaccine left blank is never recorded as "not
// received": unknown and missing information stay distinct from a negative
// answer.
export default function VaccinationStatusFields({ status = "", records = {}, onChange }) {
  const { t } = usePatientLanguage();
  const [expanded, setExpanded] = useState(() => Object.keys(records).length > 0);
  const answered = Object.keys(records).filter((k) => records[k]?.received);

  const patchRecord = (vaccine, patch) =>
    onChange({
      records: { ...records, [vaccine]: { ...(records[vaccine] || {}), ...patch } },
    });

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
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem id={`vacc_status_${option.value}`} value={option.value} />
              <Label htmlFor={`vacc_status_${option.value}`} className="text-sm font-normal">
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
            {t("Vaccination history")}
            {answered.length > 0 ? (
              <span className="text-muted-foreground font-normal"> · {t("{count} answered", { count: answered.length })}</span>
            ) : null}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        {expanded && (
          <div className="px-3 pb-3 space-y-3">
            <p className="text-[11px] text-muted-foreground">
              {t("Record only the vaccines you know about. Anything you leave unanswered is saved as not recorded — never as unvaccinated.")}
            </p>
            {VACCINES.map((vaccine) => {
              const record = records[vaccine.value] || {};
              return (
                <div key={vaccine.value} className="border-t border-border pt-2 first:border-0 first:pt-0">
                  <div className="grid sm:grid-cols-[1.4fr_1fr] gap-2 items-center">
                    <span className="text-sm font-medium">{t(vaccine.label)}</span>
                    <Select
                      value={record.received || ""}
                      onValueChange={(value) => patchRecord(vaccine.value, { received: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder={t("Not recorded")} />
                      </SelectTrigger>
                      <SelectContent>
                        {VACCINE_RECEIVED.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{t(option.label)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {record.received && (
                    <div className="grid sm:grid-cols-3 gap-2 mt-2">
                      {vaccine.value === "other" && (
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">{t("Vaccine name")}</Label>
                          <Input
                            value={record.other_label || ""}
                            onChange={(e) => patchRecord(vaccine.value, { other_label: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">{t("Date (if known)")}</Label>
                        <DateField
                          value={record.date || ""}
                          onChange={(value) => patchRecord(vaccine.value, { date: value })}
                          disableFuture
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">{t("Doses")}</Label>
                        <Input
                          value={record.doses || ""}
                          onChange={(e) => patchRecord(vaccine.value, { doses: e.target.value })}
                          placeholder={t("e.g. 3")}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">{t("Notes")}</Label>
                        <Input
                          value={record.notes || ""}
                          onChange={(e) => patchRecord(vaccine.value, { notes: e.target.value })}
                          placeholder={t("Optional")}
                        />
                      </div>
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