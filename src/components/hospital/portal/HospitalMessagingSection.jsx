import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Inbox, Stethoscope, Megaphone, Users } from "lucide-react";
import HospitalInbox from "@/components/hospital/messaging/HospitalInbox";
import HospitalDoctorDirectoryPanel from "@/components/hospital/messaging/HospitalDoctorDirectoryPanel";
import HospitalAnnouncementsPanel from "@/components/hospital/messaging/HospitalAnnouncementsPanel";
import HospitalStaffPanel from "@/components/hospital/messaging/HospitalStaffPanel";

// Hospital Portal → Doctor Communication Center. The server decides what this
// account may do (administrator, manager or staff); the tabs follow that.
export default function HospitalMessagingSection({ profile }) {
  const [context, setContext] = useState(null);
  const [tab, setTab] = useState("inbox");
  const [initialThread, setInitialThread] = useState(null);
  const [error, setError] = useState("");

  const loadContext = async () => {
    try {
      const res = await base44.functions.invoke("messagingApi", { action: "context" });
      setContext(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || "Messaging is unavailable for this account.");
    }
  };

  useEffect(() => { loadContext(); }, [profile?.id]);

  if (!context) {
    return (
      <div className="flex justify-center py-12">
        {error ? <p className="text-sm text-critical">{error}</p> : <Loader2 className="w-6 h-6 animate-spin text-primary" />}
      </div>
    );
  }

  const actor = context.actor || {};
  const canAnnounce = actor.staff_role === "admin" || actor.staff_role === "manager";
  const isAdmin = actor.staff_role === "admin";

  const tabs = [
    { key: "inbox", label: "Inbox", icon: Inbox },
    { key: "doctors", label: "Doctors", icon: Stethoscope },
    ...(canAnnounce ? [{ key: "announcements", label: "Announcements", icon: Megaphone }] : []),
    ...(isAdmin ? [{ key: "staff", label: "Messaging Staff", icon: Users }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <p className="text-xs text-muted-foreground">
          {actor.hospital_name}
          {actor.department ? ` · ${actor.department}` : ""}
          {` · ${actor.staff_role === "admin" ? "Administration" : actor.staff_role === "manager" ? "Messaging manager" : "Messaging staff"}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setInitialThread(null); }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "inbox" && (
        <HospitalInbox
          actor={actor}
          staff={context.staff || []}
          departments={context.departments || []}
          initialThread={initialThread}
        />
      )}
      {tab === "doctors" && (
        <HospitalDoctorDirectoryPanel
          departments={context.departments || []}
          onOpenInbox={(thread) => { setInitialThread(thread); setTab("inbox"); }}
        />
      )}
      {tab === "announcements" && <HospitalAnnouncementsPanel departments={context.departments || []} />}
      {tab === "staff" && <HospitalStaffPanel onChanged={loadContext} />}
    </div>
  );
}