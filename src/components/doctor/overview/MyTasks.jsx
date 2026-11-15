import React from "react";
import { ListChecks, ArrowRight } from "lucide-react";

// My Tasks — the outstanding work already counted in the summary cards,
// each row opening the section where it is handled.
export default function MyTasks({ stats, appointmentsToday = 0, onNavigate }) {
  const tasks = [];
  if (appointmentsToday > 0) {
    tasks.push({
      key: "appointments",
      label: `See ${appointmentsToday} patient${appointmentsToday === 1 ? "" : "s"} today`,
      tab: "appointments",
    });
  }
  if ((stats?.labs || 0) > 0) {
    tasks.push({
      key: "labs",
      label: `Follow up on ${stats.labs} lab request${stats.labs === 1 ? "" : "s"}`,
      tab: "labs",
    });
  }
  if ((stats?.imaging || 0) > 0) {
    tasks.push({
      key: "imaging",
      label: `Review ${stats.imaging} imaging request${stats.imaging === 1 ? "" : "s"}`,
      tab: "imaging",
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <ListChecks className="h-4 w-4 text-doctor-blue" />
        <h3 className="text-sm font-semibold text-foreground">Upcoming Tasks</h3>
      </div>
      {tasks.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing outstanding right now.</p>
      ) : (
        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <button
              key={task.key}
              type="button"
              onClick={() => onNavigate?.(task.tab)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-accent/50"
            >
              <span className="h-4 w-4 shrink-0 rounded-full border-2 border-doctor-blue/40" aria-hidden="true" />
              <span className="flex-1 text-sm text-foreground">{task.label}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}