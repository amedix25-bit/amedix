import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, ClipboardList, FlaskConical, GraduationCap, Image as ImageIcon, Loader2, ShieldCheck, Stethoscope } from "lucide-react";

const CATEGORY_ICON = { assessment: ClipboardList, screening: Activity, laboratory: FlaskConical, imaging: ImageIcon, education: GraduationCap, prevention: ShieldCheck };

// Status chips — color is never the only indicator: every chip carries a
// readable text label (AMedix design system: green reviewed/completed, blue
// upcoming/scheduled, yellow pending/routine attention, red abnormal/urgent,
// gray not indicated/inactive).
const CHIP = {
  completed: "bg-green-100 text-green-800",
  ordered: "bg-blue-100 text-blue-800",
  skipped: "bg-muted text-muted-foreground",
  sample_collected: "bg-blue-100 text-blue-800",
  pending_result: "bg-amber-100 text-amber-800",
  result_available: "bg-amber-100 text-amber-800",
  abnormal: "bg-red-100 text-red-800",
  inconclusive: "bg-red-100 text-red-800",
  followup_required: "bg-red-100 text-red-800",
  declined: "bg-muted text-muted-foreground",
  not_indicated: "bg-muted text-muted-foreground",
  due: "bg-blue-100 text-blue-800",
  approaching: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  upcoming: "bg-muted text-muted-foreground",
  awaiting_dating: "bg-muted text-muted-foreground",
};
const LABEL = {
  completed: "Completed", ordered: "Ordered", skipped: "Not required",
  sample_collected: "Sample collected", pending_result: "Pending result",
  result_available: "Result available — awaiting review", abnormal: "Abnormal — review required",
  inconclusive: "Inconclusive — review required", followup_required: "Follow-up required",
  declined: "Declined by patient", not_indicated: "Not indicated",
  due: "Due now", approaching: "Due soon", overdue: "Overdue", upcoming: "Not yet due", awaiting_dating: "Awaiting dating",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "due", label: "Due today", states: ["due", "awaiting_dating"] },
  { key: "approaching", label: "Due soon", states: ["approaching"] },
  { key: "overdue", label: "Overdue", states: ["overdue"] },
  { key: "pending", label: "Pending results", states: ["ordered", "sample_collected", "pending_result", "result_available"] },
  { key: "abnormal", label: "Abnormal / inconclusive", states: ["abnormal", "inconclusive", "followup_required"] },
  { key: "completed", label: "Completed", states: ["completed"] },
  { key: "not_needed", label: "Declined / not indicated", states: ["declined", "not_indicated"] },
];

// Screening status and follow-up tracker: every investigation with its
// structured status, gestational-age window, result details and review state.
export default function AntenatalTracker({ schedule, onRecordStatus, onReviewItem, busyKey }) {
  const [filter, setFilter] = useState("all");
  const items = useMemo(() => {
    const flat = [];
    (schedule || []).forEach((w) => (w.items || []).forEach((it) => flat.push({ ...it, windowKey: w.key, windowLabel: w.label })));
    return flat;
  }, [schedule]);

  const matches = (it) => {
    if (filter === "all") return true;
    if (filter === "abnormal") {
      return ["abnormal", "inconclusive", "followup_required"].includes(it.state) || (it.record && (it.record.outcome === "abnormal" || it.record.review_status === "awaiting_review"));
    }
    const f = FILTERS.find((x) => x.key === filter);
    return f && f.states && f.states.includes(it.state);
  };
  const filtered = items.filter(matches);
  const countFor = (key) => {
    if (key === "all") return items.length;
    const f = FILTERS.find((x) => x.key === key);
    if (!f || !f.states) return 0;
    return items.filter((it) => f.states.includes(it.state) || (key === "abnormal" && it.record && (it.record.outcome === "abnormal" || it.record.review_status === "awaiting_review"))).length;
  };

  return (
    <div className="rounded-xl border border-border p-4">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Stethoscope className="w-4 h-4" /> Screening status and follow-up tracker</h4>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${filter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-accent/50"}`}>
            {f.label} ({countFor(f.key)})
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">No investigations match this filter.</p>}
      <div className="space-y-1.5">
        {filtered.map((it) => <TrackerRow key={it.windowKey + it.key} item={it} onRecordStatus={onRecordStatus} onReviewItem={onReviewItem} busy={busyKey === it.key} />)}
      </div>
    </div>
  );
}

function TrackerRow({ item, onRecordStatus, onReviewItem, busy }) {
  const Icon = CATEGORY_ICON[item.category] || ClipboardList;
  const rec = item.record || null;
  const needsReview = rec && (rec.review_status === "awaiting_review" || (rec.outcome === "abnormal" && !rec.review_status));
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm flex-1 min-w-[180px]">{item.label}</span>
        <span className="text-xs text-muted-foreground">{item.windowLabel}</span>
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CHIP[item.state]}`}>{LABEL[item.state] || item.state}</span>
        {!item.record && ["due", "overdue", "approaching", "awaiting_dating"].includes(item.state) && (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={busy} onClick={() => onRecordStatus(item, item.windowKey)}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Record status"}
          </Button>
        )}
        {needsReview && (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-red-300 text-red-800 hover:bg-red-50" disabled={busy} onClick={() => onReviewItem(item, item.windowKey)}>
            Review finding
          </Button>
        )}
      </div>
      {rec && (
        <div className="mt-1.5 text-xs text-muted-foreground space-y-0.5">
          {rec.result_value && <p>Result: <span className="text-foreground">{rec.result_value}{rec.result_units ? ` ${rec.result_units}` : ""}</span>{rec.reference_range ? ` (reference: ${rec.reference_range})` : ""}</p>}
          {rec.interpretation && <p>Interpretation: {rec.interpretation}</p>}
          {rec.guideline_source && <p>Guideline: {rec.guideline_source}{rec.guideline_version ? ` (v${rec.guideline_version})` : ""}</p>}
          {rec.specimen_collection_datetime && <p>Specimen collected: {new Date(rec.specimen_collection_datetime).toLocaleDateString()}</p>}
          {rec.deferral_reason && <p>Reason: {rec.deferral_reason}</p>}
          {rec.review_status === "awaiting_review" && <p className="text-amber-800 font-medium">Clinical review outstanding — a missing result is never treated as negative.</p>}
          {rec.review_status === "reviewed" && (
            <p className="text-green-800">Reviewed by {rec.reviewing_clinician}{rec.review_datetime ? ` · ${new Date(rec.review_datetime).toLocaleDateString()}` : ""}{rec.followup_plan ? ` · Plan: ${rec.followup_plan}` : ""}{rec.responsible_clinician ? ` · Responsible: ${rec.responsible_clinician}` : ""}</p>
          )}
          {!rec.review_status && rec.followup_plan && <p>Plan: {rec.followup_plan}</p>}
        </div>
      )}
    </div>
  );
}