import React from "react";
import { Clock, MapPin, CalendarX, Pencil } from "lucide-react";
import { getAppointmentStatus, sortByDateTime, STATUS_BADGE } from "./appointmentStatus";

export default function UpcomingAppointments({ items, onOpen, onEdit }) {
  const sorted = sortByDateTime(items);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CalendarX className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No upcoming appointments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((apt) => {
        const status = getAppointmentStatus(apt);
        return (
          <div
            key={apt.id}
            onClick={() => onOpen(apt)}
            className="rounded-xl border border-border bg-card p-4 flex items-start gap-4 cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-medium uppercase text-primary">{apt.date?.slice(5, 7) || ""}</span>
              <span className="text-lg font-bold text-primary leading-none">{apt.date?.slice(8, 10) || ""}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{apt.patient_name}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status]}`}>{status}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(apt); }}
                    className="text-muted-foreground hover:text-foreground"
                    title="Edit appointment"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {apt.reason && <p className="text-sm text-muted-foreground mt-1">{apt.reason}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.time}</span>
                <span>CIN: {apt.patient_cin}</span>
                {apt.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.location}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}