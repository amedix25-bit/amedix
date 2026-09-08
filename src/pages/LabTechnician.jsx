import React, { useState } from "react";
import { HeartPulse, LogOut, FlaskConical, Upload, Users, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLabSession, clearLabSession } from "@/lib/labSession";
import TechnicianLogin from "@/components/lab/technician/TechnicianLogin";
import TechnicianWorkspace from "@/components/lab/technician/TechnicianWorkspace";
import TechnicianNotificationsBar from "@/components/lab/technician/TechnicianNotificationsBar";
import TechnicianLabRequestsSection from "@/components/lab/technician/TechnicianLabRequestsSection";
import UploadResultsFlow from "@/components/lab/technician/UploadResultsFlow";
import TechnicianPatientsSection from "@/components/lab/technician/TechnicianPatientsSection";
import NotificationsBell from "@/components/lab/notifications/NotificationsBell";

const TABS = [
  { key: "requests", label: "Lab Requests", icon: FlaskConical },
  { key: "patients", label: "Patients", icon: Users },
  { key: "upload", label: "Upload Results", icon: Upload },
  { key: "queue", label: "My Work Queue", icon: ClipboardList },
];

export default function LabTechnician() {
  const [session, setSession] = useState(getLabSession());
  const [tab, setTab] = useState("requests");
  const [notifPatientId, setNotifPatientId] = useState(null);

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <TechnicianLogin onLoggedIn={(s) => setSession(s)} />
        </div>
      </div>
    );
  }

  const handleOpenNotification = (n) => {
    if (n.target === "result" && n.result_file_url) {
      window.open(n.result_file_url, "_blank");
      return;
    }
    setTab("patients");
    setNotifPatientId(n.patient_id);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <span className="font-bold">A&amp;M Healthcare</span>
              <p className="text-xs text-muted-foreground truncate">
                {session.laboratory_name} · Lab Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NotificationsBell session={session} onOpenNotification={handleOpenNotification} />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {session.full_name} — {session.job_title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearLabSession();
                setSession(null);
              }}
            >
              <LogOut className="w-4 h-4 mr-1" /> Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <TechnicianNotificationsBar session={session} />

        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "requests" && <TechnicianLabRequestsSection session={session} />}
        {tab === "patients" && (
          <TechnicianPatientsSection session={session} selectedPatientId={notifPatientId} />
        )}
        {tab === "upload" && <UploadResultsFlow session={session} onSubmitted={() => setTab("requests")} />}
        {tab === "queue" && <TechnicianWorkspace session={session} />}
      </main>
    </div>
  );
}