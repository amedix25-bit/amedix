import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MessageSquare, Stethoscope, Building2 } from "lucide-react";
import DoctorsChannel from "@/components/doctor/messaging/DoctorsChannel";
import HospitalsChannel from "@/components/doctor/messaging/HospitalsChannel";
import PatientsChannel from "@/components/doctor/messaging/PatientsChannel";

const TABS = [
  { key: "doctors", label: "Doctors", icon: Stethoscope, channel: "doctor", hint: "Two-way with verified doctors" },
  { key: "hospitals", label: "Hospitals", icon: Building2, channel: "hospital", hint: "Two-way with your hospitals" },
  { key: "patients", label: "Patients", icon: MessageSquare, channel: "patient", hint: "One-way to your patients" },
];

// Doctor Portal → Messages. Three clearly separated channels share one secure
// messaging backend: Doctors and Hospitals are two-way, Patients is strictly
// one-way. Hospital conversations are preserved exactly as they were.
export default function DoctorMessages({ profile, hospitalSession }) {
  const [context, setContext] = useState(null);
  const [tab, setTab] = useState("hospitals");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("messagingApi", { action: "context" });
        if (!cancelled) setContext(res.data);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error || "Messaging is unavailable for this account.");
      }
    })();
    return () => { cancelled = true; };
  }, [tab]);

  if (error) {
    return <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{error}</p>;
  }

  if (!context) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const hospitals = context.hospitals || [];
  const byChannel = context.unread?.by_channel || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          const unread = byChannel[t.channel] || 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {unread > 0 && (
                <span className={`rounded-full px-1.5 text-[10px] font-semibold ${active ? "bg-primary-foreground/20" : "bg-critical/10 text-critical"}`}>
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="px-1 text-[11px] text-muted-foreground">{TABS.find((t) => t.key === tab)?.hint}</p>

      {tab === "doctors" && <DoctorsChannel profile={profile} />}
      {tab === "hospitals" && <HospitalsChannel hospitals={hospitals} hospitalSession={hospitalSession} />}
      {tab === "patients" && <PatientsChannel />}
    </div>
  );
}