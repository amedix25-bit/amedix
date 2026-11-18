import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, RefreshCw, QrCode, ShieldOff } from "lucide-react";
import { dateTimeLabel, remainingLabel } from "@/lib/emergencyQr";

// The Emergency Department's rotating QR. A new signed token is minted every
// rotation window, so a photographed code stops working within two minutes.
export default function EmergencyQrPanel({ qr, credential, rotationSeconds, onRotate, onRevoke, busy, error }) {
  const [confirm, setConfirm] = React.useState(false);
  const src = qr?.token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=2&data=${encodeURIComponent(qr.token)}`
    : "";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading text-lg font-bold flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" /> Emergency Department QR
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Displayed in the Emergency Department. Rotating and time-limited: a new signed code every{" "}
            {Math.round((rotationSeconds || 120) / 60)} minutes.
          </p>
        </div>
        <Badge variant="outline" className={credential ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-gray-300 text-muted-foreground"}>
          {credential ? "Active" : "Not issued"}
        </Badge>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {qr?.token ? (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="rounded-xl border border-border bg-white p-3">
            <img src={src} alt="Hospital Emergency Department QR" width={220} height={220} className="rounded-md" />
          </div>
          <div className="text-sm space-y-1 text-center sm:text-left">
            <p className="font-semibold">Valid for {remainingLabel(qr.expires)}</p>
            <p className="text-xs text-muted-foreground">Refreshed {dateTimeLabel(qr.expires)}</p>
            <p className="text-xs text-muted-foreground">
              Any verified doctor who scans this code receives immediate temporary emergency authorization. This QR never
              grants access to a patient record on its own.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
              <Button size="sm" variant="outline" onClick={onRotate} disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh now
              </Button>
              {!confirm ? (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirm(true)} disabled={busy}>
                  <ShieldOff className="w-4 h-4" /> Revoke QR
                </Button>
              ) : (
                <span className="flex items-center gap-2">
                  <Button size="sm" variant="destructive" onClick={() => { setConfirm(false); onRevoke(); }} disabled={busy}>
                    Confirm revoke
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
                    Cancel
                  </Button>
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No Emergency Department QR is active. Issue one so your department can be reached by scanning doctors.
          <div className="pt-3">
            <Button size="sm" onClick={onRotate} disabled={busy}>
              Issue Emergency QR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}