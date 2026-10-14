import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";

// Pharmacy dashboard: today's numbers and the latest authorized prescriptions.
export default function PharmacyDashboardSection({ profile, onOpenPrescriptions }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [prescriptions, inventory] = await Promise.all([
          base44.entities.Prescription.filter({ authorized_pharmacy_user_id: profile.user_id }, "-created_date", 200),
          base44.entities.PharmacyInventory.filter({ pharmacy_id: profile.id }),
        ]);
        setData({ prescriptions, inventory });
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [profile.id, profile.user_id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const awaiting = data.prescriptions.filter((p) => p.status === "authorized").length;
  const reserved = data.prescriptions.filter((p) => p.status === "reserved").length;
  const dispensedToday = data.prescriptions.filter(
    (p) => p.status === "dispensed" && (p.dispensed_datetime || "").slice(0, 10) === todayStr
  ).length;
  const lowStock = data.inventory.filter((i) => i.quantity_in_stock <= 10).length;

  const stats = [
    { label: "Awaiting Reservation", value: awaiting },
    { label: "Reserved", value: reserved },
    { label: "Dispensed Today", value: dispensedToday },
    { label: "Low Stock Items", value: lowStock },
  ];

  const recent = data.prescriptions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="font-semibold text-sm">Latest Authorized Prescriptions</h3>
          <button onClick={onOpenPrescriptions} className="text-xs text-primary font-medium hover:underline">
            View all
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No prescriptions yet. Patients authorize your pharmacy from their prescriptions.
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {p.medication_name}{p.strength ? ` ${p.strength}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.patient_name} · CIN {p.patient_cin} · {p.date_prescribed}
                  </p>
                </div>
                <PrescriptionStatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}