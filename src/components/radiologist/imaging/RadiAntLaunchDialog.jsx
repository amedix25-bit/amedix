import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertTriangle, CheckCircle2, Copy, Loader2, MonitorPlay, RotateCcw, Search, ShieldCheck,
} from "lucide-react";

// RadiAnt DICOM Viewer launch — the radiologist side of the desktop workflow.
//
// AMedix first authorizes the radiologist and confirms the study mapping
// belongs to this patient at this facility (server-side, in
// radiologyPacsAccess). Only then is the radiant:// URL handed to the browser.
// A browser cannot report whether Windows started RadiAnt or which study it
// displayed, so this dialog never claims the study opened: it states that the
// launch was requested and offers manual PACS retrieval with the same
// identifiers.
export default function RadiAntLaunchDialog({ requestId, requestRef, open, onOpenChange }) {
  const [phase, setPhase] = useState("ready");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const reset = () => {
    setPhase("ready");
    setResult(null);
    setError("");
  };

  const launch = async () => {
    setPhase("verifying");
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("radiologyPacsAccess", {
        action: "radiant_launch",
        request_id: requestId,
      });
      const data = res.data || {};
      setResult(data);
      if (!data.launch_url) {
        setError(data.message || "A RadiAnt launch link could not be created.");
        setPhase("error");
        return;
      }
      setPhase("requested");
      // Hand the launch to the operating system. Nothing is reported back to
      // this page, so the dialog asks the radiologist to confirm what they see.
      try {
        window.location.href = data.launch_url;
      } catch {
        // A browser may block an unrecognised protocol — the manual steps below
        // remain available.
      }
    } catch (err) {
      const data = err.response?.data || {};
      setResult(data && (data.manual || data.message) ? data : null);
      setError(data.error || data.message || err.message);
      setPhase("error");
    }
  };

  const handleOpenChange = (next) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const manual = result?.manual || null;
  const copy = (text) => {
    if (text && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-primary" /> Open in RadiAnt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {requestRef ? `${requestRef} · ` : ""}The study stays in your facility PACS — AMedix only authorizes the
            request, confirms the study belongs to this patient and facility, and asks your browser to open RadiAnt.
          </p>

          {phase === "verifying" && (
            <p className="text-sm flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking your access and the study mapping…
            </p>
          )}

          {phase === "requested" && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 space-y-1.5">
              <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> RadiAnt launch requested
              </p>
              <p className="text-xs text-emerald-800/90">
                AMedix cannot detect whether RadiAnt opened or which examination it displayed. Confirm the correct
                study is shown before you report on it.
              </p>
              <p className="text-xs text-emerald-800/90">{result?.availability_message}</p>
              {result && result.launch_test_confirmed === false && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  This facility has not confirmed its RadiAnt launch test yet. If the window does not open, ask your
                  hospital administrator to run Test RadiAnt Launch in Imaging System Connection.
                </p>
              )}
            </div>
          )}

          {phase === "error" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-1.5">
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" /> RadiAnt was not opened
              </p>
              <p className="text-xs text-amber-800">{error}</p>
            </div>
          )}

          {manual && (
            <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Manual PACS retrieval
              </p>
              <p className="text-xs text-muted-foreground">{manual.instruction}</p>
              {manual.accession_number && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Accession:</span>
                  <span className="font-mono">{manual.accession_number}</span>
                  <button type="button" onClick={() => copy(manual.accession_number)} title="Copy accession number">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
              {manual.study_instance_uid && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Study UID:</span>
                  <span className="font-mono break-all">{manual.study_instance_uid}</span>
                  <button type="button" onClick={() => copy(manual.study_instance_uid)} title="Copy Study Instance UID">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                This works when RadiAnt is installed and its own PACS connection is configured on your workstation.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={launch} disabled={phase === "verifying"}>
              {phase === "verifying" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <MonitorPlay className="w-4 h-4 mr-1.5" />}
              {phase === "requested" || phase === "error" ? "Try launch again" : "Open in RadiAnt"}
            </Button>
            {phase !== "ready" && phase !== "verifying" && (
              <Button variant="ghost" onClick={reset}>
                <RotateCcw className="w-4 h-4 mr-1.5" /> Start over
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground flex items-start gap-1">
            <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-emerald-600" />
            <span>Every launch and every refusal is recorded in the clinical audit trail.</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}