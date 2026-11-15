import React from "react";
import { UserPlus, FlaskConical, Image as ImageIcon, CalendarCheck, Activity } from "lucide-react";

const ICONS = { user: UserPlus, lab: FlaskConical, imaging: ImageIcon, calendar: CalendarCheck };

// Notification dot colour follows what the item is about.
const DOT = { user: "bg-doctor-blue", lab: "bg-orange-500", imaging: "bg-emerald-500", calendar: "bg-violet-500" };

const formatWhen = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function RecentActivity({ activity }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Activity className="h-4 w-4 text-doctor-blue" />
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
      </div>
      {!activity || activity.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No recent activity yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {activity.map((item, i) => {
            const Icon = ICONS[item.icon] || Activity;
            return (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[item.icon] || "bg-slate-400"}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{item.text}</span>
                  {item.detail && <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>}
                  {item.at && <span className="mt-0.5 block text-[11px] text-muted-foreground/80">{formatWhen(item.at)}</span>}
                </span>
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}