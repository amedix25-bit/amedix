import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Loader2, AlertTriangle, Clock, FileCheck2, ScanLine, Inbox, ShieldAlert, Activity,
} from "lucide-react";

// Radiology dashboard — every number is counted server-side inside the
// caller's facility scope. Nothing here is an estimate: a modality with no
// studies reads zero, and an unconfigured PACS says so.
const STATS = [
  { key: "total_studies", label: "Imaging studies", icon: ScanLine },
  { key: "pending_requests", label: "Pending requests", icon: Inbox },
  { key: "urgent_cases", label: "Urgent cases", icon: AlertTriangle, tone: "text-[hsl(var(--critical))]" },
  { key: "awaiting_interpretation", label: "Awaiting interpretation", icon: Clock, tone: "text-[hsl(var(--warning))]" },
  { key: "completed_reports", label: "Completed reports", icon: FileCheck2, tone: "text-[hsl(var(--success))]" },
  { key: "critical_findings", label: "Critical findings", icon: ShieldAlert, tone: "text-[hsl(var(--critical))]" },
];

export default function PortalDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("radiologyPortal", { action: "dashboard" });
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[hsl(var(--critical))]">{error}</p>;
  }

  const counts = data?.counts || {};
  const byModality = data?.by_modality || [];
  const maxModality = Math.max(1, ...byModality.map((m) => m.count));
  const recent = data?.recent_activity || [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {STATS.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${tone || "text-foreground"}`}>{counts[key] ?? 0}</p>
              </div>
              <Icon className={`w-5 h-5 ${tone || "text-muted-foreground"}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Studies by modality</h2>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {byModality.map((m) => (
              <div key={m.modality}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{m.modality}</span>
                  <span className="text-muted-foreground">{m.count}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-portal-radiology"
                    style={{ width: `${Math.round((m.count / maxModality) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              PACS: {data?.pacs?.connected || 0} connected · {data?.pacs?.configured || 0} configured
            </span>
            <Button size="sm" variant="outline" onClick={() => onNavigate("pacs")}>
              PACS Integration
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm mb-3">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No radiology activity recorded for this facility yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((entry) => (
                <li key={entry.id} className="text-xs">
                  <p className="font-medium">{entry.action_label}</p>
                  <p className="text-muted-foreground">
                    {entry.actor_name || "System"} · {new Date(entry.datetime).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onNavigate("requests")}>Open requests</Button>
            <Button size="sm" variant="outline" onClick={() => onNavigate("worklist")}>Open worklist</Button>
          </div>
        </div>
      </div>
    </div>
  );
}