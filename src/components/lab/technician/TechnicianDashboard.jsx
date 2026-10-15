import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  ArrowRight as ArrowRightIcon,
  AlertTriangle as AlertTriangleIcon,
  ClipboardCheck as ClipboardCheckIcon,
  ClipboardList as ClipboardListIcon,
  FileCheck as FileCheckIcon,
  FlaskConical as FlaskConicalIcon,
  ScanLine as ScanLineIcon,
  Search as SearchIcon,
  TestTube as TestTubeIcon,
  Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTION_LABELS = {
  technician_login: "Technician signed in",
  patient_identified: "Patient identified",
  patient_checked_in: "Patient checked in",
  tests_completed: "Tests completed",
  results_uploaded: "Results uploaded",
  results_ready: "Results ready",
  patient_notified: "Patient notified",
};

function requestBadge(r) {
  if (r.status === "results" && r.result_verified) {
    return { label: "Released", className: "bg-emerald-100 text-emerald-700" };
  }
  if (r.priority === "Urgent" || r.priority === "Stat") {
    return { label: "Urgent", className: "bg-red-100 text-red-700" };
  }
  if (r.status === "results") {
    return { label: "Validation", className: "bg-amber-100 text-amber-700" };
  }
  if (r.status === "pending") {
    return { label: "Processing", className: "bg-blue-100 text-blue-700" };
  }
  return { label: "New", className: "bg-slate-100 text-slate-600" };
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
          base44.entities.LabRequest.filter({ lab_id: session.laboratory_id }, "-date_requested"),
          base44.entities.LabAuditLog.filter({ laboratory_id: session.laboratory_id }, "-created_date", 10),
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
          "-date_requested",
          5
        );
        setSearchResults(found);
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

  const newRequests = data.requests.filter((r) => ["requested", "authorized"].includes(r.status)).length;
  const samplesPending = data.requests.filter((r) => r.status === "pending").length;
  const toValidate = data.requests.filter((r) => r.status === "results" && !r.result_verified).length;
  const urgentRequests = data.requests.filter(
    (r) => ["Urgent", "Stat"].includes(r.priority) && r.status !== "results"
  ).length;

  const stats = [
    { icon: ClipboardListIcon, bg: "bg-blue-50", fg: "text-blue-600", value: newRequests, label: "New requests", sub: "Awaiting review" },
    { icon: TestTubeIcon, bg: "bg-amber-50", fg: "text-amber-600", value: samplesPending, label: "Samples pending", sub: "Collection or processing" },
    { icon: FileCheckIcon, bg: "bg-purple-50", fg: "text-purple-600", value: toValidate, label: "Results to validate", sub: "Awaiting verification" },
    { icon: AlertTriangleIcon, bg: "bg-red-50", fg: "text-red-600", value: urgentRequests, label: "Urgent requests", sub: "Priority attention" },
  ];

  const actions = [
    { icon: ScanLineIcon, label: "Scan sample", tab: "upload" },
    { icon: ClipboardCheckIcon, label: "Review requests", tab: "requests" },
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
              <h2 className="text-lg font-bold">{session.laboratory_name}</h2>
              <p className="text-sm text-muted-foreground">Laboratory Operations Dashboard</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
            Operational
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

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.fg}`} />
              </div>
              <p className="text-3xl font-bold mt-2">{s.value}</p>
              <p className="text-sm font-semibold mt-1">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <h3 className="font-semibold mt-6 mb-3">Quick actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              const badge = requestBadge(r);
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

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        {data.audits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activity yet. Technician actions are recorded here with date, time, and the responsible technician.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {data.audits.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{ACTION_LABELS[a.action] || a.action}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.technician_name}
                    {a.patient_cin ? ` · ${a.patient_cin}` : ""}
                    {a.details ? ` · ${a.details}` : ""}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {a.created_date ? new Date(a.created_date).toLocaleString() : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}