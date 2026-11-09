// Command Center derivation checks. These run the real shared module against
// fixtures — no database, no network — and assert that every figure is a count
// of the records supplied, that nothing is invented, and that a figure with no
// source comes back as null (rendered as "—") rather than as zero.
import { buildCommandCenter } from "../base44/shared/hospitalCommand.ts";
import { formatCount, formatMoney, timeAgo } from "../src/lib/hospitalCommandFormat.js";

let pass = 0;
const fails = [];
const check = (cond, msg) => (cond ? (pass += 1) : fails.push(msg));

const NOW = new Date("2026-11-09T10:00:00.000Z");
const today = "2026-11-09";
const day = (n) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const profile = { id: "h1", hospital_name: "Al Noor General Hospital", location: "Tripoli" };
const user = { full_name: "Dr. Ahmed Ali", id: "u1" };

const doctors = [
  { id: "d1", status: "active", specialization: "Cardiology" },
  { id: "d2", status: "active", specialization: "Cardiology" },
  { id: "d3", status: "active", specialization: "Surgery" },
  { id: "d4", status: "pending", specialization: "Neurology" },
];

const checkins = [
  { id: "c1", status: "active", checkin_date: today, checkin_datetime: `${today}T08:15:00Z`, patient_name: "Ali", payment_amount: 50, receptionist_name: "Sara" },
  { id: "c2", status: "completed", checkin_date: today, checkin_datetime: `${today}T09:00:00Z`, patient_name: "Mona", payment_amount: 30 },
  { id: "c3", status: "completed", checkin_date: day(3), checkin_datetime: `${day(3)}T09:00:00Z`, patient_name: "Omar", payment_amount: 20 },
  { id: "c4", status: "completed", checkin_date: day(40), checkin_datetime: `${day(40)}T09:00:00Z`, patient_name: "Old", payment_amount: 999 },
];

const appointments = [
  { id: "a1", doctor_id: "d1" },
  { id: "a2", doctor_id: "d1" },
  { id: "a3", doctor_id: "d3" },
];

const labs = [
  { id: "l1", status: "authorized", created_date: "2026-11-05T08:00:00Z", patient_name: "Ali" },
  { id: "l2", status: "results", released_datetime: `${today}T07:00:00Z`, patient_name: "Mona", lab_name: "CBC", verified_by_name: "Dr. Lab" },
];

const imaging = [
  { id: "i1", workflow_status: "ready_for_reporting", modality: "CT", patient_name: "Ali", request_datetime: `${today}T06:00:00Z` },
  { id: "i2", workflow_status: "released", released_datetime: `${today}T05:00:00Z`, modality: "XR", patient_name: "Omar" },
  { id: "i3", workflow_status: "requested", request_datetime: `${today}T04:00:00Z`, patient_name: "Huda" },
];

const prescriptions = [
  { id: "p1", status: "issued", prescribed_datetime: `${today}T04:30:00Z`, patient_name: "Ali", medication_name: "Panadol", doctor_name: "Dr. Cardio" },
  { id: "p2", status: "authorized", prescribed_datetime: `${today}T03:30:00Z`, patient_name: "Mona", medication_name: "Augmentin" },
];

const base = {
  profile,
  user,
  doctorsPage: doctors,
  checkinsPage: checkins,
  appointmentsPage: appointments,
  labsPage: labs,
  imagingPage: imaging,
  prescriptionsPage: prescriptions,
  visitsTotal: 128,
  activeVisits: 1,
  checkinsToday: 2,
  pendingLabs: 2,
  pendingImaging: 1,
  pendingDoctors: 1,
  now: NOW,
};

// ── 1. Full dataset ──
const full = buildCommandCenter(base);
check(full.hospital.name === profile.hospital_name, "hospital identity is carried through");
check(full.kpis.activeDoctors === 3, "active doctors counts only ACTIVE associations (pending excluded)");
check(full.kpis.doctorsTotal === 4, "total doctors includes the pending association");
check(full.kpis.appointmentsToday === 3, "appointments today is the measured count");
check(full.kpis.visitsTotal === 128 && full.kpis.activeVisits === 1 && full.kpis.checkinsToday === 2, "visit counters pass through the measured counts");
check(full.kpis.revenueToday === 80, "revenue today sums today's recorded payments only");
check(full.kpis.revenueWindow === 100, "revenue window sums the last 30 days only (older visit excluded)");

