import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Pill, ScanLine, Boxes, Receipt, UserRound } from "lucide-react";
import { PrescriptionRow } from "@/components/pharmacy/portal/PharmacyPrescriptionsSection";
import { prescriptionRemaining } from "@/components/pharmacy/PrescriptionActions";
import PharmacyPatientLookupSection from "@/components/pharmacy/portal/PharmacyPatientLookupSection";
import PharmacistInventorySection from "@/components/pharmacy/pharmacist/PharmacistInventorySection";
import PharmacistTransactionsSection from "@/components/pharmacy/pharmacist/PharmacistTransactionsSection";
import PharmacistProfileSection from "@/components/pharmacy/pharmacist/PharmacistProfileSection";
import { clearPharmacistSession } from "@/lib/pharmacistSession";

// The pharmacist's operational workspace. Every section stays mounted so a
// pharmacist can move between them without losing unsaved information, and
// all actions are saved on the backend through the pharmacist's individual
// session — they can only reach their assigned pharmacy's records.
const TABS = [
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
  { key: "patients", label: "Identify Patient", icon: ScanLine },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "payments", label: "Payments", icon: Receipt },
  { key: "profile", label: "Profile", icon: UserRound },
];

export default function PharmacistWorkspace({ session, onSessionExpired }) {
  const [tab, setTab] = useState("prescriptions");
  const [pharmacy, setPharmacy] = useState(null);
  const [pharmacist, setPharmacist] = useState(null);
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await base44.functions.invoke("pharmacistWorkspaceData", {
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      setPharmacy(res.data.pharmacy);
      setPharmacist(res.data.pharmacist || null);
      setItems(res.data.prescriptions);
    } catch (err) {
      if (err.response?.status === 401) {
        onSessionExpired?.();
        return;
      }
      setError(err.response?.data?.error || "Could not load the workspace.");
      setItems(items || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.pharmacist_id, session.session_token]);

  useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const filtered = (items || []).filter((p) => {
    if (statusFilter === "partially") {
      if (!(p.status === "dispensed" && prescriptionRemaining(p) > 0)) return false;
    } else if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (!q) return true;
    return (
      (p.patient_name || "").toLowerCase().includes(q) ||
      (p.patient_cin || "").toLowerCase().includes(q) ||
      (p.medication_name || "").toLowerCase().includes(q) ||
      (p.prescription_id || "").toLowerCase().includes(q) ||
      (p.date_prescribed || "").includes(q) ||
      (p.reservation_code || "").toLowerCase().includes(q)
    );
  });

  const filters = [
    { key: "all", label: "All" },
    { key: "authorized", label: "Pending Verification" },
    { key: "reserved", label: "Ready for Dispensing" },
    { key: "dispensed", label: "Fully Dispensed" },
    { key: "partially", label: "Partially Dispensed" },
    { key: "cancelled", label: "Cancelled / Rejected" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 rounded-xl border border-border bg-card p-1 gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Prescriptions — the dispensing queue. Stays mounted with hidden so
          an in-progress fill dialog survives moving between sections. */}
      <div className={tab === "prescriptions" ? "space-y-4" : "hidden"}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            placeholder="Search by prescription ID, patient, CIN, medication, date or reservation code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rtl:pl-3 rtl:pr-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {items === null ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            No prescriptions here yet. Patients authorize your pharmacy from their Prescriptions page.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <PrescriptionRow key={p.id} prescription={p} onChanged={load} session={session} />
            ))}
          </div>
        )}
      </div>

      <div className={tab === "patients" ? "" : "hidden"}>
        <PharmacyPatientLookupSection session={session} />
      </div>

      <div className={tab === "inventory" ? "" : "hidden"}>
        <PharmacistInventorySection session={session} onSessionExpired={onSessionExpired} />
      </div>

      <div className={tab === "payments" ? "" : "hidden"}>
        <PharmacistTransactionsSection prescriptions={items || []} session={session} onSessionExpired={onSessionExpired} />
      </div>

      <div className={tab === "profile" ? "" : "hidden"}>
        <PharmacistProfileSection session={session} pharmacist={pharmacist} pharmacy={pharmacy} />
      </div>
    </div>
  );
}