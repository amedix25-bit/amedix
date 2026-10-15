import React from "react";
import { Wallet, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { laboratoryMoney } from "@/components/lab/portal/dashboard/labDashboardData";

export default function LabFinancialSummary({ data, onNavigate }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-medium"><Wallet className="h-4 w-4 text-primary" /> Money collected</h3>
        <p className="mt-3 text-2xl font-bold">{laboratoryMoney(data.collectedToday)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Payments recorded today</p>
        <p className="mt-3 text-sm"><span className="text-muted-foreground">All-time collected: </span>{laboratoryMoney(data.collectedTotal)}</p>
        {(data.collectedToday == null || data.collectedTotal == null) && <p className="mt-2 text-xs text-muted-foreground">A complete total is unavailable because saved payment amounts need review.</p>}
        <Button variant="link" className="mt-3 h-auto p-0 text-xs" onClick={() => onNavigate("completed")}>View completed payments/results</Button>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-medium"><Banknote className="h-4 w-4 text-primary" /> Money outstanding</h3>
        <p className="mt-3 text-2xl font-bold">Not recorded</p>
        <p className="mt-2 text-sm text-muted-foreground">Lab requests currently record payments received, but not charges or balances due.</p>
        <p className="mt-3 text-xs text-muted-foreground">An outstanding total cannot be calculated from missing payment amounts alone.</p>
      </section>
    </div>
  );
}