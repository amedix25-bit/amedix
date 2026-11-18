import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import FamilyDiseasePicker from "./FamilyDiseasePicker";
import { memberLabel, memberKeyOf, memberOptions } from "@/lib/familyHistory";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Step 1 — which family member has a condition; step 2 — every condition that
// member has. Nothing is saved until the member's conditions are confirmed, so
// conditions never end up attached to the wrong relative.
export default function FamilyMemberDialog({ open, onOpenChange, initial, existingKeys, isArabic, onSave, busy, error }) {
  const { t } = usePatientLanguage();
  const [step, setStep] = useState(1);
  const [relation, setRelation] = useState("");
  const [relationLabel, setRelationLabel] = useState("");
  const [conditions, setConditions] = useState([]);

  useEffect(() => {
    if (!open) return;
    setStep(initial ? 2 : 1);
    setRelation(initial?.relation || "");
    setRelationLabel(initial?.relation_label || "");
    setConditions(initial?.conditions || []);
  }, [open, initial]);

  const options = useMemo(() => memberOptions(initial?.relation || relation), [initial?.relation, relation]);
  const needsLabel = relation === "other";
  const memberValid = Boolean(relation) && (!needsLabel || relationLabel.trim() !== "");
  const canSave = memberValid && conditions.length > 0 && !busy;
  const alreadyExists =
    !initial && memberValid && existingKeys?.has(memberKeyOf({ relation, relation_label: relationLabel }));

  const save = () => {
    if (!canSave) return;
    onSave({
      relation,
      relation_label: needsLabel ? relationLabel.trim() : "",
      conditions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:p-0">
        <DialogHeader className="space-y-2 border-b border-border p-4 text-left sm:text-left">
          <DialogTitle className="text-base sm:text-lg">
            {step === 1
              ? t("Which family member has a medical condition?")
              : t("What diseases or medical conditions does this family member have?")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 1
              ? t("Select the family member first, then choose every condition they have. You can add as many family members as you need.")
              : t("Select one or more conditions for this family member. You can search in Arabic or English.")}
          </DialogDescription>
          {step === 2 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                {memberLabel(relation, relationLabel, isArabic)}
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-primary underline underline-offset-2"
              >
                {t("Change family member")}
              </button>
            </div>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          {step === 1 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {options.map((option) => {
                  const active = relation === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setRelation(option.value);
                        if (option.value !== "other") setRelationLabel("");
                      }}
                      aria-pressed={active}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-accent/60"
                      }`}
                    >
                      <span className="break-words">{isArabic ? option.ar : option.en}</span>
                    </button>
                  );
                })}
              </div>
              {needsLabel && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("Please specify the relationship")}</Label>
                  <Input
                    value={relationLabel}
                    onChange={(e) => setRelationLabel(e.target.value)}
                    placeholder={t("e.g. Cousin")}
                  />
                </div>
              )}
            </div>
          ) : (
            <FamilyDiseasePicker conditions={conditions} onChange={setConditions} isArabic={isArabic} />
          )}
        </div>

        <div className="border-t border-border bg-card p-3">
          {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
          {step === 2 && conditions.length === 0 && (
            <p className="mb-2 text-xs text-muted-foreground">{t("Select at least one condition.")}</p>
          )}
          {alreadyExists && (
            <p className="mb-2 text-xs text-muted-foreground">
              {t("This family member already has a card — the new conditions are added to it.")}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={busy || step === 1}>
              {t("Back")}
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                {t("Cancel")}
              </Button>
              {step === 1 ? (
                <Button type="button" onClick={() => setStep(2)} disabled={!memberValid}>
                  {t("Continue")}
                </Button>
              ) : (
                <Button type="button" onClick={save} disabled={!canSave}>
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("Save family member")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}