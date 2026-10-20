import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

// "Open Imaging Study" — launches the study in the facility's EXISTING
// imaging software through the server-authorized PACS bridge. The button
// only appears when the facility actually connected its imaging system;
// the launch URL is built server-side, so no vendor configuration or
// credential ever reaches the browser. The study opens in a new tab, so
// the AMedix reporting workspace (and its autosaved draft) stays intact.
export default function PacsOpenButton({ requestId, pacsStatus, className = "" }) {
  const [phase, setPhase] = useState(
    pacsStatus ? (pacsStatus.enabled ? "ready" : "hidden") : "checking"
  );
  const [launching, setLaunching] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (pacsStatus) {
      setPhase(pacsStatus.enabled ? "ready" : "hidden");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("radiologyPacsAccess", {
          action: "status",
          request_id: requestId,
        });
        if (cancelled) return;
        setPhase(res.data?.pacs?.enabled ? "ready" : "hidden");
      } catch {
        if (!cancelled) setPhase("hidden");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId, pacsStatus]);

  if (phase === "checking" || phase === "hidden") return null;

  const open = async () => {
    setLaunching(true);
    setMessage("");
    try {
      const res = await base44.functions.invoke("radiologyPacsAccess", {
        action: "launch",
        request_id: requestId,
      });
      const data = res.data || {};
      if (data.launch_url) {
        window.open(data.launch_url, "_blank", "noopener,noreferrer");
      } else {
        setMessage(data.message || "This imaging system cannot be opened from the browser.");
      }
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className={className}>
      <Button variant="outline" size="sm" onClick={open} disabled={launching}>
        {launching ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4 mr-1.5" />
        )}
        Open Imaging Study
      </Button>
      {message && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mt-1.5">
          {message}
        </p>
      )}
    </div>
  );
}