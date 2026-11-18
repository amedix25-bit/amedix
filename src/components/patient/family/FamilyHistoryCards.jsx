import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { memberLabel, uniqueConditions } from "@/lib/familyHistory";
import { usePatientLanguage } from "@/lib/patientLanguage";

// One card per family member, listing only that relative's conditions — the
// records of different relatives are never combined.
export default function FamilyHistoryCards({ groups, isArabic, readOnly, onEdit, onRemove }) {
  const { t } = usePatientLanguage();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {groups.map((group) => (
        <div key={group.key} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className="min-w-0 text-sm font-semibold text-primary break-words">
              {memberLabel(group.relation, group.relation_label, isArabic)}
            </h4>
            {!readOnly && (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={t("Edit")}
                  onClick={() => onEdit(group)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label={t("Remove")}
                  onClick={() => onRemove(group)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <ul className="mt-2 space-y-1.5">
            {uniqueConditions(group.entries).map((c) => (
              <li key={c.en} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span className="min-w-0 break-words">
                  {isArabic && c.ar ? c.ar : c.en}
                  {c.record.age_at_diagnosis && (
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      · {t("Age at diagnosis")}: {c.record.age_at_diagnosis}
                    </span>
                  )}
                  {c.record.notes && (
                    <span className="block text-xs text-muted-foreground break-words">{c.record.notes}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}