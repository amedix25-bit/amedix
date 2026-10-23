import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Loader2, ExternalLink, MonitorPlay, ShieldCheck, Link2, Database, CircleAlert, CheckCircle2, Clock, HelpCircle,
} from "lucide-react";

// Embedded OHIF workspace — inside the AMedix Imaging Viewer tab. It opens the
// facility's OWN approved OHIF deployment through the server-authorized OHIF
// bridge (radiologyPacsAccess "ohif_launch"): the URL is built server-side and
// carries only the verified Study Instance UID — never patient name, CIN or
// credentials. Each integration stage is reported separately and honestly:
// loading is taken from iframe events only and never certified as "Connected";
// a viewer that never signals load falls back to the approved Open Viewer
// action without losing the request and report context.
export default function OhifWorkspace({ requestId, status }) {
  const [launching, setLaunching] = useState(false);
  const [launchUrl, setLaunchUrl] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState("");
  const [viewerPhase, setViewerPhase] = useState(null); // null | loading | loaded | unresponsive
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => clearTimer, []);

  const open = async (mode) => {
    setLaunching(true);
    setError("");
    setAvailability(null);
    setViewerPhase(null);
    setLaunchUrl(null);
    clearTimer();
    try {
      const res = await base44.functions.invoke("radiologyPacsAccess", {
        action: "ohif_launch",
        request_id: requestId,
      });
      const data = res.data || {};
      setAvailability({ state: data.study_availability, message: data.availability_message });
      if (mode === "new_tab") {
        window.open(data.launch_url, "_blank", "noopener,noreferrer");
      } else {
        setLaunchUrl(data.launch_url);
        setViewerPhase("loading");
        timerRef.current = setTimeout(
          () => setViewerPhase((p) => (p === "loading" ? "unresponsive" : p)),
          25000
        );
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLaunching(false);
    }
  };

  const connStatus = status.pacs?.ohif_connection_status || "pending_configuration";
  const connected = connStatus === "connected";
  const deployed = !!status.pacs?.ohif_configured;
  const mappingOk = !!status.study_instance_uid;

  const stage = (label, state, detail) => (
    <div className="flex items-start gap-2 text-xs">
      <span className="mt-0.5 shrink-0">
        {state === "ok" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
        {state === "warn" && <Clock className="w-3.5 h-3.5 text-amber-600" />}
        {state === "fail" && <CircleAlert className="w-3.5 h-3.5 text-red-600" />}
        {state === "idle" && <span className="inline-block w-3.5 h-3.5 rounded-full border border-border" />}
      </span>
      <p>
        <span className="font-medium">{label}:</span> {detail}
      </p>
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h4 className="font-semibold flex items-center gap-2 text-sm">
            <MonitorPlay className="w-4 h-4 text-indigo-600" />
            Embedded OHIF Viewer
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            The facility's own approved OHIF deployment, opened to the verified study. The AMedix request and its report
            workspace stay in this tab.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => open("embed")} disabled={launching || !connected}>
            {launching ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <MonitorPlay className="w-4 h-4 mr-1.5" />}
            Open Study
          </Button>
          <Button size="sm" variant="outline" onClick={() => open("new_tab")} disabled={launching || !connected}>
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Open Viewer in new tab
          </Button>
        </div>
      </div>

      {/* Integration status — every stage reported separately */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
        {stage(
          "OHIF integration",
          connected ? "ok" : connStatus === "verification_failed" ? "fail" : "warn",
          connected
            ? "Connected — the end-to-end study-retrieval test passed"
            : connStatus === "verification_failed"
              ? "the last connection test failed — the hospital administrator must correct the deployment and re-run it"
              : deployed
                ? "pending configuration — the OHIF address is recorded but the end-to-end study-retrieval test has not passed yet; launching is disabled"
                : "pending configuration — no approved OHIF deployment is recorded yet; deployment required"
        )}
        {stage(
          "Study mapping",
          mappingOk ? "ok" : "fail",
          mappingOk ? "verified Study Instance UID recorded on the imaging request" : "no Study Instance UID recorded on the imaging request"
        )}
        {stage(
          "Authorization",
          error ? "fail" : launchUrl || launching ? "ok" : "idle",
          error ? "the server refused this study access" : "checked server-side on every launch"
        )}
        {stage(
          "Archive (DICOMweb)",
          availability ? (availability.state === "verified" ? "ok" : "warn") : "idle",
          availability
            ? availability.message
            : status.pacs?.dicomweb_configured
              ? "endpoint configured — availability is confirmed on launch"
              : "no DICOMweb (QIDO) endpoint configured — availability cannot be confirmed before opening"
        )}
        {stage(
          "Viewer loading",
          viewerPhase === "loaded" ? "ok" : viewerPhase === "loading" ? "warn" : viewerPhase === "unresponsive" ? "fail" : "idle",
          viewerPhase === "loaded"
            ? "viewer signalled load — loading alone does not certify archive connectivity"
            : viewerPhase === "loading"
              ? "waiting for the viewer to signal load..."
              : viewerPhase === "unresponsive"
                ? "the viewer did not signal load — it may be blocked by its own frame policy"
                : "not opened yet"
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
          <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {viewerPhase === "unresponsive" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1.5">
          <p className="flex items-start gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            The embedded viewer did not signal loading. The deployment may block embedding (frame policy) or be
            temporarily unavailable. Use "Open Viewer in new tab" — the study context and your report draft are kept.
          </p>
          <p>
            <button className="underline font-medium" onClick={() => open("embed")}>
              Retry embedded
            </button>{" "}
            or ask the hospital administrator to verify the deployment allows embedding from AMedix.
          </p>
        </div>
      )}

      {/* Embedded viewing area */}
      {launchUrl && (
        <div className="relative rounded-lg border border-border overflow-hidden bg-slate-900" style={{ height: "60vh" }}>
          <iframe
            src={launchUrl}
            title="Facility OHIF Viewer — study workspace"
            className="w-full h-full border-0"
            referrerPolicy="no-referrer"
            onLoad={() => {
              clearTimer();
              setViewerPhase("loaded");
            }}
          />
          {viewerPhase === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/80 text-slate-200 text-sm">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading the study in the OHIF viewer...
            </div>
          )}
        </div>
      )}

      {!connected && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800 flex items-start gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Launching is disabled — the embedded OHIF integration is not Connected yet.
              {deployed
                ? " The recorded deployment has not passed the end-to-end study-retrieval test; the hospital administrator corrects the configuration and re-runs the test in the Hospital Portal, Radiology Department tab, Imaging System Connection."
                : " Deployment of the facility's approved OHIF instance (never the public demo for real patient data) is required first; the administrator then records its https:// Base URL and passes the end-to-end study-retrieval test in the Hospital Portal, Radiology Department tab, Imaging System Connection."}
              Until then, use the manual imaging workflow below.
            </span>
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5 shrink-0" />
        Only the verified Study Instance UID travels to the viewer URL — patient name, CIN and credentials never leave
        AMedix's server-side configuration.
      </p>
      {availability?.state === "unconfirmed" && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 flex items-start gap-1.5">
          <Database className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {availability.message} Confirm the study identity in the viewer before reporting.
        </p>
      )}
    </div>
  );
}