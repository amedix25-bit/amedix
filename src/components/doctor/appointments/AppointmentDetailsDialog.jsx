import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { getAppointmentStatus, STATUS_BADGE, formatLongDate, formatDateTime } from "./appointmentStatus";

export default function AppointmentDetailsDialog({ apt, onClose, onOpenRecord, recordError }) {
  const status = apt ? getAppointmentStatus(apt) : "";

  return (
    <Dialog open={!!apt} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        {apt && (
          <>
            <DialogHeader>
              <DialogTitle>{apt.patient_name}</DialogTitle>
              <DialogDescription>Appointment details</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <Row label="Patient Name" value={apt.patient_name} />
              <Row label="CIN" value={apt.patient_cin} />
              <Row label="Date" value={formatLongDate(apt.date)} />
              <Row label="Time" value={apt.time} />
              <Row label="Type / Reason" value={apt.reason || apt.location} />
              <Row label="Location" value={apt.location} />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status]}`}>{status}</span>
              </div>
              {apt.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Information entered for this appointment</p>
                  <p className="rounded-lg bg-muted p-3 whitespace-pre-wrap">{apt.notes}</p>
                </div>
              )}
              {apt.response_date && (
                <Row label="Patient Responded" value={formatDateTime(apt.response_date)} />
              )}
              {recordError && <p className="text-sm text-destructive">{recordError}</p>}
              <Button className="w-full" variant="outline" onClick={() => onOpenRecord(apt)}>
                <FileText className="w-4 h-4 mr-2" />
                Open Patient Medical Record
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}