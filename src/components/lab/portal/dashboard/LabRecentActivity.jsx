import React from "react";
import { Activity } from "lucide-react";

const LABELS = {
  technician_login: "Technician signed in", patient_identified: "Patient identified",
  patient_checked_in: "Patient checked in", tests_completed: "Tests completed",
  results_uploaded: "Results uploaded", results_ready: "Results ready", patient_notified: "Patient notified",
};

export default function LabRecentActivity({ items }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-primary" /> Recent laboratory activity</h3>
        <p className="text-xs text-muted-foreground">Updates every 30 seconds</p>
      </div>
      {items.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No activity yet. Laboratory actions will appear here.</p> : (
        <div className="mt-3 divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{LABELS[item.action] || item.action}</p>
                <p className="mt-1 break-words text-xs text-muted-foreground">{[item.technician_name, item.patient_cin, item.details].filter(Boolean).join(" · ")}</p>
              </div>
              {item.created_date && <time className="shrink-0 text-xs text-muted-foreground" dateTime={item.created_date}>{new Date(item.created_date).toLocaleString(undefined, { timeZone: "Africa/Tripoli", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}