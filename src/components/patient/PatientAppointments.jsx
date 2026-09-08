import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, XCircle, MapPin, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function PatientAppointments({ patientId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Appointment.subscribe(() => load());
    return unsubscribe;
  }, [patientId]);

  const load = async () => {
    try {
      const data = await base44.entities.Appointment.filter({ patient_id: patientId }, "-date");
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const askConfirm = (apt, response) => setConfirmAction({ apt, response });

  const respond = async ({ apt, response }) => {
    setConfirmAction(null);
    setBusyId(apt.id);
    try {
      await base44.entities.Appointment.update(apt.id, {
        patient_response: response,
        response_date: new Date().toISOString(),
      });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No appointments yet</p>
        </div>
      ) : (
        items.map((apt) => (
          <div key={apt.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-primary">{apt.date?.slice(5, 7) || ""}</span>
              <span className="text-lg font-bold text-primary leading-none">{apt.date?.slice(8, 10) || ""}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{apt.doctor_name}</p>
                <StatusBadge status={apt.status} />
              </div>
              {apt.reason && <p className="text-sm text-muted-foreground mt-1">{apt.reason}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.time}</span>
                {apt.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.location}</span>
                )}
              </div>
              {apt.notes && <p className="text-xs text-muted-foreground mt-2">{apt.notes}</p>}

              {apt.status === "scheduled" && (
                apt.patient_response ? (
                  <div className="mt-3">
                    {apt.patient_response === "accepted" ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        You confirmed{apt.response_date ? ` · ${apt.response_date.slice(0, 10)}` : ""}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        You declined{apt.response_date ? ` · ${apt.response_date.slice(0, 10)}` : ""}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => askConfirm(apt, "accepted")} disabled={busyId === apt.id}>
                      {busyId === apt.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => askConfirm(apt, "declined")} disabled={busyId === apt.id}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
        ))
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.response === "accepted"
                ? "Are you sure you want to confirm this appointment?"
                : "Are you sure you want to decline this appointment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.apt?.doctor_name} — {confirmAction?.apt?.date} at {confirmAction?.apt?.time}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.response === "declined" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() => confirmAction && respond(confirmAction)}
            >
              {confirmAction?.response === "accepted" ? "Yes, Confirm" : "Yes, Decline"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    scheduled: "bg-blue-50 text-blue-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || ""}`}>
      {status}
    </span>
  );
}