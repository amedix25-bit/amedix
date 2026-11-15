import React from "react";
import { Bell, Info, CheckCircle2, AlertTriangle } from "lucide-react";

// Notifications — the latest portal activity, coloured by what it concerns.
// Compact and height-bounded so it always fits the overview column.
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
        <Bell className="h-4 w-4 text-doctor-blue" />
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <div className="min-h-0 flex-1 divide-y divide-border overflow-hidden">
          {rows.map((item, i) => {
            const { Icon, cls } = LOOK[item.icon] || LOOK.lab;
            return (
              <div key={i} className="flex items-center gap-2.5 px-4 py-2">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${cls}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium leading-tight text-foreground">
                    {item.text}
                  </span>
                  {item.detail && (
                    <span className="block truncate text-[11px] leading-tight text-muted-foreground">{item.detail}</span>
                  )}
                </span>
                {item.at && (
                  <span className="shrink-0 whitespace-nowrap text-[10px] text-muted-foreground">{formatWhen(item.at)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}