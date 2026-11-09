import React from "react";
import { ClipboardCheck, CheckCircle2, FlaskConical, Radiation, Pill, History } from "lucide-react";
import { timeAgo } from "@/lib/hospitalCommandFormat";
import { useAppLanguage } from "@/lib/appLanguage";

const ICONS = {
  checkin: ClipboardCheck,
  visit: CheckCircle2,
  lab: FlaskConical,
  imaging: Radiation,
  prescription: Pill,
};

// Recent hospital activity — assembled from the hospital's own records, newest
// first, with the responsible staff member where one is recorded.
export default function CommandActivityFeed({ activity }) {
  const { t } = useAppLanguage();

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <History className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{t("Recent Hospital Activity")}</h2>
      </header>

      {activity.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {t("No activity recorded yet.")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {activity.map((a) => {
            const Icon = ICONS[a.kind] || ClipboardCheck;
            return (
              <li key={a.id} className="px-4 py-3 flex items-start gap-3">
                <span className="mt-0.5 rounded-lg bg-secondary p-1.5 text-primary shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{t(a.title)}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                  {a.actor ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.actor}</p>
                  ) : null}
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(a.at)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}