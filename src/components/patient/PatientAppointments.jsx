import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function PatientAppointments({ patientId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
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
              <p className="text-sm text-muted-foreground mt-1">{apt.reason}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {apt.time}
                </span>
                {apt.notes && <span className="truncate">{apt.notes}</span>}
              </div>
            </div>
          </div>
        ))
      )}
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