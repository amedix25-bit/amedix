import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Stethoscope, ShieldCheck, Activity } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, doctors: 0, patients: 0, pendingDoctors: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [directory, doctors, patients] = await Promise.all([
        base44.functions.invoke("adminAccountGovernance", { action: "userDirectory" }),
        base44.entities.DoctorProfile.list(),
        base44.entities.PatientProfile.list(),
      ]);
      setStats({
        users: directory.data?.total || 0,
        doctors: doctors.length,
        patients: patients.length,
        pendingDoctors: doctors.filter((d) => !d.is_verified).length,
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
    { label: "Doctors", value: stats.doctors, icon: Stethoscope, color: "text-blue-500" },
    { label: "Patients", value: stats.patients, icon: Activity, color: "text-emerald-500" },
    { label: "Pending Verification", value: stats.pendingDoctors, icon: ShieldCheck, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <Icon className={`w-5 h-5 ${card.color} mb-3`} />
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-sm mb-4">System Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Platform Status</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">Operational</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Authentication</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">Active</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Data Encryption</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}