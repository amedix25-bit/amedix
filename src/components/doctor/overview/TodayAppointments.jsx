import React from "react";
import { CalendarClock } from "lucide-react";

const STATUS = {
  scheduled: { label: "Scheduled", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700 border-red-200" },
};

// Today's appointments at a glance — patient, CIN and current status.
export default function TodayAppointments({ appointments, onNavigate }) {
  const rows = appointments || [];

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-doctor-blue" />
          <h3 className="text-sm font-semibold text-foreground">Today's Appointments</h3>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.("appointments")}
          className="text-xs font-medium text-doctor-blue hover:underline"
        >
          View all
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No appointments scheduled for today.</p>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((appointment) => {
            const status = STATUS[appointment.status] || STATUS.scheduled;
            return (
              <div key={appointment.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {appointment.time || "—"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{appointment.patient_name || "—"}</span>
                  <span className="block truncate text-xs text-muted-foreground">CIN: {appointment.patient_cin || "—"}</span>
                </span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.cls}`}>
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}