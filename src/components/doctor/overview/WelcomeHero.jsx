import React from "react";
import { CalendarDays, Clock, Stethoscope } from "lucide-react";
import { Image } from "@/components/ui/image";
import { specialtyHeroArt } from "@/lib/specialtyHeroArt";

// Overview welcome banner — the greeting, the day's date and time over the
// blue banner, with the doctor's own specialty artwork behind it.
export default function WelcomeHero({ greeting, doctorName, specialty, hospitalName, now = new Date() }) {
  const art = specialtyHeroArt(specialty);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#002d62] to-[#004a99] text-white shadow-sm">
      {art && (
        <>
          <Image
            src={art}
            alt=""
            fittingType="fill"
            className="absolute inset-y-0 right-0 h-full w-full sm:w-3/5"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002d62]/95 via-[#002d62]/70 to-[#002d62]/10" />
        </>
      )}

      <div className="relative px-6 py-6 sm:px-8">
        <h2 className="text-xl font-bold leading-tight sm:text-2xl">
          {greeting}, {doctorName} <span aria-hidden="true">👋</span>
        </h2>
        <p className="mt-1 text-sm text-white/85">Here's your clinical overview for today.</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {specialty && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Stethoscope className="h-3.5 w-3.5" />
              {specialty}
            </span>
          )}
          {hospitalName && (
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
              {hospitalName}
            </span>
          )}
        </div>

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
    </section>
  );
}