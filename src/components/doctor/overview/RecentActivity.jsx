import React from "react";
import { UserPlus, FlaskConical, Image as ImageIcon, CalendarCheck, Activity } from "lucide-react";

const ICONS = { user: UserPlus, lab: FlaskConical, imaging: ImageIcon, calendar: CalendarCheck };

const formatWhen = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function RecentActivity({ activity }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-sm mb-4">Recent Activity</h3>
      {(!activity || activity.length === 0) ? (
        <p className="text-sm text-muted-foreground">No recent activity yet.</p>
      ) : (
        <div className="space-y-4">
          {activity.map((item, i) => {
            const Icon = ICONS[item.icon] || Activity;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.text}</p>
                  {item.detail && <p className="text-xs text-muted-foreground truncate">{item.detail}</p>}
                  {item.at && <p className="text-xs text-muted-foreground/70 mt-0.5">{formatWhen(item.at)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}