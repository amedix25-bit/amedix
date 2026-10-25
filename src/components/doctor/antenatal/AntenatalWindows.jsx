import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, FlaskConical, GraduationCap, Image as ImageIcon, Loader2, ShieldCheck } from "lucide-react";

const WINDOW_CHIP = {
  due: "bg-blue-100 text-blue-800",
  approaching: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  awaiting_dating: "bg-muted text-muted-foreground",
  upcoming: "bg-muted text-muted-foreground",
  passed: "bg-green-50 text-green-800",
};
const WINDOW_LABEL = {
  due: "Due now", approaching: "Approaching", overdue: "Overdue — clinician review",
  awaiting_dating: "Awaiting dating", upcoming: "Upcoming", passed: "Complete",
};
const ITEM_CHIP = {
  completed: "bg-green-100 text-green-800",
  ordered: "bg-blue-100 text-blue-800",
  skipped: "bg-muted text-muted-foreground",
  due: "bg-blue-100 text-blue-800",
  approaching: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  upcoming: "bg-muted text-muted-foreground",
  awaiting_dating: "bg-muted text-muted-foreground",
};
const ITEM_LABEL = {
  completed: "Completed", ordered: "Ordered — awaiting results", skipped: "Not required",
  due: "Due now", approaching: "Approaching", overdue: "Overdue", upcoming: "Upcoming", awaiting_dating: "Awaiting dating",
};
const CATEGORY_ICON = { assessment: ClipboardList, screening: Activity, laboratory: FlaskConical, imaging: ImageIcon, education: GraduationCap, prevention: ShieldCheck };
const ACTIVE_STATES = ["due", "approaching", "overdue", "awaiting_dating"];

// The gestational-age-based screening timeline: one card per configured
// window, with each assessment / screening / laboratory / imaging /
// prevention / education item and its live status.
export default function AntenatalWindows({ schedule, onRecordItem, busyKey }) {
  return (
    <div className="space-y-3">
      {schedule.map((w) => (
        <WindowCard key={w.key} window={w} onRecordItem={onRecordItem} busyKey={busyKey} />
      ))}
    </div>
  );
}

function WindowCard({ window: w, onRecordItem, busyKey }) {
  const open = ACTIVE_STATES.includes(w.state);
  const [expanded, setExpanded] = useState(open);
  return (
    <div className={`rounded-xl border ${w.state === "overdue" ? "border-red-300" : "border-border"} bg-card overflow-hidden`}>
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-accent/50">
        {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        <span className="font-medium flex-1 min-w-0 truncate">{w.label}</span>
        {w.open_count > 0 && <span className="text-xs text-muted-foreground">{w.open_count} open</span>}
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${WINDOW_CHIP[w.state]}`}>{WINDOW_LABEL[w.state]}</span>
      </button>
      {expanded && (
        <div className="divide-y divide-border border-t border-border">
          {w.items.map((it) => (
            <ItemRow key={it.key} item={it} windowKey={w.key} onRecordItem={onRecordItem} busy={busyKey === it.key} />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, windowKey, onRecordItem, busy }) {
  const Icon = CATEGORY_ICON[item.category] || ClipboardList;
  const done = ["completed", "skipped", "ordered"].includes(item.state);
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm flex-1 min-w-[200px]">{item.label}{item.optional && <span className="text-xs text-muted-foreground"> (per protocol)</span>}</span>
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ITEM_CHIP[item.state]}`}>{ITEM_LABEL[item.state]}</span>
      {item.state === "ordered" && item.lab_link?.state === "awaiting_results" && <span className="text-xs text-muted-foreground">Lab request {item.lab_link.request_id}</span>}
      {item.state === "ordered" && item.img_link?.state === "awaiting_results" && <span className="text-xs text-muted-foreground">Imaging request {item.img_link.request_id}</span>}
      {!done && !busy && ACTIVE_STATES.includes(item.state) && (
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onRecordItem(item, windowKey, "completed")}>Done</Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onRecordItem(item, windowKey, "ordered")}>Ordered</Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onRecordItem(item, windowKey, "skipped")}>Not required</Button>
        </div>
      )}
      {busy && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      {item.state === "completed" && item.record?.recorded_by_name && (
        <span className="text-xs text-muted-foreground w-full sm:w-auto">{item.record.recorded_by_name} · {new Date(item.record.recorded_datetime).toLocaleDateString()}</span>
      )}
    </div>
  );
}