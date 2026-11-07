import React, { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  MonitorPlay, CheckCircle2, XCircle, HelpCircle, Copy, RotateCcw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Launch-Only RadiAnt test — deliberately carries NO study parameter, PACS
// identifier or patient information. It answers one question only: can the
// browser on this workstation start the installed RadiAnt desktop application?
//
// The click starts RadiAnt directly and the result is decided in the browser,
// because only the operator can see whether a window opened. Nothing is
// recorded as a success automatically, and the test never asks for — or
// depends on — an imaging request.
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

const BASE_CHECKS = [
  {
    key: "launch_only_url",
    label: "Launch-only URL",
    outcome: "passed",
    message:
      "radiant:// carries no study parameter, PACS identifier or patient data — it only asks Windows to start the registered RadiAnt application.",
  },
  {
    key: "no_patient_data",
    label: "No patient information",
    outcome: "passed",
    message:
      "This test uses no imaging request, Study Instance UID, accession number, PACS endpoint or patient image.",
  },
  {
    key: "pacs_independent",
    label: "PACS configuration",
    outcome: "not_tested",
    message: "Deliberately not required for this test — a launch-only result is not a PACS connection.",
  },
];

const operatorCheck = (confirmed) => ({
  key: "operator_confirmation",
  label: "Operator confirmation",
  outcome: confirmed ? "passed" : "failed",
  message: confirmed
    ? "The administrator confirmed that the RadiAnt application opened on this workstation."
    : "The administrator reported that the RadiAnt application did not open.",
});

// This launch-only test and its operator confirmation stay in browser state.
// Neither action calls the clinical PACS service or changes integration status.
function buildResult(outcome, confirmed) {
  const now = new Date().toISOString();
  const checks = BASE_CHECKS.map((c) => ({ ...c }));
  checks.push(
    confirmed === null
      ? {
          key: "operator_confirmation",
          label: "Operator confirmation",
          outcome: "not_tested",
          message: "Pending — record whether the RadiAnt window actually opened.",
        }
      : operatorCheck(confirmed)
  );
  return {
    tested_datetime: now,
    outcome,
    launch_only: true,
    confirmed: !!confirmed,
    launcher_name: "",
    launch_url: LAUNCH_ONLY_URL,
    checks,
    message:
      outcome === "launch_only_confirmed"
        ? "Recorded — the RadiAnt desktop application started from the browser on this workstation. This is an APPLICATION LAUNCH result only: no PACS connection was made and no clinical imaging integration is verified."
        : outcome === "launch_only_failed"
          ? "Recorded — the RadiAnt application did not open. This is an application launch result only; the facility's PACS configuration and clinical launch workflow are unaffected and still require their own tests."
          : "The launch request was sent to your browser. AMedix cannot detect whether RadiAnt opened and records nothing as successful — confirm below what you saw on this workstation.",
  };
}

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

export default function RadiAntLaunchOnlyTest({ profile }) {
  const { toast } = useToast();
  const [result, setResult] = useState(
    profile && profile.radiant_launch_only_test_result && profile.radiant_launch_only_test_result.outcome
      ? profile.radiant_launch_only_test_result
      : null
  );

  // Always show what is actually stored — a launch-only result is never
  // upgraded to a success by the interface.
  useEffect(() => {
    const stored = profile && profile.radiant_launch_only_test_result;
    setResult(stored && stored.outcome ? stored : null);
  }, [profile && profile.radiant_launch_only_test_result]);

  // The launch control carries NO handler: it is a plain <a href="radiant://">,
  // so the browser performs its own default navigation exactly as it does for a
  // hand-written HTML link. No preventDefault, no synthetic click, no timeout,
  // no form submission, no validation and no backend call. Only the operator
  // confirmation below changes state, and it never triggers a launch.
  const confirm = (confirmed) => {
    setResult(buildResult(confirmed ? "launch_only_confirmed" : "launch_only_failed", confirmed));
    toast({
      title: confirmed ? "RadiAnt application launch recorded" : "RadiAnt did not open",
      description: confirmed
        ? "An application launch result only — not a PACS connection."
        : "The application launch is recorded as not confirmed.",
    });

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

      {/* A real HTML anchor to the registered protocol — nothing intercepts it. */}
      <a
        href={LAUNCH_ONLY_URL}
        className={buttonVariants({ variant: "outline" })}
        aria-label="Launch the installed RadiAnt DICOM Viewer application"
      >
        <MonitorPlay className="w-4 h-4 mr-1.5" />
        Test RadiAnt Application Launch
      </a>

      {/* Operator confirmation — deliberately separate from the launch link. */}
      <div className="space-y-1.5 pt-1">
        <p className="text-xs font-semibold">Did the RadiAnt application open?</p>
        <a
          href={LAUNCH_ONLY_URL}
          className="block text-[11px] font-medium text-primary underline underline-offset-4"
        >
          Open radiant:// again
        </a>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => confirm(true)}>
            Yes, RadiAnt Opened
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => confirm(false)}>
            No, RadiAnt Did Not Open
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          AMedix cannot detect whether Windows started RadiAnt, so your answer is the only record — and it stays an
          application launch result, never a PACS verification.
        </p>
      </div>

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
                <a
                  href={LAUNCH_ONLY_URL}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Try the launch again
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}