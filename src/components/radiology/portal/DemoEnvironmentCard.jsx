import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  FlaskConical, Loader2, CheckCircle2, CircleDashed, Lock, Trash2, RefreshCw, Database,
} from "lucide-react";

const MODES = [
  {
    key: "demonstration",
    title: "Demonstration",
    detail: "Fictional patients and synthetic DICOM studies. No hospital PACS is contacted and real patient images are refused by the server.",
  },
  {
    key: "verification",
    title: "Verification",
    detail: "The facility's own PACS may be tested with the endpoint its vendor confirmed. Real patient images stay blocked.",
  },
  {
    key: "live",
    title: "Live operation",
    detail: "Real patients and the facility's own PACS and RadiAnt installation are in clinical use.",
  },
];

const STATE_STYLE = {
  ready: { chip: "bg-secondary text-secondary-foreground", label: "built" },
  verified: { chip: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]", label: "verified with demonstration data" },
  blocked: { chip: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]", label: "staged — not yet activated" },
};

// Demonstration environment: generate the fictional patients and synthetic
// DICOM studies the portal is tested with, see the staged rollout, and (as the
// facility administrator) move the deployment from demonstration to
// verification and finally to live operation.
export default function DemoEnvironmentCard({ onSeeded, onModeChange }) {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("radiologyDemo", { action: "status" });
      setStatus(res.data);
    } catch (err) {
      toast({ title: "Could not load the deployment state", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setBusy("seed");
    setProgress("");
    try {
      const prepared = await base44.functions.invoke("radiologyDemo", { action: "prepare" });
      const studies = prepared.data?.studies || [];
      let imported = 0;
      const failures = [];
      for (let i = 0; i < studies.length; i += 1) {
        const study = studies[i];
        setProgress(`Importing synthetic ${study.modality} study ${i + 1} of ${studies.length}…`);
        try {
          await base44.functions.invoke("radiologyImportDicom", {
            action: "import",
            files: study.files,
            patient_cin: study.patient_cin,
            request_id: study.request_id || "",
          });
          imported += 1;
        } catch (err) {
          failures.push(`${study.modality}: ${err.response?.data?.error || err.message}`);
        }
      }
      setProgress("");
      toast({
        title: imported > 0 ? "Demonstration data ready" : "No demonstration study was imported",
        description: failures.length
          ? `${imported} imported · ${failures.length} refused — ${failures[0]}`
          : `${imported} synthetic studies imported through the ordinary import pipeline.`,
        variant: imported > 0 ? undefined : "destructive",
      });
      await load();
      if (onSeeded) onSeeded();
    } catch (err) {
      toast({ title: "Could not prepare demonstration data", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const clear = async () => {
    if (!window.confirm("Remove the synthetic demonstration studies and fictional patients? Real records are never touched.")) return;
    setBusy("clear");
    try {
      const res = await base44.functions.invoke("radiologyDemo", { action: "purge_demo" });
      toast({ title: "Demonstration data cleared", description: `${res.data?.removed_studies || 0} synthetic studies removed.` });
      await load();
      if (onSeeded) onSeeded();
    } catch (err) {
      toast({ title: "Could not clear demonstration data", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const setMode = async (mode) => {
    if (mode === "live" && !window.confirm("Activate live operation? Real patient images will be accepted and the facility's own PACS may be connected. Do this only after the demonstration stages are signed off.")) return;
    setBusy("mode");
    try {
      const res = await base44.functions.invoke("radiologyDemo", { action: "mode_save", deployment_mode: mode, confirm: mode === "live" });
      toast({ title: `Deployment set to ${mode}` });
      if (onModeChange) onModeChange(res.data?.deployment_mode || mode);
      await load();
    } catch (err) {
      toast({ title: "Could not change the deployment mode", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return <div className="py-14 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const mode = status?.deployment_mode || "demonstration";
  const demo = status?.demo || { patients: 0, studies: 0, series: 0, images: 0 };
  const stages = status?.stages || [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Demonstration data</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Fictional patients and synthetic DICOM studies are generated as real DICOM files and imported through the
          ordinary authorized import pipeline, so the portal is tested exactly as a hospital would use it. Nothing here
          is a real person and no hospital system is contacted.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            ["Fictional patients", demo.patients],
            ["Imaging requests", demo.requests || 0],
            ["Synthetic studies", demo.studies],
            ["Images", demo.images],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <p className="text-lg font-semibold leading-tight">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={generate} disabled={!!busy}>
            {busy === "seed" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Database className="w-4 h-4 mr-1.5" />}
            {demo.studies > 0 ? "Generate additional synthetic studies" : "Generate demonstration data"}
          </Button>
          <Button variant="outline" onClick={load} disabled={!!busy}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          {demo.studies > 0 && status?.can_manage && (
            <Button variant="ghost" onClick={clear} disabled={!!busy}>
              {busy === "clear" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              Clear demonstration data
            </Button>
          )}
        </div>
        {progress && <p className="mt-3 text-xs text-muted-foreground">{progress}</p>}
        {demo.seeded_datetime && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Last generated {new Date(demo.seeded_datetime).toLocaleString()}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-sm mb-1">Deployment mode</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Enforced on the server for every import and PACS action — never only in this screen.
        </p>
        <div className="space-y-2">
          {MODES.map((option) => {
            const active = mode === option.key;
            return (
              <div
                key={option.key}
                className={`rounded-lg border px-3 py-2.5 ${active ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {option.title}
                      {active && <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">current</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{option.detail}</p>
                  </div>
                  {!active && status?.can_manage && (
                    <Button size="sm" variant="outline" onClick={() => setMode(option.key)} disabled={!!busy}>
                      {busy === "mode" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Switch"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!status?.can_manage && (
          <p className="mt-3 text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Lock className="w-3 h-3" /> Only the facility's radiology administrator can change the deployment mode.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-sm mb-3">Staged rollout</h2>
        <ul className="space-y-2.5">
          {stages.map((stage) => {
            const style = STATE_STYLE[stage.state] || STATE_STYLE.ready;
            return (
              <li key={stage.key} className="flex items-start gap-2.5">
                {stage.state === "blocked" ? (
                  <Lock className="w-4 h-4 mt-0.5 text-[hsl(var(--warning))] shrink-0" />
                ) : stage.state === "verified" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-[hsl(var(--success))] shrink-0" />
                ) : (
                  <CircleDashed className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{stage.label}</p>
                  <p className="text-[11px] text-muted-foreground">{stage.detail}</p>
                  <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.chip}`}>
                    {style.label}
                  </span>
                  {stage.blocked_reason && (
                    <p className="text-[11px] text-muted-foreground mt-1">{stage.blocked_reason}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}