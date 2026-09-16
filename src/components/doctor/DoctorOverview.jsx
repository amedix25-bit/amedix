import React from "react";
import { Clock } from "lucide-react";
import WelcomeBanner from "@/components/doctor/overview/WelcomeBanner";
import StatCards from "@/components/doctor/overview/StatCards";
import RecentActivity from "@/components/doctor/overview/RecentActivity";
import QuickActions from "@/components/doctor/overview/QuickActions";

export default function DoctorOverview({ profile, hospitalSession, onSwitchHospital, stats, loading, recentActivity, onNavigateTab }) {
  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      <WelcomeBanner profile={profile} hospitalSession={hospitalSession} onSwitchHospital={onSwitchHospital} />
      <StatCards stats={stats} onNavigate={onNavigateTab} />
      <div className="grid lg:grid-cols-2 gap-4">
        <RecentActivity activity={recentActivity} />
        <QuickActions onNavigate={onNavigateTab} />
      </div>

      {!profile?.is_verified && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-amber-800">Account pending verification</p>
              <p className="text-xs text-amber-700 mt-1">
                An administrator will verify your credentials. You can still search for patients and request access while waiting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}