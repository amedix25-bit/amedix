import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ShieldCheck, ShieldAlert, ShieldX, KeyRound, Loader2, LogOut, Clock, Building2 } from "lucide-react";

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

const STATUS_VIEW = {
  pending: {
    icon: Clock,
    tone: "border-warning/30 bg-warning/10 text-warning",
    title: "Pending Administrative Approval",
    body: "AMedix administration is reviewing this institution's registration and submitted documentation. Your AMedix Hospital Code stays locked until the institution is approved and an authorization code is activated.",
  },
  rejected: {
    icon: ShieldX,
    tone: "border-critical/30 bg-critical/10 text-critical",
    title: "Registration not approved",
    body: "This institution's registration was not approved by AMedix administration.",
  },
  none: {
    icon: ShieldAlert,
    tone: "border-border bg-muted text-foreground",
    title: "No authorization request",
    body: "This institution has no AMedix authorization record. Please contact AMedix administration.",
  },
  approved: {
    icon: ShieldCheck,
    tone: "border-success/30 bg-success/10 text-success",
    title: "Approved by AMedix administration",
    body: "Enter the single-use authorization code issued to this institution to unlock your AMedix Hospital Code.",
  },
};

// Server-gated activation. Nothing on this screen decides authorization — the
// code is verified by the backend against the hashed, hospital-bound record.
export default function HospitalAuthorizationGate({ profile, initial, onActivated }) {
  const { toast } = useToast();
  const [state, setState] = useState(initial?.authorization || null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const authorization = state;
  const status = authorization?.status || "none";
  const view = STATUS_VIEW[status] || STATUS_VIEW.none;
  const Icon = view.icon;
  const codeStatus = authorization?.code_status || "none";
  const canActivate = status === "approved" && codeStatus === "issued" && !authorization?.is_locked;

  const activate = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("hospitalAuthorization", { action: "activate", code });
      if (res.data?.activated) {
        toast({ title: "Hospital authorized", description: "You can now create your AMedix Hospital Code." });
        setState(res.data.authorization);
        onActivated?.();
        return;
      }
      setError("The authorization code could not be verified.");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Activation failed.");
      if (err.response?.data?.authorization) setState(err.response.data.authorization);
    } finally {
      setBusy(false);
    }
  };

  const audit = [...(authorization?.audit || [])].reverse().slice(0, 8);

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 py-10">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-heading font-semibold truncate">{profile?.hospital_name}</p>
              <p className="text-xs text-muted-foreground">
                {authorization?.request_reference || "Hospital portal"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => base44.auth.logout()}>
            <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            Sign out
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className={`flex items-start gap-3 rounded-xl border p-4 ${view.tone}`}>
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">{view.title}</p>
              <p className="text-sm text-foreground/80 mt-1">{view.body}</p>
            </div>
          </div>

          {status === "rejected" && authorization?.rejection_reason && (
            <div className="text-sm">
              <span className="text-muted-foreground">Reason: </span>
              <span className="font-medium">{authorization.rejection_reason}</span>
            </div>
          )}

          {!authorization ? (
            <p className="text-sm text-muted-foreground">
              No authorization request was found for this institution. Please contact AMedix administration.
            </p>
          ) : (
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="font-medium">{fmt(authorization.submitted_datetime)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Decision</dt>
                <dd className="font-medium">
                  {authorization.decision_datetime ? fmt(authorization.decision_datetime) : "Awaiting review"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Submitted document</dt>
                <dd className="font-medium truncate">{authorization.license_file_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Authorization code</dt>
                <dd className="font-medium">
                  {codeStatus === "none" && "Not issued"}
                  {codeStatus === "issued" && `${authorization.code_preview} · expires ${fmt(authorization.code_expiry_datetime)}`}
                  {codeStatus === "used" && `Activated ${fmt(authorization.code_used_datetime)}`}
                  {codeStatus === "revoked" && "Revoked by AMedix administration"}
                  {codeStatus === "expired" && "Expired — contact AMedix administration"}
                </dd>
              </div>
            </dl>
          )}

          {canActivate && (
            <form onSubmit={activate} className="space-y-3 border-t border-border pt-5">
              <Label htmlFor="authorization_code">AMedix Authorization Code</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="authorization_code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="AMX-AUTH-XXXX-XXXX-XXXX"
                    className="pl-10 font-mono tracking-wide"
                    autoComplete="off"
                    required
                  />
                </div>
                <Button type="submit" disabled={busy || code.trim().length < 10}>
                  {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Activate hospital
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Single use. {authorization?.attempts_remaining ?? 5} attempt(s) remaining before activation is temporarily locked.
              </p>
            </form>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive text-sm p-3">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {status === "approved" && codeStatus === "none" && (
            <p className="text-sm text-muted-foreground">
              AMedix administration has approved this institution and will issue the authorization code to this
              dashboard once it is generated.
            </p>
          )}
        </div>

        {audit.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold mb-3">Authorization history</p>
            <ol className="space-y-3">
              {audit.map((entry, i) => (
                <li key={`${entry.datetime}-${i}`} className="flex gap-3 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">{entry.action_label || entry.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmt(entry.datetime)} · {entry.actor_name || "AMedix system"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          <Badge variant="outline" className="mr-2">Secure</Badge>
          Authorization is verified on the AMedix server. It cannot be completed or bypassed from the browser.
        </p>
      </div>
    </div>
  );
}