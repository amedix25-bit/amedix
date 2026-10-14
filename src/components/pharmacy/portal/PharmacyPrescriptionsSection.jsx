import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";
import PrescriptionActions from "@/components/pharmacy/PrescriptionActions";
import DispensingHistory from "@/components/pharmacy/DispensingHistory";
import { prescriptionRemaining } from "@/components/pharmacy/PrescriptionActions";

export function PrescriptionRow({ prescription, onChanged, session }) {
  const remaining = prescriptionRemaining(prescription);
  const isPartial = prescription.status === "dispensed" && (prescription.dispensing_events || []).length > 0 && remaining > 0;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold">
            {prescription.medication_name}
            {prescription.strength ? ` ${prescription.strength}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {prescription.patient_name} · CIN {prescription.patient_cin} · {prescription.date_prescribed}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {prescription.reservation_code && prescription.status !== "dispensed" && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
              {prescription.reservation_code}
            </span>
          )}
          <PrescriptionStatusBadge status={prescription.status} />
          {isPartial && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {remaining} remaining
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
        <div><span className="text-muted-foreground">Dosage:</span> {prescription.dosage || "—"}</div>
        <div><span className="text-muted-foreground">Frequency:</span> {prescription.frequency || "—"}</div>
        <div><span className="text-muted-foreground">Duration:</span> {prescription.duration || "—"}</div>
        <div><span className="text-muted-foreground">Quantity:</span> {prescription.quantity || "—"}</div>
      </div>
      {prescription.special_instructions && (
        <p className="text-xs text-muted-foreground mt-2">Instructions: {prescription.special_instructions}</p>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Prescribed by {prescription.doctor_name || "—"}
        {prescription.dispensed_datetime && (
          <> · Dispensed {new Date(prescription.dispensed_datetime).toLocaleString()} by {prescription.dispensed_by_name || "pharmacy"}</>
        )}
        {" · "}Refills used {prescription.refills_used || 0}/{prescription.refills_authorized || 0}
      </p>
      {prescription.status === "cancelled" && (prescription.rejected_reason || prescription.cancellation_reason) && (
        <p className="text-xs text-destructive mt-2">
          {prescription.rejected_by_pharmacy_name || prescription.cancelled_by_name || ""}:
          {" "}{prescription.rejected_reason || prescription.cancellation_reason}
        </p>
      )}
      <DispensingHistory prescription={prescription} />
      <div className="mt-3">
        <PrescriptionActions prescription={prescription} onChanged={onChanged} session={session} />
      </div>
    </div>
  );
}

// The pharmacy's dispensing queue: prescriptions the patient authorized to
// this pharmacy, with reservation and dispensing actions.
export default function PharmacyPrescriptionsSection({ profile }) {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    try {
      const page = await base44.entities.Prescription.filter(
        { authorized_pharmacy_user_id: profile.user_id },
        { sort: "-created_date", limit: 100 }
      );
      setItems(page.items || page);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.user_id]);

  if (!items) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = items.filter((p) => {
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            placeholder="Search by patient, CIN, medication or reservation code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rtl:pl-3 rtl:pr-9"
          />
        </div>
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
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          No prescriptions here yet. Patients authorize your pharmacy from their Prescriptions page.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <PrescriptionRow key={p.id} prescription={p} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}