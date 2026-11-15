import React from "react";
import { Clock } from "lucide-react";
import WelcomeHero from "@/components/doctor/overview/WelcomeHero";
import StatCards from "@/components/doctor/overview/StatCards";
import TodayAppointments from "@/components/doctor/overview/TodayAppointments";
import RecentActivity from "@/components/doctor/overview/RecentActivity";
import MyTasks from "@/components/doctor/overview/MyTasks";
import ScheduleCard from "@/components/doctor/overview/ScheduleCard";
import QuickActionsPanel from "@/components/doctor/overview/QuickActionsPanel";
import NotificationsPanel from "@/components/doctor/overview/NotificationsPanel";

export default function DoctorOverview({
  profile,
  stats,
  appointmentsToday,
  todayAppointments,
  loading,
  recentActivity,
  onNavigateTab,
  notesLabel,
  greeting,
  doctorName,
  hospitalName,
  now,
}) {
  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-4">
      <WelcomeHero greeting={greeting} doctorName={doctorName} hospitalName={hospitalName} now={now} />
      <StatCards stats={stats} appointmentsToday={appointmentsToday} onNavigate={onNavigateTab} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <TodayAppointments appointments={todayAppointments} onNavigate={onNavigateTab} />
          <div className="grid gap-4 sm:grid-cols-2">
            <RecentActivity activity={recentActivity} />
            <MyTasks stats={stats} appointmentsToday={appointmentsToday} onNavigate={onNavigateTab} />
          </div>
        </div>
        <div className="space-y-4">
          <ScheduleCard now={now} />
          <QuickActionsPanel onNavigate={onNavigateTab} notesLabel={notesLabel} />
          <NotificationsPanel activity={recentActivity} />
        </div>
      </div>

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