// Formatting helpers for the Hospital Command Center. Every value shown came
// from the hospital's own records; a value that could not be measured is
// rendered as "—" rather than as zero.

export const formatCount = (v) =>
  v === null || v === undefined ? "—" : Number(v).toLocaleString();

export const formatMoney = (v) =>
  v === null || v === undefined
    ? "—"
    : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const timeAgo = (iso) => {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(mins)) return "";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export const SEVERITY = {
  critical: { dot: "bg-critical", chip: "bg-critical/10 text-critical border-critical/30", label: "Urgent" },
  warning: { dot: "bg-warning", chip: "bg-warning/10 text-warning border-warning/30", label: "Attention" },
  info: { dot: "bg-info", chip: "bg-info/10 text-info border-info/30", label: "Follow-up" },
};

export const ACTIVITY_ICON = {
  checkin: "checkin",
  visit: "visit",
  lab: "lab",
  imaging: "imaging",
  prescription: "prescription",
};