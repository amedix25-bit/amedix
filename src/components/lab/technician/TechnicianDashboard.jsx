import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  ArrowRight as ArrowRightIcon,
  ClipboardList as ClipboardListIcon,
  FileCheck as FileCheckIcon,
  CheckCircle2 as CheckCircle2Icon,
  Clock as ClockIcon,
  ScanLine as ScanLineIcon,
  Search as SearchIcon,
  TestTube as TestTubeIcon,
  Users as UsersIcon,
  Banknote as BanknoteIcon,
  Wallet as WalletIcon,
  FlaskConical as FlaskConicalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTION_LABELS = {
  technician_login: "Technician signed in",
  patient_identified: "New laboratory request received",
  patient_checked_in: "Patient checked in",
  tests_completed: "Test batch completed",
  results_uploaded: "Results uploaded",
  results_ready: "Results ready for the patient",
  patient_notified: "Patient notified",
};

const ACTION_BADGES = {
  patient_identified: { label: "New", className: "bg-blue-100 text-blue-700" },
  patient_checked_in: { label: "New", className: "bg-blue-100 text-blue-700" },
  tests_completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
  results_uploaded: { label: "Uploaded", className: "bg-purple-100 text-purple-700" },
  results_ready: { label: "Ready", className: "bg-emerald-100 text-emerald-700" },
  patient_notified: { label: "Notified", className: "bg-slate-100 text-slate-600" },
};

