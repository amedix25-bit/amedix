import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// The hospital's administrative/financial records: every check-in with the
// patient, receptionist, date, time, amount paid and payment method. The
// hospital administrator can end an active visit — the only way a new
// check-in for the same patient becomes possible again.
export default function HospitalVisitsSection({ profile }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState(null);

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

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No patient visits yet. Check-ins made by your receptionists appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((v) => (
        <div key={v.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{v.patient_name}</p>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    v.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {v.status === "active" ? "Checked In" : "Visit Ended"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                CIN: {v.patient_cin} · Receptionist: {v.receptionist_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {v.checkin_date} · {v.checkin_time} · Paid: {v.payment_amount} LYD via {v.payment_method}
              </p>
              {v.status === "completed" && v.completed_datetime && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visit ended {new Date(v.completed_datetime).toLocaleString()} by {v.completed_by_name || "administrator"}
                </p>
              )}
            </div>
            {v.status === "active" && (
              <Button size="sm" variant="outline" onClick={() => endVisit(v)}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                End Visit
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}