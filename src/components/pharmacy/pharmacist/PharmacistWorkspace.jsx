import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Pill, ScanLine } from "lucide-react";
import { PrescriptionRow } from "@/components/pharmacy/portal/PharmacyPrescriptionsSection";
import PharmacyPatientLookupSection from "@/components/pharmacy/portal/PharmacyPatientLookupSection";
import { clearPharmacistSession } from "@/lib/pharmacistSession";

// The pharmacist's operational workspace: the pharmacy's dispensing queue
// and the patient identification counter. All data flows through the
// pharmacist's individual session — they can only reach their assigned
// pharmacy's records.
export default function PharmacistWorkspace({ session, onSessionExpired }) {
  const [tab, setTab] = useState("prescriptions");
  const [pharmacy, setPharmacy] = useState(null);
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
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (!q) return true;
    return (
      (p.patient_name || "").toLowerCase().includes(q) ||
      (p.patient_cin || "").toLowerCase().includes(q) ||
      (p.medication_name || "").toLowerCase().includes(q) ||
      (p.reservation_code || "").toLowerCase().includes(q)
    );
  });

  const filters = [
    { key: "all", label: "All" },
    { key: "authorized", label: "Awaiting Reservation" },
    { key: "reserved", label: "Reserved" },
    { key: "dispensed", label: "Dispensed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex rounded-xl border border-border bg-card p-1 gap-1">
        <button
          type="button"
          onClick={() => setTab("prescriptions")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "prescriptions" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <Pill className="w-4 h-4" />
          Prescriptions
        </button>
        <button
          type="button"
          onClick={() => setTab("patients")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "patients" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <ScanLine className="w-4 h-4" />
          Identify Patient
        </button>
      </div>

      {tab === "prescriptions" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <Input
              placeholder="Search by patient, CIN, medication or reservation code..."
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
      )}

      {tab === "patients" && <PharmacyPatientLookupSection session={session} />}
    </div>
  );
}