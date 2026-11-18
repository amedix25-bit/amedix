import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import {
  PROCEDURE_STATUS_LABELS,
  PROCEDURE_SPECIALTIES as SPECIALTIES,
  searchProcedures,
  groupBySpecialty,
  procedureLabel,
  procedureApproachText,
} from "@/lib/surgicalProcedures";

// Searchable surgical procedure picker over the AMedix catalogue — grouped by
// specialty, searchable in Arabic and English, with an "Other – specify"
// fallback so an unlisted operation can always be recorded. Selecting a
// procedure reports it back; the caller decides single or multiple selection.
export default function ProcedurePicker({ onPick, placeholder, status, disabled }) {
  const { t, isArabic } = usePatientLanguage();
  const lang = isArabic ? "ar" : "en";
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [open, setOpen] = useState(false);

  const groups = useMemo(
    () => groupBySpecialty(searchProcedures(query, { specialty, limit: 60 })),
    [query, specialty]
  );
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const statusLabel = status ? PROCEDURE_STATUS_LABELS[status]?.[lang] : "";

  const pick = (procedure) => {
    onPick(procedure);
    setQuery("");
    setOpen(false);
  };

  const pickCustom = () => {
    const text = query.trim();
    if (!text) return;
    pick({ name: text, nameAr: "", code: "", specialty: "", specialtyAr: "", approaches: [], custom: true });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder || t("Search a surgical procedure (Arabic or English)")}
            className="pl-9 rtl:pl-3 rtl:pr-9"
          />
        </div>
        <Select value={specialty} onValueChange={(v) => { setSpecialty(v); setOpen(true); }}>
          <SelectTrigger className="w-full sm:w-56 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">{t("All specialties")}</SelectItem>
            {SPECIALTIES.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {isArabic ? s.ar : s.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {open && (
        <div className="rounded-lg border border-border bg-card shadow-sm max-h-72 overflow-y-auto">
          {statusLabel && (
            <p className="px-3 py-2 text-xs text-muted-foreground border-b border-border">{statusLabel}</p>
          )}
          {total === 0 ? (
            <div className="p-3 space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("No matching procedure. Choose the closest specialty or use “Other – specify”.")}
              </p>
              {query.trim() && (
                <button
                  type="button"
                  onClick={pickCustom}
                  className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-left hover:bg-accent"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  {t("Other – specify the procedure")}: <span className="font-medium truncate">{query.trim()}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {groups.map((group) => (
                <div key={group.key}>
                  <p className="sticky top-0 bg-muted/80 backdrop-blur px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {isArabic ? group.ar : group.en}
                  </p>
                  {group.items.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pick(p)}
                      className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                    >
                      <p className="text-sm font-medium">{procedureLabel(p, lang)}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[p.code, p.category, procedureApproachText(p, lang)].filter(Boolean).join(" · ")}
                      </p>
                    </button>
                  ))}
                </div>
              ))}
              {query.trim() && (
                <button
                  type="button"
                  onClick={pickCustom}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  {t("Other – specify the procedure")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}