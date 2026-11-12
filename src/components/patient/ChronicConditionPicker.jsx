import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PATIENT_ID_CONDITIONS } from "@/lib/patientIdConditions";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Lets a patient record one of the emergency-relevant chronic conditions on
// their Medical ID card. The entry is saved as their own reported condition —
// it is never presented as clinically verified.
export default function ChronicConditionPicker({ patientId, existing = [], open, onOpenChange, onAdded }) {
  const { t, lang } = usePatientLanguage();
  const [query, setQuery] = useState("");
  const [savingName, setSavingName] = useState("");
  const [error, setError] = useState("");

  const existingNames = useMemo(
    () => new Set(existing.map((c) => String(c.name || "").trim().toLowerCase())),
    [existing]
  );

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = PATIENT_ID_CONDITIONS.map((term) => ({
      ...term,
      label: lang === "ar" ? term.ar : term.en,
      secondary: lang === "ar" ? term.en : term.ar,
    }));
    if (!q) return list;
    return list.filter((term) => term.en.toLowerCase().includes(q) || term.ar.includes(q));
  }, [query, lang]);

  const add = async (term) => {
    if (savingName) return;
    setSavingName(term.en);
    setError("");
    try {
      await base44.functions.invoke("createClinicalRecord", {
        kind: "condition",
        patient_id: patientId,
        action: "create",
        record: { name: term.en, name_ar: term.ar },
      });
      await onAdded?.();
      onOpenChange(false);
      setQuery("");
    } catch (err) {
      setError(t("Could not save. Please try again."));
    } finally {
      setSavingName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Add a chronic condition")}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search conditions")}
            className="ps-9"
          />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-lg border border-border">
          {options.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t("No matching condition.")}</p>
          ) : (
            options.map((term) => {
              const added = existingNames.has(term.en.toLowerCase());
              const saving = savingName === term.en;
              return (
                <button
                  key={term.en}
                  type="button"
                  onClick={() => add(term)}
                  disabled={added || Boolean(savingName)}
                  className="w-full text-start px-3 py-2.5 hover:bg-accent disabled:opacity-60 flex items-center justify-between gap-3"
                >
                  <span>
                    <span className="block text-sm font-medium">{term.label}</span>
                    <span className="block text-xs text-muted-foreground" dir={lang === "ar" ? "ltr" : "rtl"}>
                      {term.secondary}
                    </span>
                  </span>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : added ? (
                    <Check className="w-4 h-4 text-success shrink-0" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}