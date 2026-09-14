import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import { getReceptionistSession, clearReceptionistSession } from "@/lib/receptionistSession";
import ReceptionistLogin from "@/components/hospital/receptionist/ReceptionistLogin";
import ReceptionistWorkspace from "@/components/hospital/receptionist/ReceptionistWorkspace";

// Receptionist workspace — an individual receptionist signs in with their own
// credentials and can only access the permitted reception functions: patient
// lookup by CIN / QR and hospital check-in with the visit payment.
export default function Receptionist() {
  const [session, setSession] = useState(getReceptionistSession());

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <ReceptionistLogin onLoggedIn={(s) => setSession(s)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo className="w-9 h-9 rounded-full shrink-0" />
            <div className="min-w-0">
              <span className="font-bold">AMedix</span>
              <p className="text-xs text-muted-foreground truncate">
                {session.hospital_name} · Reception
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground hidden sm:inline">{session.full_name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearReceptionistSession();
                setSession(null);
              }}
            >
              <LogOut className="w-4 h-4 mr-1" /> Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        <ReceptionistWorkspace session={session} />
      </main>
    </div>
  );
}