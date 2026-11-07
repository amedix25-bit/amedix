import React, { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, MonitorPlay, ShieldCheck } from "lucide-react";

const LAUNCH_ONLY_URL = "radiant://";

// RadiAnt DICOM Viewer — LAUNCH ONLY (TEST).
//
// This uses the SAME mechanism as the working Hospital Portal launch test: a
// plain HTML anchor to the registered radiant:// protocol, with no click
// handler, no preventDefault, no synthetic click, no backend request and no
// PACS requirement. It starts the RadiAnt application on the workstation and
// retrieves nothing: no Study Instance UID, no accession number, no images.
//
// The imaging request stays associated with this control (request_id keeps it
// linked for the future clinical launch), but this test never marks the
// request viewed, completed or reported, and never touches patient data.
//
// The clinical launch remains unchanged and separate in the backend
// (radiologyPacsAccess → radiant_launch), which still requires authorization
// and a verified study identifier once PACS integration is configured.
export default function RadiAntLaunchDialog({ requestId, requestRef, open, onOpenChange }) {
  const [confirmed, setConfirmed] = useState(null);

  const handleOpenChange = (next) => {
    if (!next) setConfirmed(null);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg" data-request-id={requestId}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-primary" /> Launch RadiAnt — Test Only
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {requestRef ? `${requestRef} · ` : ""}This only starts the RadiAnt application installed on your
            workstation. It does not open the patient's examination and retrieves no images — no PACS connection, Study
            Instance UID or accession number is used, and the request stays unchanged.
          </p>

          {/* A real HTML anchor to the registered protocol — nothing intercepts it. */}
          <a
            href={LAUNCH_ONLY_URL}
            className={buttonVariants({ variant: "default" })}
            aria-label="Launch the installed RadiAnt DICOM Viewer application (test only)"
          >
            <MonitorPlay className="w-4 h-4 mr-1.5" />
            Launch RadiAnt — Test Only
          </a>

          {/* Operator confirmation — deliberately separate from the launch link. */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold">Did the RadiAnt application open?</p>
            <a href={LAUNCH_ONLY_URL} className="block text-[11px] font-medium text-primary underline underline-offset-4">
              Open radiant:// again
            </a>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => setConfirmed(true)}>
                Yes, RadiAnt Opened
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmed(false)}>
                No, RadiAnt Did Not Open
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              AMedix cannot detect whether Windows started RadiAnt, so your answer is the only record. It is not saved,
              and the imaging request is never marked viewed, completed or reported by this test.
            </p>
          </div>

          {confirmed === true && (
            <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> RadiAnt opened — application launch only, no
              examination displayed.
            </p>
          )}
          {confirmed === false && (
            <p className="text-xs font-semibold text-amber-800">
              RadiAnt did not open. The application may not be installed on this workstation.
            </p>
          )}

          <p className="text-[11px] text-muted-foreground flex items-start gap-1">
            <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-emerald-600" />
            <span>
              Your access to this request is unchanged. Once the facility's PACS integration is configured, the clinical
              Open Study in RadiAnt action still requires authorization and a verified study identifier.
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}