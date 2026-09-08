import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hourglass, Loader2, RefreshCw, UserPlus } from "lucide-react";
import QrScanner from "./QrScanner";

const POLL_MS = 10000;

export default function AddPatientFlow({ session, mode, onAdded, onCancel }) {
  const { toast } = useToast();
  const [method, setMethod] = useState(mode === "qr" ? "qr" : "cin");
  const [cin, setCin] = useState("");
  const [result, setResult] = useState(null);
  const [lastQuery, setLastQuery] = useState(null);
  const [busy, setBusy] = useState(false);

  const identify = async (value, m) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("labFindPatientByCin", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        cin: value,
        method: m,
      });
      setMethod(m);
      setResult(res.data);
      setLastQuery({ value, method: m });
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

  // While requests are waiting for the patient's authorization, keep checking —
  // the request appears here automatically once the patient allows this laboratory.
  const waiting = result?.found && (result.awaiting || []).length > 0;

  useEffect(() => {
    if (!waiting || !lastQuery) return;
    const timer = setInterval(() => {
      identify(lastQuery.value, lastQuery.method);
    }, POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, lastQuery && lastQuery.value]);

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

      {waiting && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
            <Hourglass className="w-4 h-4" /> Waiting for patient authorization
          </p>
          <p className="text-xs text-amber-700">{result.message}</p>
          {(result.awaiting || []).map((r) => (
            <p key={r.request_ref} className="text-xs text-amber-700">
              {r.request_ref} · Requested {r.date_requested}
            </p>
          ))}
          <p className="text-xs text-amber-700">
            Ask the patient to open their Patient Portal → Lab Requests and allow{" "}
            <span className="font-semibold">{session.laboratory_name}</span>. The request appears here
            automatically once they allow it.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !lastQuery}
            onClick={() => identify(lastQuery.value, lastQuery.method)}
          >
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Check Again
          </Button>
        </div>
      )}

      {result?.found && result.patient && (
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