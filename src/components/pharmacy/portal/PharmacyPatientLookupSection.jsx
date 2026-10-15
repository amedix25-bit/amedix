import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ScanLine, Keyboard, User } from "lucide-react";
import QrScanner from "@/components/lab/technician/QrScanner";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";
import PrescriptionActions from "@/components/pharmacy/PrescriptionActions";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import PharmacyVisitBar from "@/components/pharmacy/pharmacist/PharmacyVisitBar";
import PharmacyPatientVisits from "@/components/pharmacy/pharmacist/PharmacyPatientVisits";
import PharmacyPatientNotes from "@/components/pharmacy/pharmacist/PharmacyPatientNotes";

function FoundPatient({ data, onReset, session }) {
  return (
    <div className="space-y-4">
      <PharmacyVisitBar session={session} patient={data.patient} />
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{data.patient.full_name}</p>
          <p className="text-xs text-muted-foreground">
            CIN {data.patient.cin}
            {data.patient.date_of_birth ? ` · DOB ${data.patient.date_of_birth}` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>Scan Another</Button>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Prescriptions Authorized to Your Pharmacy</h3>
        {data.prescriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 rounded-xl border border-border bg-card">
            This patient has no prescriptions authorized to your pharmacy yet.
          </p>
        ) : (
          <div className="space-y-3">
            {data.prescriptions.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {p.medication_name}{p.strength ? ` ${p.strength}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.prescription_id} · Prescribed by {p.doctor_name} · {p.date_prescribed}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.reservation_code && p.status !== "dispensed" && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{p.reservation_code}</span>
                    )}
                    <PrescriptionStatusBadge status={p.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                  <div><span className="text-muted-foreground">Dosage:</span> {p.dosage || "—"}</div>
                  <div><span className="text-muted-foreground">Frequency:</span> {p.frequency || "—"}</div>
                  <div><span className="text-muted-foreground">Duration:</span> {p.duration || "—"}</div>
                  <div><span className="text-muted-foreground">Quantity:</span> {p.quantity || "—"}</div>
                </div>
                {p.special_instructions && (
                  <p className="text-xs text-muted-foreground mt-2">Instructions: {p.special_instructions}</p>
                )}
                <div className="mt-3">
                  <PrescriptionActions prescription={p} onChanged={onReset} session={session} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {session && <PharmacyPatientVisits session={session} patient={data.patient} />}
      {session && <PharmacyPatientNotes session={session} patient={data.patient} />}
    </div>
  );
}

// Pharmacy counter identification: scan the patient's CIN QR code or type the
// CIN, then work with the prescriptions authorized to this pharmacy.
export default function PharmacyPatientLookupSection({ session }) {
  const [mode, setMode] = useState(null); // "scan" | "manual" | null
  const [cin, setCin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState(null);
  const { toast } = useToast();

  const lookup = async (value) => {
    const clean = String(value || "").trim();
    if (!clean) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("pharmacyFindPatientByCin", {
        cin: clean,
        ...(session
          ? { pharmacist_id: session.pharmacist_id, pharmacist_session_token: session.session_token }
          : {}),
      });
      setFound(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Patient lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFound(null);
    setCin("");
    setMode(null);
    setError("");
  };

  if (found) {
    return <FoundPatient data={found} onReset={reset} session={session} />;
  }

  return (
    <div className="space-y-4">
      {!mode && (
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => setMode("scan")}
            className="rounded-xl border border-border bg-card p-6 text-center hover:border-primary/30 transition-colors"
          >
            <ScanLine className="w-7 h-7 text-primary mx-auto mb-2" />
            <p className="font-semibold text-sm">Scan Patient QR</p>
            <p className="text-xs text-muted-foreground mt-1">Identify the patient with their CIN QR code</p>
          </button>
          <button
            onClick={() => setMode("manual")}
            className="rounded-xl border border-border bg-card p-6 text-center hover:border-primary/30 transition-colors"
          >
            <Keyboard className="w-7 h-7 text-primary mx-auto mb-2" />
            <p className="font-semibold text-sm">Enter CIN Manually</p>
            <p className="text-xs text-muted-foreground mt-1">Type the patient's CIN</p>
          </button>
        </div>
      )}

      {mode === "scan" && (
        <div className="space-y-3">
          <QrScanner onScan={lookup} label="Scan the patient's CIN QR code" onManualEntry={() => setMode("manual")} manualLabel="Enter CIN Manually" />
          <Button variant="ghost" size="sm" onClick={reset}>Back</Button>
        </div>
      )}

      {mode === "manual" && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Input
            placeholder="Patient CIN, e.g. CIN-2026-8F3K"
            value={cin}
            onChange={(e) => setCin(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") lookup(cin); }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={() => lookup(cin)} disabled={loading || !cin.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Find Patient
            </Button>
            <Button variant="ghost" onClick={reset}>Back</Button>
          </div>
        </div>
      )}

      {loading && !found && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Looking up patient...
        </p>
      )}
      {error && !found && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}