// Alerts are raised only for real backlogs, worst first.
const keys = full.alerts.map((a) => a.key);
check(keys.includes("labs_overdue"), "an authorized lab request older than 48h raises the overdue alert");
check(keys.includes("imaging_awaiting_report"), "a study with images ready and no report raises the reporting alert");
check(keys.includes("labs_pending"), "open lab requests raise the pending alert");
check(keys.includes("imaging_open"), "open imaging requests raise the open-imaging alert");
check(keys.includes("doctors_pending"), "pending doctor associations raise the approval alert");
check(keys.includes("prescriptions_open"), "authorized-but-undispensed prescriptions raise the dispensing alert");
check(full.alerts.filter((a) => a.severity === "critical").length === 2, "exactly the two measured critical backlogs are critical");
check(full.alerts.every((a) => a.count > 0), "no alert carries a zero count");
check(full.alerts.every((a) => typeof a.target === "string" && a.target.length > 0), "every alert opens a workspace");
check(full.alerts.every((a) => a.title === undefined && a.detail === undefined), "alert text is composed on the client for translation, not baked in English");

// Departments.
const cardio = full.departments.find((d) => d.name === "Cardiology");
check(cardio.doctors === 2 && cardio.appointmentsToday === 2, "cardiology counts its own doctors and their appointments");
check(full.departments.find((d) => d.name === "Surgery").appointmentsToday === 1, "surgery counts its own appointment");
check(!full.departments.some((d) => d.name === "Neurology"), "a pending doctor is not counted as department staffing");
check(full.departments[0].name === "Cardiology", "departments are ordered by staffing");

// Activity — newest first, real records only.
check(full.activity.length > 0, "activity feed is populated from records");
const times = full.activity.map((a) => new Date(a.at).getTime());
check(times.every((t, i) => i === 0 || times[i - 1] >= t), "activity is newest first");
check(full.activity.some((a) => a.kind === "checkin" && a.title === "Patient checked in"), "an active check-in appears as a check-in event");
check(full.activity.some((a) => a.kind === "lab"), "released lab results appear in activity");
check(full.activity.some((a) => a.kind === "imaging"), "released imaging appears in activity");
check(full.activity.every((a) => a.title !== "Laboratory results available" || a.detail.includes("CBC")), "lab activity carries the patient and lab name");

// Patient flow — 7 counted days.
check(full.flow.length === 7, "flow covers seven days");
check(full.flow[6].date === today && full.flow[6].visits === 2, "today's flow bar counts today's recorded visits");
check(full.flow.reduce((s, f) => s + f.visits, 0) === 3, "flow total matches the recorded visits in the window");

// ── 2. Empty hospital — nothing measured, nothing invented ──
const empty = buildCommandCenter({
  profile,
  user,
  doctorsPage: [],
  checkinsPage: [],
  appointmentsPage: [],
  labsPage: [],
  imagingPage: [],
  prescriptionsPage: [],
  visitsTotal: 0,
  activeVisits: 0,
  checkinsToday: 0,
  pendingLabs: 0,
  pendingImaging: 0,
  pendingDoctors: 0,
  now: NOW,
});
check(empty.alerts.length === 0, "an empty hospital raises no alerts");
check(empty.activity.length === 0, "an empty hospital shows no activity");
check(empty.departments.length === 0, "an empty hospital shows no departments");
check(empty.kpis.revenueToday === 0, "a hospital with no payments shows zero revenue, not a fabricated figure");
check(empty.flow.every((f) => f.visits === 0), "empty flow days are zero visits");

// ── 3. Figures that could not be read come back as null, never as zero ──
const unread = buildCommandCenter({
  ...base,
  appointmentsPage: null,
  visitsTotal: null,
  activeVisits: null,
  checkinsToday: null,
  pendingLabs: null,
  pendingImaging: null,
  pendingDoctors: null,
});
check(unread.kpis.appointmentsToday === null, "an unreadable appointment count is null");
check(unread.kpis.visitsTotal === null, "an unreadable visit count is null");
check(formatCount(unread.kpis.visitsTotal) === "—", "a null figure renders as a dash");
check(formatMoney(empty.kpis.revenueToday) === "0.00", "a measured zero revenue renders as 0.00");
check(unread.alerts.every((a) => a.key !== "labs_pending"), "no pending-lab alert without a measured count");

// ── 4. Formatting helpers ──
check(formatCount(0) === "0", "zero counts render as 0");
check(formatMoney(12850) === "12,850.00", "revenue renders with two decimals and grouping");
check(timeAgo(new Date(NOW.getTime() - 5 * 60000).toISOString(), NOW) !== undefined, "timeAgo handles recent timestamps");
check(timeAgo(null) === "", "a missing timestamp renders as empty, not 'Invalid Date'");

if (fails.length > 0) {
  console.error(`\n✗ ${fails.length} command center check(s) failed:`);
  fails.forEach((f) => console.error(`  · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pass} command center checks passed.`);