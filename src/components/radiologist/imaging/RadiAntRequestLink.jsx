import React, { useState } from "react";
import { MonitorPlay } from "lucide-react";
import RadiAntLaunchDialog from "@/components/radiologist/imaging/RadiAntLaunchDialog";

// The imaging request number, made clickable: clicking it opens the study in
// RadiAnt DICOM Viewer on the radiologist's workstation after AMedix has
// verified access and the study mapping. Uses stopPropagation so it never
// triggers the row's own click.
export default function RadiAntRequestLink({ requestId, requestRef, className = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        title={`Open ${requestRef || "this request"} in RadiAnt DICOM Viewer`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex items-center gap-1 font-mono text-xs underline decoration-dotted underline-offset-2 hover:text-primary ${className}`}
      >
        {requestRef}
        <MonitorPlay className="w-3 h-3 shrink-0" />
      </button>
      {open && (
        <RadiAntLaunchDialog
          requestId={requestId}
          requestRef={requestRef}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}