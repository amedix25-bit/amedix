import React from "react";
import { ClipboardList, TestTube, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LabOperationsSummary({ data, onNavigate }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-medium"><ClipboardList className="h-4 w-4 text-primary" /> Incoming work</h3>
        <p className="mt-3 text-3xl font-bold">{data.received}</p>
        <p className="mt-1 text-xs text-muted-foreground">Requests received today</p>
        <Button variant="link" className="mt-2 h-auto p-0 text-xs" onClick={() => onNavigate("requests")}>Review requests</Button>
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-medium"><TestTube className="h-4 w-4 text-primary" /> Test workload</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><p className="text-3xl font-bold">{data.processing}</p><p className="mt-1 text-xs text-muted-foreground">Processing</p></div>
          <div><p className="text-3xl font-bold">{data.completed}</p><p className="mt-1 text-xs text-muted-foreground">Verified / completed</p></div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Request batches, across all dates</p>
      </section>
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4 text-destructive" /> Needs attention</h3>
        <p className="mt-3 text-3xl font-bold">{data.attention}</p>
        <p className="mt-1 text-xs text-muted-foreground">Urgent/STAT or open since before today</p>
        <p className="mt-3 text-xs text-muted-foreground">{data.awaitingVerification} additional result batches awaiting verification</p>
      </section>
    </div>
  );
}