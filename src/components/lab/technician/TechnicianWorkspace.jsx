import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, History, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import VisitCard from "./VisitCard";
import AddPatientFlow from "./AddPatientFlow";

export default function TechnicianWorkspace({ session }) {
  const { toast } = useToast();
  const [visits, setVisits] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState("cin");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("labGetVisits", {
        technician_id: session.technician_id,
        session_token: session.session_token,
      });
      setVisits(res.data.visits || []);
    } catch (err) {
      console.error(err);
      setVisits([]);
    }
  }, [session.technician_id, session.session_token]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fnName, payload, successMsg) => {
    setBusy(true);
    try {
      await base44.functions.invoke(fnName, {
        technician_id: session.technician_id,
        session_token: session.session_token,
        ...payload,
      });
      if (successMsg) toast({ title: successMsg });
      await load();
      return true;
    } catch (err) {
      toast({
        title: "Action failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const current = (visits || []).filter((v) => v.status !== "patient_notified");
  const history = (visits || []).filter((v) => v.status === "patient_notified");

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4 items-start">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Current Patients</h2>
            <span className="ml-auto text-xs text-muted-foreground">{current.length} active</span>
          </div>
          {visits === null ? (
            <div className="flex items-center text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
            </div>
          ) : current.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No patients in your work queue yet. Use Add New Patient to check one in.
            </p>
          ) : (
            <div className="space-y-3">
              {current.map((v) => (
                <VisitCard key={v.id} visit={v} busy={busy} onAction={act} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Add New Patient</h2>
          </div>
          {!showAdd ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Identify the patient to add them to your work queue.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setShowAdd(true);
                    setAddMode("cin");
                  }}
                >
                  Enter CIN
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAdd(true);
                    setAddMode("qr");
                  }}
                >
                  Scan QR Code
                </Button>
              </div>
            </div>
          ) : (
            <AddPatientFlow
              session={session}
              mode={addMode}
              onAdded={() => setShowAdd(false)}
              onCancel={() => setShowAdd(false)}
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Completed / History</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Completed requests will appear here, permanently linked to you and the laboratory.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((v) => (
              <VisitCard key={v.id} visit={v} busy={busy} onAction={act} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}