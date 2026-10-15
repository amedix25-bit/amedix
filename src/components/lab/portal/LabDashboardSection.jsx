import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import labDashboardData, { laboratoryDay } from "@/components/lab/portal/dashboard/labDashboardData";
import LabOperationsSummary from "@/components/lab/portal/dashboard/LabOperationsSummary";
import LabFinancialSummary from "@/components/lab/portal/dashboard/LabFinancialSummary";
import LabRecentActivity from "@/components/lab/portal/dashboard/LabRecentActivity";

export default function LabDashboardSection({ profile, onNavigate }) {
  const day = laboratoryDay();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["lab-portal-dashboard", profile.id, day],
    queryFn: () => labDashboardData(profile, day),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  if (isPending) return <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading laboratory overview...</div>;
  if (error) return <div role="alert" className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-destructive">The laboratory dashboard could not be loaded.</p><Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Try again</Button></div>;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <FlaskConical className="mt-1 h-6 w-6 text-primary" />
        <div><h2 className="text-lg font-bold">Laboratory Overview</h2><p className="text-sm text-muted-foreground">Workload, test progress, attention items and finances at a glance.</p><p className="mt-1 text-xs text-muted-foreground">Today: {day} · Tripoli time</p></div>
      </div>
      <LabOperationsSummary data={data} onNavigate={onNavigate} />
      <LabFinancialSummary data={data} onNavigate={onNavigate} />
      <LabRecentActivity items={data.activity} />
    </div>
  );
}