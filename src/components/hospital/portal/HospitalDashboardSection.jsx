import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, CheckCircle2, Banknote, CalendarClock } from "lucide-react";

// Hospital overview — active visits, today's check-ins, and the visit revenue
// collected by the receptionists (administrative / financial records).
export default function HospitalDashboardSection({ profile }) {
  const [checkins, setCheckins] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.HospitalCheckIn.filter({ hospital_id: profile.id }, "-checkin_datetime");
        setCheckins(data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [profile.id]);

  if (checkins === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const active = checkins.filter((c) => c.status === "active");
  const todays = checkins.filter((c) => c.checkin_date === today);
  const totalRevenue = checkins.reduce((sum, c) => sum + (Number(c.payment_amount) || 0), 0);
  const todayRevenue = todays.reduce((sum, c) => sum + (Number(c.payment_amount) || 0), 0);

  const stats = [
    { icon: Users, label: "Active Checked-In Patients", value: active.length },
    { icon: CalendarClock, label: "Check-Ins Today", value: todays.length },
    { icon: Banknote, label: "Revenue Today (LYD)", value: todayRevenue.toFixed(2) },
    { icon: CheckCircle2, label: "Total Visits", value: checkins.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <Icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="font-semibold">Total Visit Revenue</p>
        <p className="text-3xl font-bold text-primary mt-2">{totalRevenue.toFixed(2)} LYD</p>
        <p className="text-xs text-muted-foreground mt-1">
          Every check-in records the payment collected by the receptionist — the full visit history with amounts and payment methods is available under Manage Patients.
        </p>
      </div>
    </div>
  );
}