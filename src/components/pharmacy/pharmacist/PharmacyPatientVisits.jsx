import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ClipboardList } from "lucide-react";

const STATUS_LABELS = {
  checked_in: "Checked In",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
const STATUS_STYLES = {
  checked_in: "bg-accent text-accent-foreground",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-destructive/10 text-destructive",
};

// The patient's past and current visits at this pharmacy, shown after a CIN
// lookup in the pharmacist's patient-identification flow.
export default function PharmacyPatientVisits({ session, patient }) {
  const [visits, setVisits] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("pharmacyVisitManage", {
          action: "list_by_patient",
          cin: patient.cin,
          pharmacist_id: session.pharmacist_id,
          pharmacist_session_token: session.session_token,
        });
        if (!cancelled) setVisits(res.data.visits || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || "Could not load the visits.");
          setVisits([]);
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.cin, session?.pharmacist_id, session?.session_token]);

  if (visits === null) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 animate-spin" /> Loading visits...
      </p>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-primary" /> Patient Visits at Your Pharmacy
      </h3>
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
      {visits.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6 rounded-xl border border-border bg-card">
          This patient has no visits at your pharmacy yet.
        </p>
      ) : (
        <div className="space-y-2">
          {visits.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold font-mono">{v.visit_id}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[v.status] || "bg-muted text-muted-foreground"}`}>
                  {STATUS_LABELS[v.status] || v.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Checked in {v.check_in_datetime ? new Date(v.check_in_datetime).toLocaleString() : "—"}
                {v.responsible_pharmacist_name ? ` · ${v.responsible_pharmacist_name}` : ""}
              </p>
              {v.status === "completed" && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Completed {v.completed_datetime ? new Date(v.completed_datetime).toLocaleString() : "—"}
                  {typeof v.dispensing_count === "number" ? ` · ${v.dispensing_count} dispensing transaction(s)` : ""}
                  {typeof v.payment_total === "number" ? ` · ${v.payment_total} LYD collected` : ""}
                </p>
              )}
              {v.status === "cancelled" && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cancelled{v.cancelled_reason ? ` — ${v.cancelled_reason}` : ""}
                </p>
              )}
              {v.notes && <p className="text-xs text-muted-foreground mt-0.5">Notes: {v.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}