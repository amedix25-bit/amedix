import React from "react";
import { UserCheck } from "lucide-react";
import { THREAD_STATUS_META } from "@/lib/messaging";

// Administrative controls on a hospital conversation: status, responsible staff
// and the department it is assigned to. Every change is applied server-side and
// recorded in the append-only audit trail.
export default function HospitalConversationControls({ thread, staff = [], departments = [], actor, onUpdate, busy }) {
  const staffOptions = [
    { user_id: actor?.user_id, name: `${actor?.display_name || "Me"} (me)` },
    ...staff.filter((s) => s.status === "active" && s.user_id !== actor?.user_id).map((s) => ({ user_id: s.user_id, name: `${s.name} — ${s.department || "Staff"}` })),
  ];
  const departmentOptions = [...new Set([...departments, ...staff.map((s) => s.department)].filter(Boolean))].sort();

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/30 p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
        {Object.entries(THREAD_STATUS_META).map(([key, meta]) => (
          <button
            key={key}
            disabled={busy}
            onClick={() => onUpdate({ status: key })}
            className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
              thread.status === key ? meta.className : "border-border bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            {meta.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> Responsible staff</span>
          <select
            disabled={busy}
            value={thread.assigned_staff_user_id || ""}
            onChange={(e) => onUpdate({ assigned_staff_user_id: e.target.value })}
            className="mt-1 h-8 w-full rounded-md border border-input bg-card px-2 text-[11px] text-foreground"
          >
            <option value="">Unassigned</option>
            {staffOptions.map((s) => (
              <option key={s.user_id} value={s.user_id}>{s.name}</option>
            ))}
            {thread.assigned_staff_user_id && !staffOptions.some((s) => s.user_id === thread.assigned_staff_user_id) && (
              <option value={thread.assigned_staff_user_id}>{thread.assigned_staff_name} (assigned)</option>
            )}
          </select>
        </label>
        <label className="text-[11px] text-muted-foreground">
          Assigned department
          <select
            disabled={busy}
            value={thread.assigned_department || ""}
            onChange={(e) => onUpdate({ assigned_department: e.target.value })}
            className="mt-1 h-8 w-full rounded-md border border-input bg-card px-2 text-[11px] text-foreground"
          >
            <option value="">No department</option>
            {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {thread.assigned_staff_name ? `Responsible: ${thread.assigned_staff_name}` : "No responsible staff assigned"}
        {thread.assigned_department ? ` · ${thread.assigned_department}` : ""}
      </p>
    </div>
  );
}