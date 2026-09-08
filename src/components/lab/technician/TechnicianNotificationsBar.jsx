import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Bell, FileText } from "lucide-react";

const POLL_MS = 30000;

export default function TechnicianNotificationsBar({ session }) {
  const [items, setItems] = useState(null);

  const load = useCallback(async (markOpenedId) => {
    try {
      const res = await base44.functions.invoke("labRequestNotifications", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        ...(markOpenedId ? { mark_opened_id: markOpenedId } : {}),
      });
      setItems(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    }
  }, [session.technician_id, session.session_token]);

  // Live updates: poll for newly authorized requests sent to the laboratory
  useEffect(() => {
    load();
    const timer = setInterval(() => load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (items === null || items.length === 0) return null;

  const unreadCount = items.filter((n) => !n.opened).length;

  const openRequest = (n) => {
    if (!n.opened) {
      load(n.id);
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, opened: true } : it)));
    }
    if (n.pdf_url) window.open(n.pdf_url, "_blank");
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
        {items.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-3 flex items-start justify-between gap-3 ${n.opened ? "opacity-60" : "bg-primary/5"}`}
          >
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
                {!n.opened && (
                  <span className="ml-2 inline-block rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold uppercase align-middle">
                    New
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {n.request_ref} · Requested {n.date_requested}
                {n.opened ? " · Opened" : ""}
              </p>
            </div>
            {n.pdf_url && (
              <Button size="sm" variant={n.opened ? "outline" : "default"} className="shrink-0" onClick={() => openRequest(n)}>
                <FileText className="w-4 h-4" /> View PDF
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}