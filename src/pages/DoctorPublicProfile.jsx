import React from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import PhysicianProfilePanel from "@/components/doctor/profile/PhysicianProfilePanel";

// A shared professional profile link. Opening it inside AMedix shows the profile
// exactly as its owner has chosen to share it — privacy is applied server-side,
// so a shared link can never reveal a hidden section.
export default function DoctorPublicProfile() {
  const { doctorId } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-11 w-11" />
            <div>
              <p className="font-heading text-lg font-bold leading-none text-primary">AMedix</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Professional Network
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/doctor">Back to portal</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <PhysicianProfilePanel doctorId={doctorId} />
      </main>
    </div>
  );
}