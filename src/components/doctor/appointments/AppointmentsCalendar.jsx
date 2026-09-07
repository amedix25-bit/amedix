import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAppointmentStatus, sortByDateTime, STATUS_BADGE, formatLongDate } from "./appointmentStatus";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const keyOf = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function AppointmentsCalendar({ items, onOpen }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);

  const apptsByDay = useMemo(() => {
    const map = {};
    items.forEach((a) => {
      if (!a.date) return;
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [items]);

  const weeks = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const wks = [];
    for (let i = 0; i < cells.length; i += 7) wks.push(cells.slice(i, i + 7));
    return wks;
  }, [cursor]);

  const moveMonth = (delta) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const todayKey = keyOf(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedKey = selectedDay ? keyOf(selectedDay.year, selectedDay.month, selectedDay.day) : null;
  const dayAppointments = selectedKey ? sortByDateTime(apptsByDay[selectedKey] || []) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => moveMonth(-1)} className="p-2 rounded-lg hover:bg-accent" title="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="font-semibold">
            {new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <button onClick={() => moveMonth(1)} className="p-2 rounded-lg hover:bg-accent" title="Next month">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (day === null) return <div key={di} />;
                const k = keyOf(cursor.year, cursor.month, day);
                const hasAppts = (apptsByDay[k] || []).length > 0;
                const isToday = k === todayKey;
                const isSelected = k === selectedKey;
                return (
                  <button
                    key={di}
                    onClick={() => setSelectedDay({ year: cursor.year, month: cursor.month, day })}
                    className={`relative h-11 rounded-lg text-sm flex flex-col items-center justify-center transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground font-semibold"
                      : isToday ? "bg-accent font-semibold"
                      : "hover:bg-accent/60"
                    }`}
                  >
                    {day}
                    {hasAppts && !isSelected && <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div>
        {selectedDay ? (
          <>
            <h4 className="font-semibold mb-3">{formatLongDate(keyOf(selectedDay.year, selectedDay.month, selectedDay.day))}</h4>
            {dayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments on this day.</p>
            ) : (
              <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                {dayAppointments.map((apt) => {
                  const status = getAppointmentStatus(apt);
                  return (
                    <button
                      key={apt.id}
                      onClick={() => onOpen(apt)}
                      className="w-full flex items-center gap-3 p-3 text-left text-sm hover:bg-accent/50 transition-colors"
                    >
                      <span className="font-mono font-semibold text-primary shrink-0">{apt.time || "--:--"}</span>
                      <span className="font-medium truncate">{apt.patient_name}</span>
                      <span className="text-muted-foreground text-xs truncate hidden sm:inline">CIN {apt.patient_cin}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_BADGE[status]}`}>{status}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Click on a day to see that day's appointments.</p>
        )}
      </div>
    </div>
  );
}