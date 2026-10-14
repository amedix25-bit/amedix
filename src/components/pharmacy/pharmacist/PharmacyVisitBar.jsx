import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LogIn, CheckCircle2, XCircle, Play, UserRound } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Visit banner for the pharmacist's patient-identification flow. A visit is
// created only when the pharmacist explicitly checks the patient in — the CIN
// lookup or opening a prescription never counts as a visit.
export default function PharmacyVisitBar({ session, patient, onVisitChanged }) {
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { toast } = useToast();

  const checkActive = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("pharmacyVisitManage", {
        action: "active",
        cin: patient.cin,
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      setVisit(res.data.visit || null);
    } catch (err) {
      setVisit(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.cin, session?.pharmacist_id, session?.session_token]);

  useEffect(() => {
    checkActive();
  }, [checkActive]);

  const invoke = async (payload) => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("pharmacyVisitManage", {
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
        ...payload,
      });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || "The visit action failed.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const checkIn = async () => {
    const res = await invoke({
      action: "check_in",
      cin: patient.cin,
      patient_name: patient.full_name || "",
      patient_id: patient.id || "",
    });
    if (res?.visit) {
      setVisit(res.visit);
      onVisitChanged?.(res.visit);
    }
  };

  const startService = async () => {
    const res = await invoke({ action: "set_status", visit_id: visit.id });
    if (res?.visit) {
      setVisit(res.visit);
      onVisitChanged?.(res.visit);
    }
  };

  const complete = async () => {
    const res = await invoke({ action: "complete", visit_id: visit.id });
    if (res?.visit) {
      setVisit(null);
      onVisitChanged?.(null);
      toast({
        title: "Visit completed",
        description: `${res.visit.dispensing_count || 0} dispensing transaction(s) were linked to the visit.`,
      });
    }
  };

  const cancel = async () => {
    if (!cancelReason.trim()) return;
    const res = await invoke({ action: "cancel", visit_id: visit.id, reason: cancelReason.trim() });
    if (res?.ok) {
      setVisit(null);
      setCancelOpen(false);
      setCancelReason("");
      onVisitChanged?.(null);
    }
  };

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 animate-spin" /> Checking visit status...
      </p>
    );
  }

  if (!visit) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold">No active visit</p>
          <p className="text-xs text-muted-foreground">Checking the patient in records their attendance. A lookup alone is never counted as a visit.</p>
        </div>
        <Button size="sm" onClick={checkIn} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-1" />}
          Check In Patient
        </Button>
        {error && <p className="text-xs text-destructive w-full">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <UserRound className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm font-semibold">
          Visit in progress · {visit.visit_id}
        </p>
        <span className="text-xs text-muted-foreground">
          Checked in {visit.check_in_datetime ? new Date(visit.check_in_datetime).toLocaleString() : "—"}
          {visit.status === "in_progress" ? " · In progress" : ""}
        </span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {cancelOpen ? (
        <div className="flex gap-2 items-center flex-wrap">
          <Input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancelling the visit (required)"
            className="h-8 text-xs max-w-xs"
            autoFocus
          />
          <Button variant="destructive" size="sm" onClick={cancel} disabled={busy || !cancelReason.trim()}>
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />} Confirm Cancel
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCancelOpen(false)}>Back</Button>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {visit.status === "checked_in" && (
            <Button variant="outline" size="sm" onClick={startService} disabled={busy}>
              <Play className="w-3.5 h-3.5 mr-1" /> Start Service
            </Button>
          )}
          <Button size="sm" onClick={complete} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
            Complete Visit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCancelOpen(true)} disabled={busy}>
            <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Visit
          </Button>
        </div>
      )}
    </div>
  );
}