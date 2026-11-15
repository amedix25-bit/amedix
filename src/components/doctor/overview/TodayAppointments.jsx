import React from "react";
import { CalendarClock, Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS = {
  scheduled: { label: "Scheduled", cls: "bg-[#E3F1FF] text-[#1D6FD0]" },
  completed: { label: "Completed", cls: "bg-[#E8F5E9] text-[#16A34A]" },
  cancelled: { label: "Cancelled", cls: "bg-[#FFE4E6] text-[#DC2626]" },
};

// Today's appointments — time, patient, reason and status, with a row action
// opening the appointment.
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
        <>
          <div className="hidden grid-cols-[70px_1.4fr_1.2fr_110px_60px] gap-3 border-b border-border px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Time</span>
            <span>Patient</span>
            <span>Reason</span>
            <span>Type</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-border">
            {rows.map((appointment) => {
              const status = STATUS[appointment.status] || STATUS.scheduled;
              return (
                <div
                  key={appointment.id}
                  className="grid gap-1 px-5 py-3 sm:grid-cols-[70px_1.4fr_1.2fr_110px_60px] sm:items-center sm:gap-3"
                >
                  <span className="text-sm font-semibold tabular-nums text-foreground">{appointment.time || "—"}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {appointment.patient_name || "—"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      CIN: {appointment.patient_cin || "—"}
                    </span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground sm:text-sm">
                    {appointment.reason || "—"}
                  </span>
                  <span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${status.cls}`}>
                      {status.label}
                    </span>
                  </span>
                  <span className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onNavigate?.("appointments")}
                      aria-label={`Open ${appointment.patient_name || "appointment"}`}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Appointment actions"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onNavigate?.("appointments")}>
                          Open appointments
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onNavigate?.("search")}>
                          Find patient
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}