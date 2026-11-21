import React, { useState } from "react";
import { Search, QrCode, MessageSquare, Building2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import HospitalSwitcher from "@/components/doctor/overview/HospitalSwitcher";
import DoctorNotificationsBell from "@/components/doctor/DoctorNotificationsBell";
import DoctorProfilePicture from "@/components/doctor/DoctorProfilePicture";

// Doctor Portal top bar — the working hospital, patient search, and the
// doctor's alerts, messages and profile. The hospital name opens the verified
// hospital switcher, so switching hospitals stays available from every tab.
export default function DoctorTopBar({
  profile,
  hospitalSession,
  onSwitchHospital,
  onProfileUpdated,
  user,
  unreadMessages = 0,
  onNavigate,
  onSearchPatient,
  onOpenNotification,
  onOpenReferrals,
  onOpenDestination,
}) {
  const [query, setQuery] = useState("");

  const submitSearch = (e) => {
    e.preventDefault();
    onSearchPatient(query.trim());
    setQuery("");
  };

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-2 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
          {hospitalSession?.hospital_photo_url ? (
            <Image
              src={hospitalSession.hospital_photo_url}
              alt={hospitalSession?.hospital_name || "Hospital"}
              fittingType="fill"
              className="h-full w-full"
            />
          ) : (
            <Building2 className="h-5 w-5 text-doctor-blue" />
          )}
        </div>
        <div className="hidden min-w-0 sm:block">
          <HospitalSwitcher current={hospitalSession} onSwitched={onSwitchHospital} />
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {hospitalSession?.hospital_location || "Connected Care. Better Health."}
          </p>
        </div>
      </div>

      <form onSubmit={submitSearch} className="hidden flex-1 justify-center px-2 md:flex">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient (CIN)"
            aria-label="Search patient by CIN"
            className="h-10 w-full rounded-full border border-sky-200 bg-sky-50/70 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-doctor-blue/30"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate("search")}
          aria-label="Search patient"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-accent md:hidden"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("search")}
          title="Scan patient QR code"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-accent"
        >
          <QrCode className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("messages")}
          title="Messages"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-accent"
        >
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          {unreadMessages > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-doctor-blue px-1 text-[10px] font-bold text-white">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </button>
        {user && (
          <DoctorNotificationsBell
            userId={user.id}
            onNavigate={onOpenNotification}
            onOpenReferrals={onOpenReferrals}
            onOpenDestination={onOpenDestination}
          />
        )}

        {profile && (
          <div className="ml-1 flex items-center gap-2.5 border-l border-border pl-3">
            <DoctorProfilePicture profile={profile} onUpdated={onProfileUpdated} />
            <div className="hidden min-w-0 lg:block">
              <p className="max-w-[170px] truncate text-sm font-semibold text-foreground">
                Dr. {(profile.full_name || "").replace(/^Dr\.?\s*/i, "").trim() || "Doctor"}
              </p>
              <p className="max-w-[170px] truncate text-[11px] text-muted-foreground">
                {profile.specialization || "Specialty not set"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}