function money(n) {
  const v = Number.isFinite(n) ? n : 0;
  return `LYD ${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isToday(iso) {
  if (!iso) return false;
  try {
    const d = new Date(iso);
    return todayKey() === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return false;
  }
}

export default function TechnicianDashboard({ session, onNavigate }) {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [requests, audits] = await Promise.all([
          base44.entities.LabRequest.filter(
            { lab_id: session.laboratory_id },
            { sort: "-date_requested", limit: 300 }
          ),
          base44.entities.LabAuditLog.filter({ laboratory_id: session.laboratory_id }, "-created_date", 8),
        ]);
        setData({ requests, audits });
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [session.laboratory_id]);

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const re = { $regex: q, $options: "i" };
        const found = await base44.entities.LabRequest.filter(
          { lab_id: session.laboratory_id, $or: [{ request_id: re }, { patient_cin: re }, { patient_name: re }] },
          { sort: "-date_requested", limit: 5 }
        );
        setSearchResults(found.items || found);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, session.laboratory_id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  const today = todayKey();
  const todayRequests = data.requests.filter((r) => r.date_requested === today);
  const ordersReceived = todayRequests.length;
  const inProgress = data.requests.filter((r) => r.status === "pending").length;
  const completed = data.requests.filter((r) => r.status === "results" && r.result_verified).length;

  const openRequests = data.requests.filter((r) => r.status !== "results" && r.status !== "cancelled");
  const delayed = openRequests.filter(
    (r) => (r.date_requested && r.date_requested < today) || ["Urgent", "Stat"].includes(r.priority)
  ).length;
  const toValidate = data.requests.filter((r) => r.status === "results" && !r.result_verified).length;

  const collectedToday = data.requests.reduce((sum, r) => {
    const amount = parseFloat(r.payment_amount);
    if (!Number.isFinite(amount)) return sum;
    return isToday(r.payment_datetime) ? sum + amount : sum;
  }, 0);

  const outstanding = data.requests
    .filter((r) => r.status === "results" && !r.payment_amount)
    .reduce((sum, r) => {
      const amount = parseFloat(r.price_amount);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  const totalBilled = collectedToday + outstanding;

  const stats = [
    { icon: ClipboardListIcon, fg: "text-blue-600", value: ordersReceived, label: "Orders received", sub: "Today" },
    { icon: TestTubeIcon, fg: "text-amber-600", value: inProgress, label: "Tests in progress", sub: "Collection or processing" },
    { icon: CheckCircle2Icon, fg: "text-emerald-600", value: completed, label: "Tests completed", sub: "Verified results" },
    { icon: ClockIcon, fg: "text-red-600", value: delayed, label: "Delayed tests", sub: "Exceeding target time" },
  ];

  const actions = [
    { icon: ScanLineIcon, label: "Scan sample", tab: "upload" },
    { icon: ClipboardListIcon, label: "Review requests", tab: "requests" },
    { icon: FileCheckIcon, label: "Validate results", tab: "queue" },
    { icon: UsersIcon, label: "View patients", tab: "patients" },
  ];

  const recentRequests = searchResults !== null ? searchResults : data.requests.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <FlaskConicalIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Laboratory Overview</h2>
              <p className="text-sm text-muted-foreground">Operations, performance &amp; financial monitoring</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
            Live
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
          <SearchIcon className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, CIN, request ID or barcode"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
        </div>

        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Reporting period</span>
          <span className="font-semibold">Today</span>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2">
                <s.icon className={`w-4 h-4 ${s.fg}`} />
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-3xl font-bold mt-2">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-border">
          <h3 className="font-semibold">Financial overview</h3>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-50/70 px-4 py-3.5">
            <WalletIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Payments collected today</p>
              <p className="text-2xl font-bold text-emerald-700">{money(collectedToday)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <BanknoteIcon className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <p className="text-muted-foreground">Outstanding</p>
                <p className="font-bold">{money(outstanding)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Total billed</p>
              <p className="font-bold">{money(totalBilled)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-border">
          <h3 className="font-semibold mb-2">Live activity</h3>
          {toValidate > 0 && (
            <button
              type="button"
              onClick={() => onNavigate?.("queue")}
              className="w-full flex items-start justify-between gap-3 py-2.5 text-left hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">Results awaiting validation</p>
                <p className="text-xs text-muted-foreground">{toValidate} result{toValidate > 1 ? "s" : ""} need verification</p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                Attention
              </span>
            </button>
          )}
          {data.audits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No activity yet. Technician actions appear here in real time.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {data.audits.map((a) => {
                const badge = ACTION_BADGES[a.action];
                return (
                  <div key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{ACTION_LABELS[a.action] || a.action}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.technician_name}
                        {a.patient_cin ? ` · ${a.patient_cin}` : ""}
                        {a.details ? ` · ${a.details}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {badge && (
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {a.created_date ? new Date(a.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-semibold">Quick actions</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => onNavigate?.(a.tab)}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-5 text-sm font-medium hover:bg-secondary transition-colors"
            >
              <a.icon className="w-5 h-5 text-foreground/70" />
              {a.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h3 className="font-semibold">Recent laboratory requests</h3>
          <Button variant="ghost" size="sm" className="gap-1 text-sm" onClick={() => onNavigate?.("requests")}>
            View all <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="rounded-xl border border-border px-4 py-1 divide-y divide-border">
          {recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">
              {search.trim() ? "No requests match your search." : "No requests yet."}
            </p>
          ) : (
            recentRequests.map((r) => {
              const badge =
                r.status === "results" && r.result_verified
                  ? { label: "Released", className: "bg-emerald-100 text-emerald-700" }
                  : ["Urgent", "Stat"].includes(r.priority)
                    ? { label: "Urgent", className: "bg-red-100 text-red-700" }
                    : r.status === "results"
                      ? { label: "Validation", className: "bg-amber-100 text-amber-700" }
                      : r.status === "pending"
                        ? { label: "Processing", className: "bg-blue-100 text-blue-700" }
                        : { label: "New", className: "bg-slate-100 text-slate-600" };
              const testName = r.tests && r.tests.length > 0 ? r.tests[0].name : "";
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.request_id || "—"}
                      {testName ? ` · ${testName}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.patient_name ? `Patient: ${r.patient_name}` : "Patient"}
                      {r.patient_cin ? ` · ${r.patient_cin}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}