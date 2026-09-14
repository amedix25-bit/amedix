// Date-range helpers for the Manage Patients section. Check-in dates are
// stored as YYYY-MM-DD strings, so ISO string comparison is exact.

export function localDateStr(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function rangeForFilter(mode, from, to) {
  const now = new Date();
  const todayStr = localDateStr(now);
  if (mode === "today") {
    return { from: todayStr, to: todayStr };
  }
  if (mode === "week") {
    const mondayOffset = (now.getDay() + 6) % 7; // Monday-based week
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    return { from: localDateStr(monday), to: todayStr };
  }
  if (mode === "month") {
    return { from: `${todayStr.slice(0, 7)}-01`, to: todayStr };
  }
  if (mode === "custom") {
    return { from: from || null, to: to || null };
  }
  return { from: null, to: null }; // all time
}