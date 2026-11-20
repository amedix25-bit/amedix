import React from "react";
import { cn } from "@/lib/utils";
import { useAppLanguage } from "@/lib/appLanguage";
import { foundersFor } from "@/lib/founders";

// The founders' credit. Both names are rendered exactly as stored — one per
// line, so a narrow phone never breaks or reorders them.
export default function FoundersCredit({ className }) {
  const { t, isArabic } = useAppLanguage();
  const names = foundersFor(isArabic);

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={cn(
        "mx-auto w-full max-w-md rounded-2xl border border-border/70 bg-card/70 px-5 py-3 backdrop-blur sm:py-4",
        className
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {t("Founded by")}
      </p>
      <div className="mt-2 space-y-0.5">
        {names.map((name) => (
          <p key={name} className="font-heading text-base font-semibold leading-snug text-foreground sm:text-lg">
            {name}
          </p>
        ))}
      </div>
    </div>
  );
}