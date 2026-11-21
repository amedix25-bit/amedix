import React from "react";
import BrandLogo from "@/components/BrandLogo";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import DoctorNotificationsBell from "@/components/doctor/DoctorNotificationsBell";
import DoctorProfilePicture from "@/components/doctor/DoctorProfilePicture";
import { useAppLanguage } from "@/lib/appLanguage";

// Doctor Portal phone header — the original AMedix logo with the brand name and
// "Doctor Portal" underneath on the left, and the doctor's alerts, avatar and
// language switcher on the right. There is no menu button: navigation lives in
// the fixed five-tab bottom bar.
export default function DoctorMobileHeader({
  profile,
  user,
  onProfileUpdated,
  onOpenNotification,
  onOpenReferrals,
  onOpenDestination,
}) {
  const { t } = useAppLanguage();

  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-primary/10 bg-doctor-rail px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <BrandLogo className="h-11 w-11 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold leading-none tracking-tight text-primary">AMedix</p>
          <p className="mt-1 truncate text-[11px] font-semibold leading-none text-primary/70">{t("Doctor Portal")}</p>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {user && (
          <DoctorNotificationsBell
            userId={user.id}
            onNavigate={onOpenNotification}
            onOpenReferrals={onOpenReferrals}
            onOpenDestination={onOpenDestination}
          />
        )}
        <AppLanguageSwitcher />
        {profile && <DoctorProfilePicture profile={profile} onUpdated={onProfileUpdated} />}
      </div>
    </div>
  );
}