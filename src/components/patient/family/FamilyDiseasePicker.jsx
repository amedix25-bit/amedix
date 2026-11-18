import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronDown, Plus, X } from "lucide-react";
import { CONDITION_SPECIALTIES, searchConditions } from "@/lib/conditionCatalog";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Diseases of ONE family member. Every specialty opens to its own list, the
// search matches Arabic, English and alternative names, several conditions can
// be selected at once and "Other – specify" records a condition that is not in
// the catalogue. Only this member's conditions are touched.
export default function FamilyDiseasePicker({ conditions, onChange, isArabic }) {
  const { t } = usePatientLanguage();
  const [query, setQuery] = useState("");
  const [openKeys, setOpenKeys] = useState([]);
  const [otherText, setOtherText] = useState("");

  const selected = useMemo(() => new Set(conditions.map((c) => c.en.toLowerCase())), [conditions]);
  const results = useMemo(() => searchConditions(query), [query]);
  const label = (c) => (isArabic && c.ar ? c.ar : c.en);

  const toggle = (condition) => {
    const key = condition.en.toLowerCase();
    if (selected.has(key)) onChange(conditions.filter((c) => c.en.toLowerCase() !== key));
    else onChange([...conditions, { en: condition.en, ar: condition.ar || "" }]);
  };

  const addOther = () => {
    const name = otherText.trim();
    if (!name) return;
    if (!selected.has(name.toLowerCase())) {
      onChange([...conditions, { en: name, ar: isArabic ? name : "" }]);
    }
    setOtherText("");
  };

  const row = (specialty, condition) => {
    const key = `${specialty.key}-${condition.en}`;
    const checked = selected.has(condition.en.toLowerCase());
    return (
      <button
        key={key}
        type="button"
        onClick={() => toggle(condition)}
        aria-pressed={checked}
        className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-accent/60"
      >
        <Checkbox checked={checked} tabIndex={-1} className="pointer-events-none mt-0.5 shrink-0" />
        <span className="min-w-0 text-sm leading-snug">
          <span className="break-words">{isArabic && condition.ar ? condition.ar : condition.en}</span>
          {isArabic && condition.ar && (
            <span className="block text-[11px] text-muted-foreground break-words">{condition.en}</span>
          )}
        </span>
      </button>
    );
  };

  const specialtyBlock = (specialty) => {
    const expanded = openKeys.includes(specialty.key);
    const count = specialty.conditions.filter((c) => selected.has(c.en.toLowerCase())).length;
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
          <div className="space-y-0.5 border-t border-border p-1.5">
            {specialty.conditions.map((condition) => row(specialty, condition))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {conditions.length > 0 && (
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
          {conditions.map((c) => (
            <span
              key={c.en}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[11px]"
            >
              <span className="min-w-0 truncate">{label(c)}</span>
              <button
                type="button"
                onClick={() => toggle(c)}
                aria-label={t("Remove")}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search a disease or condition (Arabic or English)")}
          className="pl-9"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-2">
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

      <div className="flex flex-col gap-2 rounded-lg bg-muted/60 p-2 sm:flex-row sm:items-center">
        <Input
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOther();
            }
          }}
          placeholder={t("Other – specify the disease")}
          className="h-9 min-w-0 flex-1"
        />
        <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={addOther} disabled={!otherText.trim()}>
          <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
          {t("Add")}
        </Button>
      </div>
    </div>
  );
}