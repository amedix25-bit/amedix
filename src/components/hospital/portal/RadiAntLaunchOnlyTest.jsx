import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Loader2, MonitorPlay, CheckCircle2, XCircle, HelpCircle, Copy, RotateCcw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Launch-Only RadiAnt test — deliberately carries NO study parameter, PACS
// identifier or patient information. It answers one question only: can the
// browser on this workstation start the installed RadiAnt desktop application?
//
// The link is a real anchor the administrator clicks, so the browser treats the
// protocol hand-off as a direct user action (which is what lets it ask
// permission to open an external application). Nothing is recorded as a success
// automatically: the attempt is recorded as requested until the administrator
// states whether RadiAnt actually opened, and the result is stored separately
// from the facility's PACS verification.
const LAUNCH_ONLY_URL = "radiant://";

// Documented launch-only alternatives — never a URL AMedix has invented.
const FALLBACKS = [
  {
    key: "start_menu",
    label: "Open RadiAnt from the Windows Start menu",
    detail:
      "The vendor's normal desktop launch, needing no URL, no PACS and no study. Use it to confirm RadiAnt is installed on this workstation and note its version.",
  },
  {
    key: "protocol_check",
    label: "Check whether this RadiAnt version registers the radiant:// protocol",
    detail:
      "Some versions and portable installations register no URL protocol handler, so no link can start them. Confirm the installed version's supported launch syntax in RadiAnt's official documentation (or under Windows Settings → Default apps). AMedix never invents a launch URL.",
  },
  {
    key: "copy_link",
    label: "Retry by pasting the link into the browser's address bar",
    detail:
      "Copy radiant:// and open it from the address bar — a second, still parameter-free attempt at the same registered protocol.",
  },
];

function CheckRow({ check }) {
  const isPassed = check.outcome === "passed";
  const isFailed = check.outcome === "failed";
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="mt-0.5 shrink-0">
        {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          : isFailed ? <XCircle className="w-3.5 h-3.5 text-red-600" />
          : <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />}
      </span>
      <p>
        <span className="font-medium">{check.label}:</span>{" "}
        <span className={`font-semibold ${isPassed ? "text-emerald-700" : isFailed ? "text-red-700" : "text-muted-foreground"}`}>
          {isPassed ? "Passed" : isFailed ? "Failed" : "Not tested"}
        </span>
        {check.message ? <span className="text-muted-foreground"> — {check.message}</span> : null}
      </p>
    </div>
  );
}

export default function RadiAntLaunchOnlyTest({ profile, onUpdate }) {
  const { toast } = useToast();
  const [result, setResult] = useState(
    profile.radiant_launch_only_test_result && profile.radiant_launch_only_test_result.outcome
      ? profile.radiant_launch_only_test_result
      : null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Always show what is actually stored — a launch-only result is never
  // upgraded to a success by the interface.
  useEffect(() => {
    const stored = profile.radiant_launch_only_test_result;
    setResult(stored && stored.outcome ? stored : null);
  }, [profile.radiant_launch_only_test_result]);

  // Opens the installed RadiAnt application with the bare registered protocol,
  // synchronously inside the user's click so the browser treats it as a direct
  // action. It carries no study, no PACS detail and no patient data.
  const openRadiAnt = () => {
    const link = document.createElement("a");
    link.href = LAUNCH_ONLY_URL;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Records the attempt as REQUESTED only. This call is independent of every
  // imaging-request field — it sends no request id, patient, study UID,
  // accession number or PACS setting, and the server routes it on its own flag.
  const recordAttempt = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("radiologyPacsAccess", {
        action: "radiant_launch_only_test",
        launch_only: true,
        launch_step: "test",
        hospital_profile_id: profile.id,
      });
      setResult(res.data || {});
    } catch (err) {
      const data = (err.response && err.response.data) || {};
      setError(data.error || data.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  // The click itself starts RadiAnt (a permitted user action) and then records
  // the attempt — no imaging request is selected or required for this test.
  const handleTest = () => {
    openRadiAnt();
    recordAttempt();
  };

  const confirm = async (confirmed) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("radiologyPacsAccess", {
        action: "radiant_launch_only_confirm",
        launch_only: true,
        launch_step: "confirm",
        hospital_profile_id: profile.id,
        confirmed,
      });
      const data = res.data || {};
      setResult(data);
      if (onUpdate && data.profile) onUpdate(data.profile);
      toast({
        title: confirmed ? "RadiAnt application launch recorded" : "RadiAnt did not open",
        description: data.message,
        variant: confirmed ? undefined : "destructive",
      });
    } catch (err) {
      toast({
        title: "Could not record the result",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(LAUNCH_ONLY_URL);
      toast({ title: "Launch link copied", description: LAUNCH_ONLY_URL });
    } catch {
      toast({ title: "Could not copy", description: LAUNCH_ONLY_URL, variant: "destructive" });
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
      <p className="text-sm font-semibold flex items-center gap-1.5">
        <MonitorPlay className="w-4 h-4 text-primary" /> Test RadiAnt Application Launch
      </p>
      <p className="text-xs text-muted-foreground">
        Launch-only test, independent of the PACS configuration: it opens the RadiAnt application installed on this
        workstation and nothing else — no PACS server, no imaging request, no Study Instance UID or accession number,
        no patient images. Nothing is recorded as successful automatically.
      </p>

      <Button type="button" variant="outline" onClick={handleTest} disabled={busy}>
        {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <MonitorPlay className="w-4 h-4 mr-1.5" />}
        Test RadiAnt Application Launch
      </Button>

      {error && <p className="text-xs text-red-700">{error}</p>}

      {result && (
        <div className={`rounded-lg border p-3 space-y-2 ${
          result.outcome === "launch_only_confirmed"
            ? "border-emerald-200 bg-emerald-50"
            : result.outcome === "launch_only_failed"
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50"
        }`}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Application launch test only — not a PACS connection
          </p>
          <p className="text-xs">{result.message}</p>
          {(result.checks || []).map((c, i) => (
            <CheckRow key={i} check={c} />
          ))}

          {result.outcome === "launch_requested" && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-semibold">Did the RadiAnt application open?</p>
              <a href={LAUNCH_ONLY_URL} className="text-[11px] font-medium text-primary underline underline-offset-4">
                Open radiant:// again
              </a>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => confirm(true)} disabled={busy}>
                  Yes, RadiAnt Opened
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => confirm(false)} disabled={busy}>
                  No, RadiAnt Did Not Open
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                AMedix cannot detect whether Windows started RadiAnt, so your answer is the only record — and it stays
                an application launch result, never a PACS verification.
              </p>
            </div>
          )}

          {result.outcome === "launch_only_confirmed" && (
            <p className="text-xs font-semibold text-emerald-800">
              Recorded — RadiAnt started from the browser on this workstation. The facility's PACS integration is not
              affected: its own connection and launch tests still apply before clinical use.
            </p>
          )}

          {result.outcome === "launch_only_failed" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-800">
                The bare radiant:// link did not open RadiAnt. The installed version may not register the protocol
                handler, or the browser blocked the hand-off.
              </p>
              <p className="text-[11px] text-muted-foreground">
                AMedix will not substitute a launch URL it cannot verify against RadiAnt's official documentation.
                Alternative launch-only methods:
              </p>
              <ul className="space-y-1.5">
                {FALLBACKS.map((f) => (
                  <li key={f.key} className="text-[11px]">
                    <span className="font-semibold">{f.label}</span>
                    <span className="text-muted-foreground"> — {f.detail}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" size="sm" variant="outline" onClick={copyLink}>
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy the launch link
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={handleTest} disabled={busy}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Try the launch again
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}