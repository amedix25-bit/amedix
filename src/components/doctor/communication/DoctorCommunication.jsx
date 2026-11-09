import React from "react";
import { Users, MessageSquare, Calendar, CornerUpRight } from "lucide-react";
import FindDoctors from "@/components/doctor/colleagues/FindDoctors";
import DoctorMessages from "@/components/doctor/messaging/DoctorMessages";
import DoctorAppointments from "@/components/doctor/DoctorAppointments";
import DoctorReferralLetters from "@/components/doctor/referral/DoctorReferralLetters";

// Doctor Portal → Communication. One screen holding the four things a doctor
// communicates through — colleagues, messages, appointments and referrals —
// so none of them is repeated anywhere else in the portal navigation.
const TABS = [
  { key: "colleagues", label: "Find Doctors", icon: Users },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "appointments", label: "Appointments", icon: Calendar },
  { key: "referrals", label: "Referrals", icon: CornerUpRight },
];

export default function DoctorCommunication({ profile, hospitalSession, tab = "messages", onTabChange, unreadMessages = 0 }) {
  const active = TABS.some((t) => t.key === tab) ? tab : "messages";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange?.(key)}
              className={`relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "text-doctor-blue" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === "messages" && unreadMessages > 0 && (
                <span className="rounded-full bg-doctor-blue px-1.5 text-[10px] font-semibold text-white">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
              <span
                className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors ${
                  isActive ? "bg-doctor-blue" : "bg-transparent"
                }`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {active === "colleagues" && profile && <FindDoctors profile={profile} />}
      {active === "messages" && profile && (
        <DoctorMessages profile={profile} hospitalSession={hospitalSession} />
      )}
      {active === "appointments" && profile && <DoctorAppointments doctorProfile={profile} />}
      {active === "referrals" && profile && <DoctorReferralLetters doctorProfile={profile} />}
    </div>
  );
}