import React, { useState } from "react";
import { HeartPulse, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLabSession, clearLabSession } from "@/lib/labSession";
import TechnicianLogin from "@/components/lab/technician/TechnicianLogin";
import TechnicianWorkspace from "@/components/lab/technician/TechnicianWorkspace";
import TechnicianNotificationsBar from "@/components/lab/technician/TechnicianNotificationsBar";

export default function LabTechnician() {
  const [session, setSession] = useState(getLabSession());

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <TechnicianLogin onLoggedIn={(s) => setSession(s)} />
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3 shrink-0">
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
        <TechnicianWorkspace session={session} />
      </main>
    </div>
  );
}