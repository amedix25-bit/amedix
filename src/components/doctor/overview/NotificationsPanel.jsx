import React from "react";
import { Bell, Info, CheckCircle2, AlertTriangle } from "lucide-react";

// Notifications — the latest portal activity, coloured by what it concerns.
const LOOK = {
  lab: { Icon: Info, cls: "bg-[#E3F1FF] text-[#2563EB]" },
  imaging: { Icon: CheckCircle2, cls: "bg-[#E8F5E9] text-[#16A34A]" },
  user: { Icon: Info, cls: "bg-[#E3F1FF] text-[#2563EB]" },
  calendar: { Icon: AlertTriangle, cls: "bg-[#FFF3E0] text-[#EA580C]" },
};

const formatWhen = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function NotificationsPanel({ activity }) {
  const rows = (activity || []).slice(0, 3);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Bell className="h-4 w-4 text-doctor-blue" />
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((item, i) => {
            const { Icon, cls } = LOOK[item.icon] || LOOK.lab;
            return (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cls}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{item.text}</span>
                  {item.detail && <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>}
                </span>
                {item.at && (
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">{formatWhen(item.at)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}