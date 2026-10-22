import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";
import { FileText, CheckCircle2, Loader2, Banknote } from "lucide-react";

export default function LabCompletedSection({ profile }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const requests = await base44.entities.LabRequest.filter(
          { lab_id: profile.id, status: "results" },
          "-date_completed"
        );
        setItems(requests);
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
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No completed results yet.</p>
        </div>
      ) : (
        items.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{r.patient_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.patient_cin} · {r.request_id}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Test completed: {r.date_completed || "—"}
                  {r.result_submitted_by_name ? ` · Technician: ${r.result_submitted_by_name}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                    <Banknote className="w-3.5 h-3.5" /> Amount paid: {r.payment_amount || "—"}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                    Payment method: {r.payment_method || "—"}
                  </span>
                </div>
              </div>
              {r.result_file_url && (
                <ClinicalFileButton kind="lab_request" id={r.id} fileRef={r.result_file_url} className="inline-flex items-center gap-2 rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-medium">
                  <FileText className="w-4 h-4 mr-1" /> Results PDF
                </ClinicalFileButton>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}