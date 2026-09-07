import React from "react";
import { Calendar, FlaskConical, Image, FileText, Activity, Shield, Clock } from "lucide-react";

export default function PatientOverview({ profile, stats, loading }) {
  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading...</div>;
  }

  const statCards = [
    { label: "Appointments", value: stats.appointments, icon: Calendar, color: "text-primary" },
    { label: "Lab Requests", value: stats.labs, icon: FlaskConical, color: "text-blue-500" },
    { label: "Imaging", value: stats.imaging, icon: Image, color: "text-purple-500" },
    { label: "Documents", value: stats.documents, icon: FileText, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Clinical Identification Number</p>
            <p className="text-2xl font-bold tracking-wider text-primary mt-1">{profile?.cin}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
            <Shield className="w-4 h-4" />
            Verified Patient
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

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4">Personal Information</h3>
          <div className="space-y-3">
            <InfoRow label="Full Name" value={profile?.full_name} />
            <InfoRow label="Date of Birth" value={profile?.date_of_birth} />
            <InfoRow label="Gender" value={profile?.gender} />
            <InfoRow label="Blood Type" value={profile?.blood_type} />
            <InfoRow label="Phone" value={profile?.phone} />
            <InfoRow label="Address" value={profile?.address} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4">Medical Information</h3>
          <div className="space-y-3">
            <InfoRow label="Allergies" value={profile?.allergies} />
            <InfoRow label="Emergency Contact" value={profile?.emergency_contact_name} />
            <InfoRow label="Emergency Phone" value={profile?.emergency_contact_phone} />
          </div>
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-700">
                Your medical record is private. Doctors can only access it with your approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}