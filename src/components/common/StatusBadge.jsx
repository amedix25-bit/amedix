import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertTriangle, Info, MinusCircle } from "lucide-react";

// AMedix unified status colour system — the same status always has the same
// appearance across every portal. Colour is never the only signal: each tone
// also carries a distinct icon, and the status text is always shown.
export const STATUS_TONES = {
  success: {
    className: "bg-success/10 text-success ring-success/20",
    Icon: CheckCircle2,
  },
  warning: {
    className: "bg-warning/10 text-warning ring-warning/20",
    Icon: Clock,
  },
  critical: {
    className: "bg-critical/10 text-critical ring-critical/20",
    Icon: AlertTriangle,
  },
  info: {
    className: "bg-info/10 text-info ring-info/20",
    Icon: Info,
  },
  neutral: {
    className: "bg-muted text-muted-foreground ring-border",
    Icon: MinusCircle,
  },
};

// Status keywords → tone. Checked in priority order: critical states first so
// "overdue" is never rendered as a pending state, then confirmed success,
// then pending action, then informational, then inactive.
const CRITICAL = ["critical", "overdue", "rejected", "error", "failed", "urgent", "emergency", "recall"];
const SUCCESS = [
  "completed", "complete", "verified", "approved", "final", "released",
  "dispensed", "active", "accepted", "signed", "resolved", "paid",
  "delivered", "available", "confirmed", "ready", "performed", "done",
];
const WARNING = [
  "pending", "requested", "under_review", "clarification", "awaiting",
  "submitted", "partial", "expiring", "low_stock", "unsent",
];
const INFO = ["scheduled", "in_progress", "processing", "interpretation", "reporting", "open", "ongoing", "rescheduled", "replacement"];
const NEUTRAL = [
  "draft", "cancelled", "canceled", "inactive", "unavailable", "archived",
  "stopped", "discontinued", "suspended", "declined", "not_applicable",
];

export function statusTone(status) {
  const s = String(status || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (!s) return "neutral";
  const has = (list) => list.some((k) => s.includes(k));
  if (has(CRITICAL)) return "critical";
  if (has(SUCCESS)) return "success";
  if (has(WARNING)) return "warning";
  if (has(INFO)) return "info";
  if (has(NEUTRAL)) return "neutral";
  return "neutral";
}

export function statusLabel(status) {
  const s = String(status || "").replace(/[_-]+/g, " ").trim();
  if (!s) return "";
  return s
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// Reusable status badge — pass the raw status string, or override with an
// explicit tone/label where the workflow context requires it.
export default function StatusBadge({ status, label, tone, className, size = "sm" }) {
  const t = STATUS_TONES[tone || statusTone(status)] || STATUS_TONES.neutral;
  const { Icon } = t;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring-1",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        t.className,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {label || statusLabel(status) || String(status)}
    </span>
  );
}