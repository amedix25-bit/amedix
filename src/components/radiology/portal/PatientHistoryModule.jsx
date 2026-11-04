import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, History } from "lucide-react";
import { STAGE_LABELS, canonicalStage } from "@/lib/radiologyWorkflow";

// Patient history — the facility's radiology timeline for ONE existing AMedix
// patient, found by name or CIN. A patient only appears here when this
// facility holds a study or request for them, so the module can never be used
// to browse another hospital's patients.
export default function PatientHistoryModule() {
  const [term, setTerm] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!term.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await base44.functions.invoke("radiologyPortal", { action: "patient_history", search: term.trim() });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); search(); }}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Patient name or CIN"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Search className="w-4 h-4 mr-1.5" />}
            Search
          </Button>
        </form>
        {error && <p className="text-xs text-[hsl(var(--critical))] mt-2">{error}</p>}
      </div>

      {data && !data.patient && (
        <div className="rounded-xl border border-border bg-card py-12 text-center">
          <History className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">{data.message || "No patient found."}</p>
        </div>
      )}

      {data?.patient && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">{data.patient.full_name}</h2>
            <p className="text-xs text-muted-foreground">
              {data.patient.cin || "No CIN"}{data.patient.date_of_birth ? ` · born ${data.patient.date_of_birth}` : ""}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Archived studies ({data.studies?.length || 0})
              </h3>
              {(data.studies || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No studies archived for this patient at this facility.</p>
              ) : (
                <ul className="space-y-2">
                  {data.studies.map((s) => (
                    <li key={s.id} className="text-xs border border-border rounded-lg px-3 py-2">
                      <p className="font-medium">{s.modality} · {s.study_date || "date not recorded"}</p>
                      <p className="text-muted-foreground">
                        {s.series_count || 0} series · {s.image_count || 0} images · {s.source}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Imaging requests ({data.requests?.length || 0})
              </h3>
              {(data.requests || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No imaging requests for this patient at this facility.</p>
              ) : (
                <ul className="space-y-2">
                  {data.requests.map((r) => (
                    <li key={r.id} className="text-xs border border-border rounded-lg px-3 py-2">
                      <p className="font-medium">
                        {r.scan_type}{r.examination ? ` — ${r.examination}` : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {r.request_id} · {STAGE_LABELS[canonicalStage(r.workflow_status)] || r.workflow_status}
                        {r.request_datetime ? ` · ${new Date(r.request_datetime).toLocaleDateString()}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Signed report versions ({data.reports?.length || 0})
            </h3>
            {(data.reports || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No signed radiology report versions recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.reports.map((v) => (
                  <li key={v.id} className="text-xs border border-border rounded-lg px-3 py-2">
                    <p className="font-medium">
                      Version {v.version}{v.is_amendment ? " — amendment" : ""} · {v.request_ref || v.imaging_request_id}
                    </p>
                    <p className="text-muted-foreground">
                      {v.signed_datetime ? new Date(v.signed_datetime).toLocaleString() : "Unsigned"}
                      {v.signed_by_name ? ` · ${v.signed_by_name}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}