import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import BrandLogo from "@/components/BrandLogo";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";

// Public QR verification for an AMedix medical card.
//
// This page is reachable by anyone holding the card, so it answers one
// question only: is this card currently valid? It never reads or shows a
// diagnosis, an allergy, a medication or a document — clinical information
// still requires the patient's own authorization inside AMedix.

const TONE = {
  active: { icon: CheckCircle2, title: "Card is valid", className: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  expired: { icon: AlertTriangle, title: "Card has expired", className: "text-amber-800 bg-amber-50 border-amber-200" },
  revoked: { icon: XCircle, title: "Card has been revoked", className: "text-destructive bg-destructive/10 border-destructive/30" },
};

function day(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VerifyMedicalCard() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [state, setState] = useState({ loading: true, result: null, error: "" });

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) {
        setState({ loading: false, result: null, error: "missing_token" });
        return;
      }
      try {
        const response = await base44.functions.invoke("medicalCardVerify", { token });
        const data = response.data || {};
        if (!alive) return;
        setState({ loading: false, result: data, error: data.found ? "" : "not_found" });
      } catch (err) {
        if (alive) setState({ loading: false, result: null, error: "failed" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const result = state.result;
  const tone = result?.found ? TONE[result.status] || TONE.expired : null;
  const ToneIcon = tone?.icon;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <BrandLogo className="h-12 w-12 object-contain" />
          <div>
            <p className="font-heading text-lg font-bold leading-tight text-foreground">AMedix</p>
            <p className="text-xs text-muted-foreground">Card verification</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {state.loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Checking this card...
            </div>
          )}

          {!state.loading && result?.found && (
            <>
              <div className={`flex items-center gap-2 rounded-xl border p-3 ${tone.className}`}>
                {ToneIcon && <ToneIcon className="h-5 w-5 shrink-0" aria-hidden="true" />}
                <span className="text-sm font-semibold">{tone.title}</span>
              </div>

              <dl className="mt-5 space-y-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Patient</dt>
                  <dd className="break-words text-sm font-semibold text-foreground">{result.patient_name}</dd>
                  {result.patient_name_ar && (
                    <dd dir="rtl" className="break-words text-sm text-foreground">{result.patient_name_ar}</dd>
                  )}
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Patient ID</dt>
                  <dd className="break-all font-mono text-sm font-medium text-foreground">{result.patient_cin}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Issued</dt>
                    <dd className="text-sm font-medium text-foreground">{day(result.issued_datetime)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Valid until</dt>
                    <dd className="text-sm font-medium text-foreground">{day(result.expires_datetime)}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Card number</dt>
                  <dd className="break-all font-mono text-sm font-medium text-foreground">{result.card_number}</dd>
                </div>
              </dl>

              <p className="mt-5 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  This page confirms the card's current status only. Clinical records are never shown here — a doctor
                  can see them inside AMedix only with the patient's authorization.
                </span>
              </p>
            </>
          )}

          {!state.loading && !result?.found && (
            <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-4 text-sm text-foreground">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              <span>
                {state.error === "missing_token"
                  ? "This link does not include a card code. Scan the QR code printed on the AMedix medical card."
                  : state.error === "failed"
                    ? "The card could not be checked right now. Please try again in a moment."
                    : "No AMedix medical card matches this code. It may have been replaced by a newer card."}
              </span>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          AMedix · Connected Care. Better Health.
        </p>
      </div>
    </div>
  );
}