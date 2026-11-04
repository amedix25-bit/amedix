import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ShieldCheck, PencilLine } from "lucide-react";

const TABS = [
  { key: "", label: "All reports" },
  { key: "pending", label: "Awaiting report" },
  { key: "finalized", label: "Finalized" },
];

const STATE_CHIP = {
  draft: "bg-secondary text-secondary-foreground",
  pending_verification: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
  finalized: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
};

const STATE_LABEL = {
  draft: "Draft",
  pending_verification: "Pending verification",
  finalized: "Finalized",
};

// Radiology Reports module — reports by state (draft, pending verification,
// finalized) with their version history and amendments. A report is never
// released before it is finalized and signed; interpretation itself happens in
// the radiologist reporting workspace that signs the version.
export default function ReportsModule({ role }) {
  const { toast } = useToast();
  const [tab, setTab] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(async (state) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("radiologyPortal", { action: "reports", state });
      setReports(res.data?.reports || []);
    } catch (err) {
      setReports([]);
      toast({ title: "Could not load reports", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(tab); }, [tab, load]);

  const openDetail = async (requestId) => {
    try {
      const res = await base44.functions.invoke("radiologyPortal", { action: "report_detail", request_id: requestId });
      setDetail(res.data);
    } catch (err) {
      toast({ title: "Could not open the report", description: err.response?.data?.error || err.message, variant: "destructive" });
    }
  };

  const release = async (requestId) => {
    setBusy(requestId);
    try {
      await base44.functions.invoke("radiologyUpdateWorkflowStatus", { request_id: requestId, action: "release" });
      toast({ title: "Report released", description: "It is now visible to the referring doctor and the patient." });
      load(tab);
      setDetail(null);
    } catch (err) {
      toast({ title: "Could not release the report", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setDetail(null); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              tab === t.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
            }`}
          >
            {t.label}
          </button>
        ))}
        <Link to="/radiologist" className="ml-auto text-xs underline underline-offset-4 text-muted-foreground">
          Radiologist reporting workspace
        </Link>
      </div>

      {loading ? (
        <div className="py-14 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-14 text-center">
          <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No reports in this state.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.request_id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{r.patient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.patient_cin || "No CIN"} · {r.request_ref || r.request_id} · {r.scan_type}
                    {r.examination ? ` — ${r.examination}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {r.version_count > 0
                      ? `Version ${r.latest_version}${r.is_amendment ? " (amendment)" : ""}${r.signed_by_name ? ` · signed by ${r.signed_by_name}` : ""}`
                      : "No report version recorded yet"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${STATE_CHIP[r.report_state]}`}>
                    {STATE_LABEL[r.report_state]}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openDetail(r.request_id)}>
                      <PencilLine className="w-3.5 h-3.5 mr-1" /> Versions
                    </Button>
                    {r.stage === "final_report" && role === "administrator" && (
                      <Button size="sm" disabled={busy === r.request_id} onClick={() => release(r.request_id)}>
                        {busy === r.request_id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1" />}
                        Release
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail?.request && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-sm">{detail.request.patient_name} — report history</h2>
              <p className="text-xs text-muted-foreground">
                {detail.request.request_id} · stage {detail.request.stage}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setDetail(null)}>Close</Button>
          </div>
          {(detail.versions || []).length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">No report version has been saved for this request yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {detail.versions.map((v) => (
                <div key={v.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">
                      Version {v.version}{v.is_amendment ? " — amendment" : ""}
                    </span>
                    <span className="text-muted-foreground">
                      {v.signed_datetime ? `Signed ${new Date(v.signed_datetime).toLocaleString()} · ${v.signed_by_name || ""}` : "Unsigned"}
                    </span>
                  </div>
                  {v.amendment_reason && (
                    <p className="text-[11px] text-muted-foreground mt-1">Reason: {v.amendment_reason}</p>
                  )}
                  {v.report_text && (
                    <p className="text-xs mt-2 whitespace-pre-wrap line-clamp-6">{v.report_text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}