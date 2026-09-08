import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import VisitStatusBadge from "@/components/lab/VisitStatusBadge";
import { Loader2, TestTube } from "lucide-react";

export default function LabPendingTestsSection({ profile }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const visits = await base44.entities.LabPatientVisit.filter({ laboratory_id: profile.id }, "-created_date");
        setItems(visits.filter((v) => v.status !== "patient_notified"));
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [profile.id]);

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <TestTube className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tests currently in progress.</p>
          <p className="text-xs mt-1">Patients checked in by your technicians will appear here.</p>
        </div>
      ) : (
        items.map((v) => (
          <div key={v.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{v.patient_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {v.patient_cin} · {v.request_ref} · {v.request_date}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Technician: {v.technician_name}
                  {v.requested_tests ? ` · Tests: ${v.requested_tests}` : ""}
                </p>
              </div>
              <VisitStatusBadge status={v.status} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}