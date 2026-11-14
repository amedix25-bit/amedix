import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Send } from "lucide-react";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";

// Doctor Portal → Imaging → View Imaging Requested.
// Imaging results the patient explicitly shared with this doctor via
// "Send to Doctor" in their portal. Opening the report marks the
// share as seen (clears the bell badge too).
export default function DoctorSharedImagingResults({ userId, patientId }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    setItems(null);
    const load = async () => {
      try {
        const list = await base44.entities.DoctorNotification.filter(
          { doctor_user_id: userId, type: "imaging_result_shared" },
          "-datetime"
        );
        // Inside a patient profile only that patient's shared results are shown.
        setItems(patientId ? list.filter((n) => String(n.patient_id || "") === patientId) : list);
      } catch (err) {
        console.error(err);
        setItems([]);
      }
    };
    load();
    const unsubscribe = base44.entities.DoctorNotification.subscribe(() => load());
    return unsubscribe;
  }, [userId, patientId]);

  const markRead = async (n) => {
    if (n.is_read) return;
    try {
      await base44.entities.DoctorNotification.update(n.id, { is_read: true });
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, is_read: true } : it)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Send className="w-4 h-4 text-primary" />
        Imaging Results Shared by Patients
      </h3>

      {items === null ? (
        <div className="flex items-center text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
          <Send className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No results shared with you yet</p>
          <p className="text-xs mt-1">
            Patients can share a finalized imaging report with you from their portal.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium">
                    {n.patient_name || "Patient"}
                    {n.scan_type ? ` — ${n.scan_type}` : ""}
                    {n.examination ? ` — ${n.examination}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Shared by the patient{n.request_ref ? ` · Ref: ${n.request_ref}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {n.datetime ? new Date(n.datetime).toLocaleString() : ""}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/30">
                    New
                  </span>
                )}
              </div>
              {n.report_pdf_url && (
                <div className="mt-3">
                  <ClinicalFileButton
                    kind="imaging_result"
                    id={n.related_id}
                    fileRef={n.report_pdf_url}
                    onClick={() => markRead(n)}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm font-medium"
                  >
                    <FileText className="w-4 h-4 mr-1" /> Open Report (PDF)
                  </ClinicalFileButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}