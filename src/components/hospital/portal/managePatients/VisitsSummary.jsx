import React from "react";
import { useAppLanguage } from "@/lib/appLanguage";
import { Users, Banknote } from "lucide-react";

// Totals for the period shown in the Manage Patients table — number of
// patients checked in and the sum of all recorded payments.
export default function VisitsSummary({ count, totalPayments }) {
  const { t } = useAppLanguage();
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <Users className="w-5 h-5 text-primary mb-2" />
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("Total Patients Seen")}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <Banknote className="w-5 h-5 text-primary mb-2" />
        <p className="text-2xl font-bold text-primary break-all">{totalPayments.toFixed(2)} LYD</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("Total Payments")}</p>
      </div>
    </div>
  );
}