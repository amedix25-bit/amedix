import React from "react";
import { Heart, Building2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import HospitalSwitcher from "@/components/doctor/overview/HospitalSwitcher";

// "Welcome back" banner. Next to the welcome greeting the banner shows the
// official logo and name of the hospital the doctor is currently working at
// (from the verified hospital session), with a small ▼ switcher to move
// between the doctor's other authorized hospitals.
export default function WelcomeBanner({ profile, hospitalSession, onSwitchHospital }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8 overflow-hidden">
      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground">WELCOME BACK,</p>
          <h2 className="text-2xl sm:text-3xl font-bold mt-1">
            Dr. {(profile?.full_name || "").replace(/^Dr\.?\s*/i, "").trim() || "Doctor"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Here's an overview of your daily activity and patient management.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Heart className="w-4 h-4 text-primary fill-primary shrink-0" />
            <p className="font-cursive text-2xl text-primary leading-none">Good care makes a difference</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 sm:items-end shrink-0">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border border-border bg-background flex items-center justify-center overflow-hidden shadow-sm">
            {hospitalSession?.hospital_photo_url ? (
              <Image
                src={hospitalSession.hospital_photo_url}
                alt={`${hospitalSession.hospital_name} logo`}
                fittingType="fill"
                className="w-full h-full"
              />
            ) : (
              <Building2 className="w-12 h-12 text-primary/40" />
            )}
          </div>
          <div className="text-center sm:text-right">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Currently working at
            </p>
            <HospitalSwitcher current={hospitalSession} onSwitched={onSwitchHospital} />
          </div>
        </div>
      </div>
    </div>
  );
}