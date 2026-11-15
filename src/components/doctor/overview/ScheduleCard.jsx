import React, { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// My Schedule — the current month at a glance, today circled.
export default function ScheduleCard({ now = new Date() }) {
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const isThisMonth = view.year === now.getFullYear() && view.month === now.getMonth();

  const shiftMonth = (delta) => {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-doctor-blue" />
          <h3 className="text-sm font-semibold text-foreground">My Schedule</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="mb-3 text-center text-sm font-semibold text-foreground">
          {MONTHS[view.month]} {view.year}
        </p>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAYS.map((day, i) => (
            <span key={`${day}-${i}`} className="text-[11px] font-medium text-muted-foreground">
              {day}
            </span>
          ))}
          {cells.map((day, i) => {
            if (!day) return <span key={`empty-${i}`} />;
            const isToday = isThisMonth && day === now.getDate();
            return (
              <span
                key={day}
                className={
                  isToday
                    ? "mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white"
                    : "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs text-foreground"
                }
              >
                {day}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}