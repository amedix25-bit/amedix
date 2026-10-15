import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

const ACTION_LABELS = {
  technician_login: "Technician signed in",
  patient_identified: "Patient identified",
  patient_checked_in: "Patient checked in",
  tests_completed: "Tests completed",
  results_uploaded: "Results uploaded",
  results_ready: "Results ready",
  patient_notified: "Patient notified",
};

export default function LabDashboardSection({ profile }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [requests, visits, techs, audits] = await Promise.all([
          base44.entities.LabRequest.filter({ lab_name: profile.lab_name }, "-date_requested"),
          base44.entities.LabPatientVisit.filter({ laboratory_id: profile.id }, "-created_date"),
          base44.entities.LabTechnician.filter({ laboratory_id: profile.id }),
          base44.entities.LabAuditLog.filter({}, "-created_date", 10),
        ]);
        setData({ requests, visits, techs, audits });
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [profile.id, profile.lab_name]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  const pendingRequests = data.requests.filter((r) => ["requested", "pending"].includes(r.status)).length;
  const activeVisits = data.visits.filter((v) => v.status !== "patient_notified").length;
  const completedResults = data.visits.filter((v) => v.status === "patient_notified").length;
  const activeTechs = data.techs.filter((t) => t.is_active).length;

  const stats = [
    { label: "Pending Lab Requests", value: pendingRequests },
    { label: "Patients in Progress", value: activeVisits },
    { label: "Completed Results", value: completedResults },
    { label: "Active Technicians", value: activeTechs },
  ];

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