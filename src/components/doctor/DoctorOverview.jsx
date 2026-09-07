import React from "react";
import { Calendar, FlaskConical, Image, FileText, Users, Clock } from "lucide-react";

export default function DoctorOverview({ profile, stats, loading }) {
  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  const statCards = [
    { label: "Active Patients", value: stats.patients, icon: Users, color: "text-primary" },
    { label: "Appointments", value: stats.appointments, icon: Calendar, color: "text-blue-500" },
    { label: "Lab Requests", value: stats.labs, icon: FlaskConical, color: "text-amber-500" },
    { label: "Imaging Requests", value: stats.imaging, icon: Image, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-lg font-bold">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground mt-1">{profile?.specialization}</p>
            {profile?.hospital && <p className="text-sm text-muted-foreground">{profile?.hospital}</p>}
            <p className="text-xs text-muted-foreground mt-2">License: {profile?.license_number}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${profile?.is_verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {profile?.is_verified ? "Verified" : "Pending Verification"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          );
        })}
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