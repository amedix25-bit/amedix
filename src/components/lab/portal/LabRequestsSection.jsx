import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { normalizeLabStatus } from "@/lib/labRequestUtils";
import { Loader2, FlaskConical } from "lucide-react";

export default function LabRequestsSection({ profile }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const requests = await base44.entities.LabRequest.filter({ lab_name: profile.lab_name }, "-date_requested");
        setItems(requests);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [profile.lab_name]);

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No laboratory requests for {profile.lab_name} yet.</p>
          <p className="text-xs mt-1">
            Requests sent to your laboratory by doctors will appear here.
          </p>
        </div>
      ) : (
        items.map((r) => (
          <div key={r.id} className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{r.request_ref || "Lab request"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {r.patient_name} · {r.date_requested}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                Tests: {(r.tests || []).map((t) => t.name).join(", ")}
              </p>
            </div>
            <LabStatusBadge status={normalizeLabStatus(r.status)} />
          </div>
        ))
      )}
    </div>
  );
}