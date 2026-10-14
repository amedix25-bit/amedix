import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Loader2, BarChart3, Users, UserCheck, Pill, Package, Wallet, AlertTriangle, Clock3 } from "lucide-react";

const METHOD_LABELS = {
  cash: "Cash", card: "Card", bank_transfer: "Bank Transfer",
  insurance: "Insurance", mobile_wallet: "Mobile Wallet", other: "Other",
};

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom Range" },
];

const fmt = (n) => (Number(n) || 0).toLocaleString();

// Pharmacy administrator operations report — visits, dispensing, financials
// and inventory alerts, all derived from the underlying transaction records.
export default function PharmacyReportsSection({ profile }) {
  const [period, setPeriod] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pharmacist, setPharmacist] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("pharmacyDashboardReport", {
        period, start_date: startDate, end_date: endDate, pharmacist,
      });
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "The report failed to load.");
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, pharmacist]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-3 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                period === p.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-end">
          {period === "custom" && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">From</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs w-36" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">To</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs w-36" />
              </div>
            </>
          )}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Pharmacist</label>
            <Input
              value={pharmacist}
              onChange={(e) => setPharmacist(e.target.value)}
              placeholder="All pharmacists"
              className="h-8 text-xs w-44"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading report...
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !report ? null : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: Users, label: "Patients Served", value: fmt(report.visits.patients_served) },
              { icon: UserCheck, label: "Unique Patients", value: fmt(report.visits.unique_patients) },
              { icon: Clock3, label: "Completed Visits", value: fmt(report.visits.completed) },
              { icon: Pill, label: "Dispensed Fills", value: fmt(report.prescriptions.dispensed_fills) },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl border border-border bg-card p-3">
                  <Icon className="w-4 h-4 text-primary" />
                  <p className="text-xl font-bold mt-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Prescription Pipeline</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                { label: "Pending Reservation", value: report.prescriptions.pending_authorized },
                { label: "Outstanding (Reserved)", value: report.prescriptions.pending_reserved },
                { label: "Partially Dispensed", value: report.prescriptions.partially_dispensed },
                { label: "Unavailable / Rejected", value: report.prescriptions.unavailable },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border p-2.5">
                  <p className="text-lg font-bold">{fmt(s.value)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {fmt(report.prescriptions.units_dispensed)} units dispensed · {fmt(report.prescriptions.refill_fills)} refill fill(s) · pipeline counts are current open states.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Financial Summary</h3>
            </div>
            <div className="divide-y divide-border">
              {[
                { label: "Gross Charges (amount due)", value: report.financial.gross_charges },
                { label: "Payments Collected (verified)", value: report.financial.collected },
                { label: "Insurance / Non-cash Pending Verification", value: report.financial.pending_verification },
                { label: "Outstanding Balances", value: report.financial.outstanding },
                { label: "Refunds", value: -report.financial.refunds },
                { label: "Adjustments", value: report.financial.adjustments },
                { label: "Net Collected", value: report.financial.net_collected, bold: true },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between py-2 text-sm">
                  <span className={r.bold ? "font-semibold" : "text-muted-foreground"}>{r.label}</span>
                  <span className={r.bold ? "font-bold" : "font-medium"}>{r.value}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Figures come directly from payment transaction records. These are revenue collections, not profit — cost and expense data are not part of this report.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Payments by Method</h3>
            {Object.keys(report.by_method || {}).length === 0 ? (
              <p className="text-xs text-muted-foreground">No payments recorded in this period.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(report.by_method).map(([m, v]) => (
                  <div key={m} className="rounded-lg border border-border p-2.5">
                    <p className="text-sm font-bold">{v}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{METHOD_LABELS[m] || m}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">By Pharmacist</h3>
            {Object.keys(report.by_pharmacist || {}).length === 0 ? (
              <p className="text-xs text-muted-foreground">No transactions in this period.</p>
            ) : (
              <div className="divide-y divide-border">
                {Object.entries(report.by_pharmacist).map(([name, s]) => (
                  <div key={name} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium truncate">{name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {fmt(s.transactions)} transaction(s) · collected {s.collected}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Top Medications Dispensed</h3>
            {Object.keys(report.by_medication || {}).length === 0 ? (
              <p className="text-xs text-muted-foreground">No dispensing transactions in this period.</p>
            ) : (
              <div className="divide-y divide-border">
                {Object.entries(report.by_medication).sort((a, b) => b[1].transactions - a[1].transactions).slice(0, 8).map(([name, s]) => (
                  <div key={name} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium truncate">{name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {fmt(s.units)} units · {fmt(s.transactions)} fill(s)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-sm">Inventory Alerts</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                { label: `Low Stock (≤ ${report.inventory_alerts.threshold})`, value: report.inventory_alerts.low_stock },
                { label: "Expiring Soon", value: report.inventory_alerts.expiring },
                { label: "Expired", value: report.inventory_alerts.expired },
                { label: "Quarantined", value: report.inventory_alerts.quarantined },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-amber-200 bg-white p-2.5">
                  <p className="text-lg font-bold">{fmt(s.value)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}