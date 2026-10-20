import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertTriangle } from "lucide-react";

const CARDS = [
  { key: "new_requests", label: "New Requests", filter: { status: "requested" }, chip: "bg-secondary text-secondary-foreground" },
  { key: "awaiting_review", label: "Awaiting Review", filter: { status: "under_review" }, chip: "bg-blue-500/15 text-blue-600" },
  { key: "scheduled_examinations", label: "Scheduled Examinations", filter: { status: "scheduled" }, chip: "bg-blue-500/15 text-blue-600" },
  { key: "in_progress", label: "Examinations In Progress", filter: { status: "in_progress" }, chip: "bg-teal-500/15 text-teal-600" },
  { key: "images_awaiting_transfer", label: "Images Awaiting Transfer", filter: { status: "images_awaiting_transfer" }, chip: "bg-amber-500/15 text-amber-600" },
  { key: "ready_for_reporting", label: "Ready for Reporting", filter: { status: "ready_for_reporting" }, chip: "bg-purple-500/15 text-purple-600" },
  { key: "reports_in_progress", label: "Reports In Progress", filter: { status: "reporting_in_progress" }, chip: "bg-purple-500/15 text-purple-600" },
  { key: "awaiting_finalization", label: "Awaiting Finalization", filter: {}, chip: "bg-purple-500/15 text-purple-600" },
  { key: "completed_reports", label: "Completed Reports", filter: { status: "final_report" }, chip: "bg-emerald-500/15 text-emerald-600" },
  { key: "urgent_emergency", label: "Urgent & Emergency", filter: { priority: "Urgent/Emergency" }, chip: "bg-red-500/10 text-red-600" },
  { key: "overdue", label: "Overdue Studies", filter: { overdue: true }, chip: "bg-red-500/10 text-red-600" },
];

// Department dashboard — accurate database-derived counts, each card opening
// the corresponding filtered worklist. No placeholder metrics.
export default function DepartmentDashboard({ onOpenWorklist }) {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke("radiologyDepartmentWorklist", { counts_only: true });
        setCounts(res.data.counts);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      }
    };
    load();
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Could not load the department dashboard</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!counts) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading department metrics...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Every card is derived live from the imaging request database — click a card to open its filtered worklist.
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {CARDS.map((card) => (
          <button
            key={card.key}
            onClick={() => onOpenWorklist(card.filter)}
            className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-shadow"
          >
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.chip}`}>{card.label}</span>
            <p className="text-3xl font-bold mt-3">{counts[card.key] ?? 0}</p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Requests Routed to This Department</p>
          <p className="text-2xl font-bold mt-1">{counts.total ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Cancelled Requests</p>
          <p className="text-2xl font-bold mt-1">{counts.cancelled ?? 0}</p>
        </div>
      </div>
    </div>
  );
}