import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAGE_LABELS, canonicalStage } from "@/lib/radiologyWorkflow";
import { Loader2, BarChart3, AlertTriangle } from "lucide-react";

const fmt = (v, unit) => (v === null || v === undefined ? "—" : `${v}${unit || ""}`);

// Department analytics — database-derived operational metrics with date-range
// filtering, split examination vs reporting turnaround, and workload
// distribution with modality/priority context.
export default function DepartmentAnalytics() {
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("radiologyDepartmentAnalytics", { date_from: dateFrom, date_to: dateTo });
      setData(res.data);
    } catch (err) {
      toast({
        title: "Could not load the analytics",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const Bar = ({ label, value, max, chip }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${chip || "bg-primary"}`} style={{ width: `${max > 0 ? Math.round((value / max) * 100) : 0}%` }} />
      </div>
    </div>
  );

  const metrics = data ? [
    { label: "Requests Received", value: data.requests_received },
    { label: "Examinations Completed", value: data.examinations_completed },
    { label: "Reports Finalized", value: data.reports_finalized },
    { label: "Awaiting Interpretation", value: data.awaiting_interpretation },
    { label: "Overdue Studies (now)", value: data.overdue_studies, warn: data.overdue_studies > 0 },
    { label: "Median Request → Examination", value: fmt(data.median_hours_request_to_examination, " h") },
    { label: "Median Images → Final Report", value: fmt(data.median_hours_images_to_report, " h") },
  ] : [];

  const modalityEntries = data ? Object.entries(data.workload_by_modality || {}).sort((a, b) => b[1] - a[1]) : [];
  const statusEntries = data ? Object.entries(data.workload_by_reporting_status || {}).sort((a, b) => b[1] - a[1]) : [];
  const priorityEntries = data ? Object.entries(data.workload_by_priority || {}) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-1" />}
          Load Analytics
        </Button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className={`rounded-xl border p-4 ${m.warn ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className={`text-2xl font-bold mt-1 flex items-center gap-1 ${m.warn ? "text-destructive" : ""}`}>
                  {m.warn && <AlertTriangle className="w-4 h-4" />}
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-sm font-semibold">Workload by Modality</p>
              {modalityEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No requests in this range.</p>
              ) : (
                <div className="space-y-2">
                  {modalityEntries.map(([k, v]) => (
                    <Bar key={k} label={k} value={v} max={modalityEntries[0][1]} />
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-sm font-semibold">Workload by Reporting Status</p>
              {statusEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No requests in this range.</p>
              ) : (
                <div className="space-y-2">
                  {statusEntries.map(([k, v]) => (
                    <Bar key={k} label={STAGE_LABELS[canonicalStage(k)] || k} value={v} max={statusEntries[0][1]} chip="bg-purple-500/60" />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold">Workload by Radiologist</p>
            <p className="text-xs text-muted-foreground">{data.workload_context}</p>
            {(data.workload_by_radiologist || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No assigned studies in this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="text-left py-2 font-medium">Radiologist</th>
                      <th className="text-right py-2 font-medium">Assigned</th>
                      <th className="text-right py-2 font-medium">Finalized</th>
                      <th className="text-right py-2 font-medium">Median h to finalize</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workload_by_radiologist.map((r) => (
                      <tr key={r.radiologist} className="border-b border-border last:border-0">
                        <td className="py-2">{r.radiologist}</td>
                        <td className="py-2 text-right">{r.assigned}</td>
                        <td className="py-2 text-right">{r.finalized}</td>
                        <td className="py-2 text-right">{fmt(r.median_hours_to_finalize)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {priorityEntries.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold mb-2">Requests by Priority</p>
              <div className="flex flex-wrap gap-2">
                {priorityEntries.map(([k, v]) => (
                  <span key={k} className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {k}: {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}