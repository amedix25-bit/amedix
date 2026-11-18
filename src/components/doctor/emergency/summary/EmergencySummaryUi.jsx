import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Shared presentation for the Emergency Patient Summary: explicit section
// statuses, provenance lines and one expandable card — identical treatment in
// every section so the doctor reads the same signals in the same place.

const STATUS_LABEL = {
  documented: ["Documented", "border-emerald-200 bg-emerald-50 text-emerald-800"],
  no_known_allergies: ["No known allergies", "border-emerald-300 bg-emerald-50 text-emerald-900"],
  confirmed_negative: ["Confirmed negative", "border-emerald-200 bg-emerald-50 text-emerald-800"],
  not_documented: ["Not documented", "border-border bg-muted text-muted-foreground"],
  not_assessed: ["Not assessed", "border-amber-200 bg-amber-50 text-amber-800"],
  unknown: ["Unknown", "border-amber-200 bg-amber-50 text-amber-800"],
  unable_to_obtain: ["Patient unable to provide", "border-amber-300 bg-amber-50 text-amber-900"],
  unverified: ["Unverified", "border-amber-200 bg-amber-50 text-amber-800"],
  outdated: ["Outdated", "border-orange-300 bg-orange-50 text-orange-900"],
  not_applicable: ["Not applicable", "border-border bg-muted text-muted-foreground"],
  pregnant: ["Pregnant", "border-red-300 bg-red-50 text-red-800"],
  not_pregnant_confirmed: ["Not pregnant — confirmed", "border-emerald-200 bg-emerald-50 text-emerald-800"],
  not_pregnancy_unspecified: ["Not pregnant (date not recorded)", "border-amber-200 bg-amber-50 text-amber-800"],
};

export function StatusChip({ status, className }) {
  const [label, tone] = STATUS_LABEL[status] || [String(status || "Not documented").replace(/_/g, " "), STATUS_LABEL.not_documented[1]];
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", tone, className)}>
      {label}
    </span>
  );
}

const VERIFICATION_LABEL = {
  clinician_documented: "Clinician documented",
  patient_reported: "Patient reported",
  prescribed_record: "Prescription record",
  documented: "Documented in AMedix",
  verified: "Verified",
  unverified: "Unverified",
  imported: "Imported",
};

export function formatStamp(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Source · date · verification — never omitted where the record has one.
export function Provenance({ item }) {
  const bits = [
    VERIFICATION_LABEL[item?.verification] || item?.source,
    item?.recorded_at || item?.at || item?.date || item?.last_updated ? formatStamp(item.recorded_at || item.at || item.date || item.last_updated) : "",
    item?.fhir ? `FHIR ${item.fhir}` : "",
  ].filter(Boolean);
  if (!bits.length) return null;
  return <p className="text-[11px] text-muted-foreground">{bits.join(" · ")}</p>;
}

export function Section({ title, status, meta, children, defaultOpen = false, tone = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-xl border border-border bg-card", tone)}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-heading text-sm font-semibold">{title}</span>
          {status ? <StatusChip status={status} /> : null}
          {meta ? <span className="text-[11px] text-muted-foreground">{meta}</span> : null}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-2 border-t border-border/70 px-4 py-3">{children}</div>}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function DataRow({ label, value, children }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border/60 py-1.5 text-sm last:border-0">
      <span className="min-w-0 break-words font-medium" dir="auto">
        {label}
      </span>
      <span className="text-xs text-muted-foreground" dir="auto">
        {children || value || "—"}
      </span>
    </div>
  );
}