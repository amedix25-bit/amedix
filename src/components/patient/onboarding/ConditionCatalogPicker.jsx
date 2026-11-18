import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronDown, Plus, X } from "lucide-react";
import { CONDITION_SPECIALTIES, TOTAL_CONDITIONS, conditionKey, searchConditions } from "@/lib/conditionCatalog";
import { usePatientLanguage } from "@/lib/patientLanguage";

const STATUS = {
  current: { label: "Current", history_type: "existing_condition", current_status: "active" },
  historical: { label: "Historical", history_type: "previous_diagnosis", current_status: "resolved" },
};

// Patient-facing condition browser for registration: every specialty opens to
// its own searchable list, several conditions can be picked at once, and each
// pick is marked by the patient as current or historical. Nothing here is a
// diagnosis — it records what the patient reports, for a doctor to confirm.
export default function ConditionCatalogPicker({ open, onOpenChange, existing = [], onAdd }) {
  const { t, isArabic } = usePatientLanguage();
  const [query, setQuery] = useState("");
  const [openKeys, setOpenKeys] = useState([]);
  const [selected, setSelected] = useState({});
  const [otherText, setOtherText] = useState({});

  const existingNames = useMemo(
    () => new Set(existing.map((e) => String(e.name || "").toLowerCase())),
    [existing]
  );
  const results = useMemo(() => searchConditions(query), [query]);
  const picks = Object.values(selected);
  const label = (item) => (isArabic && item.ar ? item.ar : item.en);

  const reset = () => {
    setQuery("");
    setOpenKeys([]);
    setSelected({});
    setOtherText({});
  };

  const toggle = (specialty, condition) => {
    const key = conditionKey(specialty.key, condition.en);
    setSelected((s) => {
      const next = { ...s };
      if (next[key]) delete next[key];
      else {
        next[key] = {
          key,
          en: condition.en,
          ar: condition.ar,
          specialty_key: specialty.key,
          specialty_en: specialty.en,
          specialty_ar: specialty.ar,
          status: "current",
        };
      }
      return next;
    });
  };

  const addOther = (specialty) => {
    const name = (otherText[specialty.key] || "").trim();
    if (!name) return;
    const key = conditionKey(specialty.key, `other:${name.toLowerCase()}`);
    setSelected((s) => ({
      ...s,
      [key]: {
        key,
        en: name,
        ar: isArabic ? name : "",
        specialty_key: specialty.key,
        specialty_en: specialty.en,
        specialty_ar: specialty.ar,
        status: "current",
      },
    }));
    setOtherText((o) => ({ ...o, [specialty.key]: "" }));
  };

  const setStatus = (key, status) =>
    setSelected((s) => ({ ...s, [key]: { ...s[key], status } }));

  const save = () => {
    onAdd(
      picks.map((p) => ({
        name: p.en,
        ...(p.ar ? { name_ar: p.ar } : {}),
        history_type: STATUS[p.status].history_type,
        current_status: STATUS[p.status].current_status,
        date: "",
        treating_facility: "",
        details: "",
      }))
    );
    reset();
    onOpenChange(false);
  };

  const row = (specialty, condition) => {
    const key = conditionKey(specialty.key, condition.en);
    const checked = Boolean(selected[key]);
    const already = existingNames.has(condition.en.toLowerCase());
    return (
      <button
        key={key}
        type="button"
        onClick={() => toggle(specialty, condition)}
        aria-pressed={checked}
        className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-accent/60"
      >
        <Checkbox checked={checked} tabIndex={-1} className="pointer-events-none mt-0.5 shrink-0" />
        <span className="min-w-0 text-sm leading-snug">
          <span className="break-words">{isArabic && condition.ar ? condition.ar : condition.en}</span>
          {isArabic && condition.ar && (
            <span className="block text-[11px] text-muted-foreground break-words">{condition.en}</span>
          )}
          {already && (
            <span className="block text-[11px] text-muted-foreground">{t("Already added")}</span>
          )}
        </span>
      </button>
    );
  };

  const otherRow = (specialty) => (
    <div className="flex flex-col gap-2 rounded-lg bg-muted/60 p-2 sm:flex-row sm:items-center">
      <Input
        value={otherText[specialty.key] || ""}
        onChange={(e) => setOtherText((o) => ({ ...o, [specialty.key]: e.target.value }))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addOther(specialty);
          }
        }}
        placeholder={t("Other – please specify")}
        className="h-9 min-w-0 flex-1"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => addOther(specialty)}
        disabled={!(otherText[specialty.key] || "").trim()}
      >
        <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Add")}
      </Button>
    </div>
  );

  const specialtyBlock = (specialty) => {
    const expanded = openKeys.includes(specialty.key);
    const count = picks.filter((p) => p.specialty_key === specialty.key).length;
    return (
      <div key={specialty.key} className="overflow-hidden rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={() =>
            setOpenKeys((k) => (k.includes(specialty.key) ? k.filter((x) => x !== specialty.key) : [...k, specialty.key]))
          }
          className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold break-words">
              {isArabic && specialty.ar ? specialty.ar : specialty.en}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {specialty.conditions.length} {t("conditions")}
              {count > 0 && ` · ${count} ${t("selected")}`}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        {expanded && (
          <div className="border-t border-border p-1.5 space-y-0.5">
            {specialty.conditions.map((condition) => row(specialty, condition))}
            {otherRow(specialty)}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:p-0">
        <DialogHeader className="space-y-2 border-b border-border p-4 text-left sm:text-left">
          <DialogTitle className="text-base sm:text-lg">{t("Browse conditions by specialty")}</DialogTitle>
          <DialogDescription className="text-xs">
            {t("Select every condition that applies to you. You can search in Arabic or English, and mark each one as current or historical.")}{" "}
            <span className="whitespace-nowrap">
              {TOTAL_CONDITIONS} {t("conditions across")} {CONDITION_SPECIALTIES.length} {t("specialties")}.
            </span>
          </DialogDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search a disease or condition (Arabic or English)")}
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
          {query.trim() ? (
            results.length ? (
              <div className="space-y-1">
                {results.map(({ specialty, condition }) => (
                  <div key={`${specialty.key}-${condition.en}`}>
                    {row(specialty, condition)}
                    <p className="px-2 pb-1 text-[10px] text-muted-foreground">
                      {isArabic && specialty.ar ? specialty.ar : specialty.en}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {t("No matching condition. Choose the closest specialty and use “Other – please specify”.")}
              </p>
            )
          ) : (
            CONDITION_SPECIALTIES.map(specialtyBlock)
          )}
        </div>

        <div className="border-t border-border bg-card p-3">
          {picks.length > 0 && (
            <div className="mb-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {picks.map((p) => (
                <span
                  key={p.key}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[11px]"
                >
                  <span className="min-w-0 truncate">{label(p)}</span>
                  <button
                    type="button"
                    onClick={() => setStatus(p.key, p.status === "current" ? "historical" : "current")}
                    className={`shrink-0 rounded-full px-1.5 py-0.5 font-medium ${
                      p.status === "current" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {t(STATUS[p.status].label)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected((s) => { const n = { ...s }; delete n[p.key]; return n; })}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={t("Remove")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              {t("Tap the Current / Historical tag on a selected condition to change it.")}
            </p>
            <Button type="button" onClick={save} disabled={!picks.length} className="w-full sm:w-auto">
              {picks.length ? `${t("Add")} ${picks.length} ${t("conditions")}` : t("Add conditions")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}