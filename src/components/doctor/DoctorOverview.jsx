import React from "react";
import { Clock } from "lucide-react";
import QuickAccessGrid from "@/components/doctor/overview/QuickAccessGrid";
import StatCards from "@/components/doctor/overview/StatCards";
import TodayAppointments from "@/components/doctor/overview/TodayAppointments";
import MyTasks from "@/components/doctor/overview/MyTasks";
import RecentActivity from "@/components/doctor/overview/RecentActivity";

export default function DoctorOverview({ profile, stats, appointmentsToday, todayAppointments, loading, recentActivity, onNavigateTab, notesLabel }) {
  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      <QuickAccessGrid onNavigate={onNavigateTab} notesLabel={notesLabel} />
      <StatCards stats={stats} appointmentsToday={appointmentsToday} onNavigate={onNavigateTab} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayAppointments appointments={todayAppointments} onNavigate={onNavigateTab} />
        </div>
        <MyTasks stats={stats} appointmentsToday={appointmentsToday} onNavigate={onNavigateTab} />
      </div>

      <RecentActivity activity={recentActivity} />

      {!profile?.is_verified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
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