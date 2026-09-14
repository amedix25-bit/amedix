import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QrScanner from "@/components/lab/technician/QrScanner";
import { clearReceptionistSession } from "@/lib/receptionistSession";
import {
  Search, ScanLine, Keyboard, CheckCircle2, Loader2, UserRound, Calendar,
  Phone, MapPin, BadgeCheck, Lock, Banknote,
} from "lucide-react";

// The receptionist can search for a patient by CIN or by scanning the
// patient's QR code, then perform the hospital check-in. The patient's
// approval is not needed — the receptionist is authorized hospital staff —
// but the role stays strictly limited to reception demographics: no medical
// information is ever displayed here.
export default function ReceptionistWorkspace({ session }) {
  const [mode, setMode] = useState("cin"); // "cin" | "qr"
  const [cin, setCin] = useState("");
  const [finding, setFinding] = useState(false);
  const [patient, setPatient] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [error, setError] = useState("");
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleUnauthorized = () => {
    clearReceptionistSession();
    window.location.href = "/hospital/receptionist";
  };

  // The QR contains the patient CIN (possibly inside a longer string).
  const extractCin = (raw) => {
    const text = String(raw || "").trim().toUpperCase();
    const m = text.match(/CIN[-\s]?[A-Z0-9-]+/);
    return (m ? m[0] : text).replace(/\s+/g, "");
  };

  const findPatient = async (cinValue) => {
    const value = extractCin(cinValue);
    if (!value) return;
    setFinding(true);
    setError("");
    setSuccess(null);
    try {
      const res = await base44.functions.invoke("hospitalFindPatientByCin", {
        receptionist_id: session.receptionist_id,
        session_token: session.session_token,
        cin: value,
      });
      setPatient(res.data.patient);
      setPaymentMethods(res.data.payment_methods);
      setAlreadyCheckedIn(res.data.already_checked_in);
      setCheckInOpen(false);
      setAmount("");
      setMethod("");
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setPatient(null);
      setError(err.response?.data?.error || "Could not find the patient.");
    } finally {
      setFinding(false);
    }
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await base44.functions.invoke("hospitalCheckInPatient", {
        receptionist_id: session.receptionist_id,
        session_token: session.session_token,
        patient_id: patient.patient_id,
        payment_amount: amount,
        payment_method: method,
      });
      setSuccess(res.data.checkin);
      setPatient(null);
      setCin("");
      setCheckInOpen(false);
      setAmount("");
      setMethod("");
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError(err.response?.data?.error || "Check-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Patient Check-In</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Find the patient by their CIN or by scanning their QR code. You only see the reception details — no medical information.
        </p>
      </div>

      <div className="flex rounded-xl border border-border bg-card p-1 gap-1">
        <button
          type="button"
          onClick={() => setMode("cin")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            mode === "cin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <Keyboard className="w-4 h-4" />
          Enter CIN
        </button>
        <button
          type="button"
          onClick={() => setMode("qr")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            mode === "qr" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <ScanLine className="w-4 h-4" />
          Scan QR Code
        </button>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-semibold text-emerald-800">Patient Checked In ✓</p>
          </div>
          <p className="text-xs text-emerald-700 mt-1">
            {success.patient_name} · {success.checkin_time} · {success.payment_amount} LYD via {success.payment_method}
          </p>
        </div>
      )}

      {mode === "cin" ? (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Label>Patient CIN</Label>
          <div className="flex gap-2">
            <Input
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              placeholder="CIN-XXXXXX"
              onKeyDown={(e) => e.key === "Enter" && findPatient(cin)}
            />
            <Button type="button" onClick={() => findPatient(cin)} disabled={finding}>
              {finding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Find Patient
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <QrScanner
            label="Scan the patient's QR code"
            onManualEntry={() => setMode("cin")}
            onScan={(value) => findPatient(value)}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {patient && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserRound className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{patient.full_name}</p>
              <p className="text-xs text-muted-foreground">CIN: {patient.cin}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{patient.date_of_birth || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="capitalize">{patient.gender || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{patient.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate">{patient.nationality || patient.address || "—"}</span>
            </div>
          </div>

          {alreadyCheckedIn ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                This patient is already checked in at your hospital. The hospital administrator must end the active visit before a new check-in.
              </p>
            </div>
          ) : checkInOpen ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-primary" />
                Visit Payment — required before check-in
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Payment Amount (LYD) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 50"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Method *</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={handleCheckIn} disabled={submitting || !amount || !method}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Confirm Check In
                </Button>
                <Button type="button" variant="ghost" onClick={() => setCheckInOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" size="lg" className="w-full" onClick={() => setCheckInOpen(true)}>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Check In
            </Button>
          )}

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Reception access only — no medical information is available to receptionists.
          </p>
        </div>
      )}
    </div>
  );
}