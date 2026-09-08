import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Bell, FileText } from "lucide-react";

export default function LabNotificationsBar({ profile }) {
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    try {
      const reqs = await base44.entities.LabRequest.filter(
        { lab_id: profile.id, status: "authorized" },
        "-authorization_datetime",
        50
      );
      setItems(reqs);
    } catch (err) {
      console.error(err);
    }
  }, [profile.id]);

  // Live updates: reload whenever a lab request for this laboratory changes
  useEffect(() => {
    load();
    const unsubscribe = base44.entities.LabRequest.subscribe((event) => {
      if (event?.data?.lab_id === profile.id) load();
    });
    return unsubscribe;
  }, [load]);

  if (items === null || items.length === 0) return null;

  const unreadCount = items.filter((r) => !r.lab_opened_at).length;

  const openRequest = (r) => {
    if (!r.lab_opened_at) {
      const now = new Date().toISOString();
      base44.entities.LabRequest.update(r.id, { lab_opened_at: now }).catch(console.error);
      setItems((prev) => prev.map((it) => (it.id === r.id ? { ...it, lab_opened_at: now } : it)));
    }
    if (r.pdf_url) window.open(r.pdf_url, "_blank");
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/10">
        <Bell className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm font-semibold">New Laboratory Requests</p>
        {unreadCount > 0 && (
          <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {unreadCount} new
          </span>
        )}
      </div>
      <div className="divide-y divide-border">
        {items.map((r) => (
          <div
            key={r.id}
            className={`px-4 py-3 flex items-start justify-between gap-3 ${r.lab_opened_at ? "opacity-60" : "bg-primary/5"}`}
          >
            <div className="min-w-0">
              <p className="text-sm">
                Patient <span className="font-semibold">{r.patient_name}</span> with CIN{" "}
                <span className="font-semibold">{r.patient_cin}</span> has a new laboratory request.
                {!r.lab_opened_at && (
                  <span className="ml-2 inline-block rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold uppercase align-middle">
                    New
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {r.request_id} · Requested {r.date_requested}
                {r.lab_opened_at ? " · Opened" : ""}
              </p>
            </div>
            {r.pdf_url && (
              <Button
                size="sm"
                variant={r.lab_opened_at ? "outline" : "default"}
                className="shrink-0"
                onClick={() => openRequest(r)}
              >
                <FileText className="w-4 h-4" /> View PDF
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}