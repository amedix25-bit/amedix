import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Inbox, UserCheck, PenLine, FileEdit, FileSignature, Siren, AlertTriangle, CheckCircle2, RefreshCw, Loader2, ShieldAlert,
} from "lucide-react";

// Radiologist dashboard cards (Phase 4.1) — every card shows a live count
// from the radiologist's authorized studies and opens the matching worklist.
const CARDS = [
  { key: "available", label: "Unclaimed Cases", icon: Inbox, tone: "text-purple-600 bg-purple-500/10" },
  { key: "mine", label: "Assigned to Me", icon: UserCheck, tone: "text-blue-600 bg-blue-500/10" },
  { key: "in_progress", label: "In Progress", icon: PenLine, tone: "text-blue-600 bg-blue-500/10" },
  { key: "drafts", label: "Draft Reports", icon: FileEdit, tone: "text-amber-600 bg-amber-500/10" },
  { key: "awaiting_signature", label: "Awaiting Signature", icon: FileSignature, tone: "text-indigo-600 bg-indigo-500/10" },
  { key: "urgent", label: "Urgent Awaiting Interpretation", icon: Siren, tone: "text-red-600 bg-red-500/10" },
  { key: "overdue", label: "Overdue", icon: AlertTriangle, tone: "text-red-700 bg-red-500/10" },
  { key: "critical", label: "Critical Awaiting Ack", icon: ShieldAlert, tone: "text-red-600 bg-red-100" },
  { key: "completed_today", label: "Completed Today", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-500/10" },
];

export default function RadiologistStudyBoard({ onOpenView }) {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await base44.functions.invoke("radiologyGetWorklist", { view: "mine" });
      setCounts(res.data.counts || {});
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
      setCounts({});
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (counts === null) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading your worklist summary...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">My Worklist</h2>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CARDS.map((card) => (
          <button
            key={card.key}
            onClick={() => onOpenView(card.key === "completed_today" ? "completed" : card.key, card.key === "completed_today")}
            className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.tone}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold mt-3">{counts[card.key] ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}