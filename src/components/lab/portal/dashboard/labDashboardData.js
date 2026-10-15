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

// Payments are stored as text. Aggregate equal values on the server, then
// interpret each amount's frequency without downloading payment records.
function paymentTotal(result) {
  if (result.truncated) return null;
  let total = 0;
  for (const row of result.rows) {
    const amount = Number(row.payment_amount);
    if (!Number.isFinite(amount) || amount < 0) return null;
    total += amount * row.count;
  }
  return total;
}

export default async function labDashboardData(profile, day) {
  const start = new Date(`${day}T00:00:00+02:00`).toISOString();
  const end = new Date(new Date(start).getTime() + 86400000).toISOString();
  const scope = { lab_id: profile.id };
  const missingAuthorization = { $or: [{ authorization_datetime: { $exists: false } }, { authorization_datetime: null }, { authorization_datetime: "" }] };
  const paymentQuery = { ...scope, payment_amount: { $exists: true, $nin: [null, ""] } };
  const [received, statusGroups, attention, todayPayments, allPayments, activity] = await Promise.all([
    base44.entities.LabRequest.count({ ...scope, $or: [
      { authorization_datetime: { $gte: start, $lt: end } },
      { $and: [missingAuthorization, { date_requested: day }] },
    ] }),
    base44.entities.LabRequest.aggregate({ query: scope, groupBy: ["status", "result_verified"], limit: 50 }),
    base44.entities.LabRequest.count({ ...scope, status: { $in: ["requested", "authorized", "pending"] }, $or: [
      { priority: { $in: ["Urgent", "Stat"] } },
      { authorization_datetime: { $lt: start, $nin: [null, ""] } },
      { $and: [missingAuthorization, { date_requested: { $lt: day } }] },
    ] }),
    base44.entities.LabRequest.aggregate({ query: { ...paymentQuery, payment_datetime: { $gte: start, $lt: end } }, groupBy: "payment_amount", limit: 1000 }),
    base44.entities.LabRequest.aggregate({ query: paymentQuery, groupBy: "payment_amount", limit: 1000 }),
    base44.entities.LabAuditLog.filter({ laboratory_id: profile.id }, { sort: "-created_date", limit: 8 }),
  ]);
  const countStatus = (status, verified) => statusGroups.rows.reduce((total, row) => (
    row.status === status && (verified === undefined || Boolean(row.result_verified) === verified)
      ? total + row.count : total
  ), 0);
  return {
    received, attention, processing: countStatus("pending"), completed: countStatus("results", true),
    awaitingVerification: countStatus("results", false),
    collectedToday: paymentTotal(todayPayments), collectedTotal: paymentTotal(allPayments),
    activity: activity.items,
  };
}