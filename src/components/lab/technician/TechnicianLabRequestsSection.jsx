import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { normalizeLabStatus } from "@/lib/labRequestUtils";
import { FileText, FlaskConical, Loader2 } from "lucide-react";

export default function TechnicianLabRequestsSection({ session }) {
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("labRequestNotifications", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        all_statuses: true,
      });
      setItems(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    }
  }, [session.technician_id, session.session_token]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card text-center py-12 text-muted-foreground">
        <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No authorized laboratory requests yet.</p>
        <p className="text-xs mt-1">
          Requests appear here only after a patient explicitly allows your laboratory to access them.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
      {items.map((r) => (
        <div key={r.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {r.patient_name} <span className="text-muted-foreground font-normal">· {r.patient_cin}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {r.request_ref} · Requested{" "}
                {r.created_date ? new Date(r.created_date).toLocaleString() : r.date_requested}
              </p>
            </div>
            <LabStatusBadge status={normalizeLabStatus(r.status)} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tests: {(r.tests || []).join(", ") || "—"}
          </p>
          {r.pdf_url && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => window.open(r.pdf_url, "_blank")}
            >
              <FileText className="w-4 h-4 mr-1" /> View Lab Request PDF
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}