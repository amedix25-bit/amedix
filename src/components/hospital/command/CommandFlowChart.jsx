import React from "react";
import { TrendingUp } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// Recorded visits per day. The bars are the counted check-ins of each day —
// there is no projection or estimated trend.
export default function CommandFlowChart({ flow }) {
  const { t } = useAppLanguage();
  const max = Math.max(1, ...flow.map((f) => f.visits));
  const total = flow.reduce((s, f) => s + f.visits, 0);

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">{t("Patient Flow — Last 7 Days")}</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {total} {t("recorded visits")}
        </span>
      </header>

      <div className="px-4 py-4">
        <div className="flex items-end justify-between gap-2 h-32">
          {flow.map((f) => (
            <div key={f.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <span className="text-[10px] text-muted-foreground tabular-nums">{f.visits}</span>
              <div
                className="w-full max-w-[26px] rounded-t bg-primary/80"
                style={{ height: `${Math.max(3, (f.visits / max) * 100)}%` }}
                title={`${f.date}: ${f.visits}`}
              />
              <span className="text-[10px] text-muted-foreground">
                {new Date(`${f.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}