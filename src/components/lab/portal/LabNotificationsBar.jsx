import React from "react";
import { Button } from "@/components/ui/button";
import { Bell, FileText } from "lucide-react";
import { useLabNotifications } from "@/hooks/useLabNotifications";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";

// Top notification bar — new authorized laboratory requests.
// Lab Portal: <LabNotificationsBar /> · Technician Portal: <LabNotificationsBar session={session} />
export default function LabNotificationsBar({ session }) {
  const { notifications, markRead } = useLabNotifications({ session });

  if (!notifications) return null;
  const items = notifications.filter((n) => n.type === "new_request" && !n.is_read);
  if (items.length === 0) return null;

  const openRequest = (n) => {
    markRead(n.id);
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/10">
        <Bell className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm font-semibold">New Laboratory Requests</p>
        <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          {items.length} new
        </span>
      </div>
      <div className="divide-y divide-border">
        {items.map((n) => (
          <div key={n.id} className="px-4 py-3 flex items-start justify-between gap-3 bg-primary/5">
            <div className="min-w-0">
              <p className="text-sm">
                {n.patient_name ? (
                  <>
                    Patient <span className="font-semibold">{n.patient_name}</span> with CIN{" "}
                    <span className="font-semibold">{n.patient_cin}</span> has a new laboratory request.
                  </>
                ) : (
                  "A new laboratory request is available for your laboratory."
                )}
                <span className="ml-2 inline-block rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold uppercase align-middle">
                  New
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {n.request_ref} · Requested{" "}
                {n.created_date ? new Date(n.created_date).toLocaleString() : ""}
              </p>
            </div>
            {n.pdf_url && (
              <ClinicalFileButton
                kind="lab_request"
                id={n.id}
                fileRef={n.pdf_url}
                onClick={() => openRequest(n)}
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 text-xs font-medium"
              >
                <FileText className="w-4 h-4" /> View PDF
              </ClinicalFileButton>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}