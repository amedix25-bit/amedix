import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useAppLanguage } from "@/lib/appLanguage";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import VisitDateFilters from "./managePatients/VisitDateFilters";
import VisitsSummary from "./managePatients/VisitsSummary";
import { rangeForFilter } from "./managePatients/visitsFilter";

// Manage Patients — the hospital's administrative/financial records. Every
// check-in performed by a receptionist appears here with the patient's name,
// check-in date/time, amount paid and payment method, filterable by period.
// Only administrative data is shown — no medical information is displayed.
export default function HospitalManagePatientsSection({ profile }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useAppLanguage();
  const [items, setItems] = useState(null);
  const [mode, setMode] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.HospitalCheckIn.filter({ hospital_id: profile.id }, "-checkin_datetime");
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const range = rangeForFilter(mode, from, to);
    return items.filter(
      (v) => (!range.from || v.checkin_date >= range.from) && (!range.to || v.checkin_date <= range.to)
    );
  }, [items, mode, from, to]);

  const totalPayments = filtered.reduce((sum, v) => sum + (Number(v.payment_amount) || 0), 0);

  const endVisit = async (v) => {
    try {
      await base44.entities.HospitalCheckIn.update(v.id, {
        status: "completed",
        completed_datetime: new Date().toISOString(),
        completed_by_name: user?.full_name || "Hospital Administrator",
      });
      toast({ title: "Visit ended", description: "The patient can be checked in again for a new visit." });
      load();
    } catch (err) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <VisitDateFilters
        mode={mode}
        onModeChange={setMode}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
      />

      {items === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {items.length === 0
              ? "No patient visits yet. Check-ins made by your receptionists appear here."
              : "No patient visits in the selected period."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Patient Name")}</TableHead>
                <TableHead>{t("Date/Time Seen")}</TableHead>
                <TableHead>{t("Amount Paid")}</TableHead>
                <TableHead>{t("Payment Method")}</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.patient_name}</TableCell>
                  <TableCell>
                    <p>{v.checkin_date}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.checkin_time} · {v.receptionist_name}
                    </p>
                  </TableCell>
                  <TableCell>{v.payment_amount} LYD</TableCell>
                  <TableCell>{v.payment_method}</TableCell>
                  <TableCell className="text-right">
                    {v.status === "active" ? (
                      <Button size="sm" variant="outline" onClick={() => endVisit(v)}>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        End Visit
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Visit ended</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <VisitsSummary count={filtered.length} totalPayments={totalPayments} />
    </div>
  );
}