import React from "react";
import { Loader2, Users, FileText, ShieldCheck } from "lucide-react";
import RadiologistProfilePicture from "./RadiologistProfilePicture";
import RadiologistNameEdit from "./RadiologistNameEdit";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-lg font-semibold leading-none">
          {value === null ? <Loader2 className="w-4 h-4 animate-spin" /> : value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

// Radiologist Portal welcome card: profile picture, name, activity stats
// and profile details.
export default function RadiologistProfileCard({ profile, onProfileUpdate, stats }) {
  const displayName = (profile.full_name || "").replace(/^Dr\.?\s*/i, "").trim();
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <RadiologistProfilePicture profile={profile} onUpdated={onProfileUpdate} className="w-20 h-20 text-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground">WELCOME BACK,</p>
            <h2 className="text-2xl font-bold mt-1 truncate">Dr. {displayName || "Radiologist"}</h2>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {[profile.specialization, profile.hospital].filter(Boolean).join(" · ") || "—"}
            </p>
            <div className="mt-3">
              <RadiologistNameEdit profile={profile} onUpdated={onProfileUpdate} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Users} label="My Patients" value={stats ? stats.patients : null} />
        <Stat icon={FileText} label="Reports Submitted" value={stats ? stats.reports : null} />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <h3 className="font-semibold mb-4">Your Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">First Name</p>
            <p className="font-medium truncate">{profile.first_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Middle Name</p>
            <p className="font-medium truncate">{profile.middle_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Name</p>
            <p className="font-medium truncate">{profile.last_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">License Number</p>
            <p className="font-medium truncate">{profile.license_number || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium truncate">{profile.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account Status</p>
            <p className="font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              {profile.status === "active" ? "Active" : "Suspended"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}