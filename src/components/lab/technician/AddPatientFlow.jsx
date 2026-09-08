import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import QrScanner from "./QrScanner";

export default function AddPatientFlow({ session, mode, onAdded, onCancel }) {
  const { toast } = useToast();
  const [method, setMethod] = useState(mode === "qr" ? "qr" : "cin");
  const [cin, setCin] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const identify = async (value, m) => {
    setBusy(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("labFindPatientByCin", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        cin: value,
        method: m,
      });
      setMethod(m);
      setResult(res.data);
    } catch (err) {
      toast({
        title: "Could not identify patient",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const checkIn = async (request) => {
    setBusy(true);
    try {
      await base44.functions.invoke("labCheckInPatient", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        lab_request_id: request.id,
        identification_method: method,
      });
      toast({ title: "Patient added", description: "The patient is now in your Current Patients list." });
      onAdded();
    } catch (err) {
      toast({
        title: "Could not add patient",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {method === "cin" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (cin.trim()) identify(cin.trim(), "cin");
          }}
          className="space-y-2"
        >
          <Label>Patient CIN</Label>
          <div className="flex gap-2">
            <Input
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              placeholder="CIN-XXXXXX"
              autoFocus
            />
            <Button type="submit" disabled={busy || !cin.trim()}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
            </Button>
          </div>
        </form>
      ) : (
        <QrScanner onScan={(code) => identify(code, "qr")} />
      )}

      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => {
            setMethod(method === "cin" ? "qr" : "cin");
            setResult(null);
          }}
          className="text-primary underline"
        >
          {method === "cin" ? "Use Scan QR Code instead" : "Use Enter CIN instead"}
        </button>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>

      {result && !result.found && <p className="text-sm text-destructive">{result.message}</p>}

      {result?.found && (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Patient: </span>
            <span className="font-semibold">{result.patient.full_name}</span>{" "}
            <span className="text-muted-foreground">· {result.patient.cin}</span>
          </p>
          {result.requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open laboratory requests for your laboratory for this patient.
            </p>
          ) : (
            <div className="space-y-2">
              {result.requests.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{r.request_ref || "Lab request"}</p>
                    <p className="text-xs text-muted-foreground">{r.date_requested}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Requested tests: {r.tests.join(", ")}</p>
                  <Button size="sm" disabled={busy} onClick={() => checkIn(r)}>
                    {busy ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-1" />
                    )}
                    Add Patient
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}