import React from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Report preview (Phase 5.2) — shows the report exactly as it will be signed.
export default function ReportPreviewDialog({ open, onClose, sections, study, radiologistProfile, missing }) {
  const rows = (sections || []);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Preview</DialogTitle>
          <DialogDescription>
            {study.patient_name} · CIN {study.patient_cin} · {study.scan_type} — {study.examination}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border p-4 space-y-3 text-sm">
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Request: {study.request_id}</p>
            <p>Referring: Dr. {study.doctor_name} · {study.routed_hospital || study.doctor_hospital}</p>
            <p>Radiologist: {radiologistProfile?.full_name}</p>
          </div>
          {rows.length === 0 && <p className="text-muted-foreground">No sections filled yet.</p>}
          {rows.map(([label, text]) => (
            <div key={label} className="space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="whitespace-pre-wrap">{text}</p>
            </div>
          ))}
        </div>
        {missing && missing.length > 0 && (
          <p className="text-xs text-amber-600">Missing sections: {missing.join(", ")}</p>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close Preview</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}