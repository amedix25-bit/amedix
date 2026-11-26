import { base44 } from "@/api/base44Client";

export function laboratoryDay() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Tripoli", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type) => parts.find((p) => p.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function laboratoryMoney(value) {
  return value == null ? "Not available" : `LYD ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Lab requests carry field-level access rules, so the server refuses grouped
// reads (aggregate) on them. The laboratory's own requests are read page by
// page instead and the same counts and payment totals are computed here.
const READ_CAP = 2000;

async function loadScopedRequests(scope) {
  const rows = [];
  let cursor;
  for (;;) {
    const page = await base44.entities.LabRequest.filter(scope, { limit: 200, cursor, sort: "-created_date" });
    rows.push(...(page.items || []));
    if (!page.has_more) return { rows, complete: true };
    if (!page.next_cursor || rows.length >= READ_CAP) return { rows, complete: false };
    cursor = page.next_cursor;
  }
}

export default async function labDashboardData(profile, day) {
  const start = new Date(`${day}T00:00:00+02:00`).toISOString();
  const end = new Date(new Date(start).getTime() + 86400000).toISOString();
  const scope = { lab_id: profile.id };
  const missingAuthorization = { $or: [{ authorization_datetime: { $exists: false } }, { authorization_datetime: null }, { authorization_datetime: "" }] };
  const [received, attention, scoped, activity] = await Promise.all([
    base44.entities.LabRequest.count({ ...scope, $or: [
      { authorization_datetime: { $gte: start, $lt: end } },
      { $and: [missingAuthorization, { date_requested: day }] },
    ] }),
    base44.entities.LabRequest.count({ ...scope, status: { $in: ["requested", "authorized", "pending"] }, $or: [
      { priority: { $in: ["Urgent", "Stat"] } },
      { authorization_datetime: { $lt: start, $nin: [null, ""] } },
      { $and: [missingAuthorization, { date_requested: { $lt: day } }] },
    ] }),
    loadScopedRequests(scope),
    base44.entities.LabAuditLog.filter({ laboratory_id: profile.id }, { sort: "-created_date", limit: 8 }),
  ]);

  const countStatus = (status, verified) => scoped.rows.filter((row) => (
    row.status === status && (verified === undefined || Boolean(row.result_verified) === verified)
  )).length;

  // Payments are stored as text. An unreadable amount, or a set too large to
  // read completely, reports "Not available" rather than a partial total.
  const paymentTotal = (from, to) => {
    if (!scoped.complete) return null;
    let total = 0;
    for (const row of scoped.rows) {
      const raw = row.payment_amount;
      if (raw === undefined || raw === null || raw === "") continue;
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount < 0) return null;
      const at = row.payment_datetime || "";
      if (!at || at < from || at >= to) continue;
      total += amount;
    }
    return total;
  };

  return {
    received, attention, processing: countStatus("pending"), completed: countStatus("results", true),
    awaitingVerification: countStatus("results", false),
    collectedToday: paymentTotal(start, end), collectedTotal: paymentTotal("", "\uffff"),
    activity: activity.items,
  };
}