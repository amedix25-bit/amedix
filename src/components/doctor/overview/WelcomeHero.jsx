import React from "react";
import { CalendarDays, Clock } from "lucide-react";

// Overview welcome banner — the greeting, the day's date and time over the
// blue banner. The artwork slot on the right stays empty until an image is
// supplied for it.
export default function WelcomeHero({ greeting, doctorName, hospitalName, now = new Date() }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0D47A1] to-[#1976D2] px-6 py-6 text-white shadow-sm sm:px-8">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-tight sm:text-2xl">
            {greeting}, {doctorName} <span aria-hidden="true">👋</span>
          </h2>
          <p className="mt-1 text-sm text-white/85">Wishing you a productive day with AMedix</p>
          {hospitalName && <p className="mt-1 truncate text-xs text-white/70">{hospitalName}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
        {/* Reserved artwork slot — intentionally blank. */}
        <div className="hidden h-28 w-40 shrink-0 rounded-2xl sm:block" aria-hidden="true" />
      </div>
    </section>
  );
}