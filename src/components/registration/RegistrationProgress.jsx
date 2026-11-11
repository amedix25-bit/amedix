import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLanguage } from "@/lib/appLanguage";

// The four steps of a professional registration, shown identically for doctors
// (Hospital Code → Email → Professional Information → Hospital Approval) and
// for institutions (Administration Code → Email → Institution Information →
// AMedix Approval).
export default function RegistrationProgress({ steps, current = 0 }) {
  const { t } = useAppLanguage();
  return (
    <ol className="mb-5 flex items-start gap-1.5" aria-label={t("Registration progress")}>
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className={cn("text-[11px] leading-tight", active ? "font-medium text-foreground" : "text-muted-foreground")}>
              {t(label)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}