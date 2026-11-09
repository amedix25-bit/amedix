import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import {
  Building2, Check, X, KeyRound, Copy, RotateCcw, Ban, FileText, Loader2, Clock, ShieldCheck, ExternalLink,
} from "lucide-react";
import HospitalAccountControls, { HOSPITAL_STATUS_LABEL } from "./HospitalAccountControls";

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

const STATUS = {
  pending: { label: "Pending approval", cls: "bg-warning/15 text-warning border-warning/30" },
  approved: { label: "Approved", cls: "bg-success/15 text-success border-success/30" },
  rejected: { label: "Rejected", cls: "bg-critical/15 text-critical border-critical/30" },
};

export default function HospitalAuthorizationCard({ item, onChanged, onDeleted }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [issuedCode, setIssuedCode] = useState("");
  const [showPanels, setShowPanels] = useState(false);

  const status = STATUS[item.status] || STATUS.pending;
  const canIssue = item.status === "approved" && !item.is_activated;

  const run = async (action, payload = {}, label = "") => {
    setBusy(action);
    try {
      const res = await base44.functions.invoke("adminHospitalAuthorizations", { action, id: item.id, ...payload });
      if (res.data?.issued_code) setIssuedCode(res.data.issued_code);
      if (res.data?.authorization) onChanged?.(res.data.authorization);
      toast({ title: label || "Done" });
      setNote("");
      setReason("");
      setRevokeReason("");
    } catch (err) {
      toast({
        title: "Action failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy("");
    }
  };

  const openDocument = async () => {
    if (!item.license_file_uri) return;
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: item.license_file_uri });
      window.open(res.signed_url, "_blank", "noopener");
    } catch (err) {
      toast({ title: "Could not open the document", description: err.message, variant: "destructive" });
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(issuedCode);
      toast({ title: "Code copied", description: "Hand it to the institution through a verified channel." });
    } catch {
      /* code stays visible on screen */
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        {item.photo_url ? (
          <Image src={item.photo_url} alt={item.hospital_name} fittingType="fill" className="w-12 h-12 rounded-xl shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold truncate">{item.hospital_name}</p>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
            {item.is_activated && (
              <span className="text-[11px] px-2 py-0.5 rounded-full border bg-success/15 text-success border-success/30">
                Activated
              </span>
            )}
            {item.hospital_status && item.hospital_status !== "active" && (
              <span className="text-[11px] px-2 py-0.5 rounded-full border bg-warning/15 text-warning border-warning/30">
                {HOSPITAL_STATUS_LABEL[item.hospital_status]}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.request_reference} · submitted {fmt(item.submitted_datetime)}
          </p>
        </div>
      </div>

      <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><dt className="text-muted-foreground text-xs">Location</dt><dd className="font-medium">{item.location || "—"}</dd></div>
        <div><dt className="text-muted-foreground text-xs">Phone</dt><dd className="font-medium">{item.contact_phone || "—"}</dd></div>
        <div><dt className="text-muted-foreground text-xs">Contact email</dt><dd className="font-medium truncate">{item.contact_email || "—"}</dd></div>
        <div>
          <dt className="text-muted-foreground text-xs">Authorization code</dt>
          <dd className="font-medium">
            {item.code_status === "none" && "Not issued"}
            {item.code_status === "issued" && `${item.code_preview} · expires ${fmt(item.code_expiry_datetime)}`}
            {item.code_status === "used" && `Used ${fmt(item.code_used_datetime)}`}
            {item.code_status === "revoked" && "Revoked"}
            {item.code_status === "expired" && "Expired"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        {item.license_file_name && (
          <Button variant="outline" size="sm" onClick={openDocument}>
            <FileText className="w-4 h-4 mr-2" />
            {item.license_file_name}
            <ExternalLink className="w-3 h-3 ml-1.5 opacity-60" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setShowPanels((s) => !s)}>
          {showPanels ? "Hide controls" : "Review controls"}
        </Button>
        <HospitalAccountControls item={item} onChanged={onChanged} onDeleted={onDeleted} />
      </div>

      {issuedCode && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <p className="text-xs font-medium text-primary">
            Authorization code — shown once. Store it nowhere; deliver it to the institution through a verified channel.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-base tracking-wider bg-card border border-border rounded-lg px-3 py-2">
              {issuedCode}
            </code>
            <Button size="sm" variant="outline" onClick={copyCode}>
              <Copy className="w-4 h-4 mr-1.5" />
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Expires {fmt(item.code_expiry_datetime)} · single use</p>
        </div>
      )}

      {showPanels && (
        <div className="space-y-3 border-t border-border pt-4">
          {item.status === "pending" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Approve institution</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional approval note" />
                <Button size="sm" onClick={() => run("approve", { note }, "Institution approved")} disabled={busy === "approve"}>
                  {busy === "approve" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Approve
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Reject with reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why the registration is not approved" />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => run("reject", { reason }, "Registration rejected")}
                  disabled={busy === "reject" || reason.trim().length < 5}
                >
                  {busy === "reject" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                  Reject
                </Button>
              </div>
            </div>
          )}

          {canIssue && (
            <div className="space-y-2">
              <Label className="text-xs">
                {item.code_status === "issued" ? "Regenerate authorization code" : "Issue authorization code"}
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Expires in 3 days</SelectItem>
                    <SelectItem value="7">Expires in 7 days</SelectItem>
                    <SelectItem value="14">Expires in 14 days</SelectItem>
                    <SelectItem value="30">Expires in 30 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => run(item.code_status === "issued" ? "regenerate_code" : "issue_code", { expiry_days: Number(expiryDays) }, "Authorization code issued")}
                  disabled={busy === "issue_code" || busy === "regenerate_code"}
                >
                  {busy === "issue_code" || busy === "regenerate_code" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : item.code_status === "issued" ? (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-2" />
                  )}
                  {item.code_status === "issued" ? "Regenerate code" : "Issue code"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The plain code is returned once at issue time; only its salted hash is stored. Regenerating replaces the
                outstanding code immediately.
              </p>
            </div>
          )}

          {canIssue && item.code_status === "issued" && (
            <div className="space-y-2">
              <Label className="text-xs">Revoke the outstanding code</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Reason for revocation"
                  className="max-w-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => run("revoke_code", { reason: revokeReason }, "Code revoked")}
                  disabled={busy === "revoke_code" || revokeReason.trim().length < 3}
                >
                  {busy === "revoke_code" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                  Revoke
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Internal review notes (never shown to the hospital)</Label>
            <Textarea
              defaultValue={item.admin_notes || ""}
              onBlur={(e) => {
                if ((e.target.value || "") !== (item.admin_notes || "")) run("save_notes", { notes: e.target.value }, "Notes saved");
              }}
              placeholder="Verification checks performed, call reference, outstanding items"
              rows={2}
            />
          </div>

          {item.status === "rejected" && (
            <p className="text-xs text-critical">
              Rejected by {item.reviewed_by_name || "AMedix administration"} · {item.rejection_reason || "no reason recorded"}
            </p>
          )}
        </div>
      )}

      {(item.audit || []).length > 0 && (
        <details className="border-t border-border pt-3">
          <summary className="text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Audit history ({item.audit.length})
          </summary>
          <ol className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
            {[...item.audit].reverse().map((entry, i) => (
              <li key={`${entry.datetime}-${i}`} className="text-xs flex gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{entry.action_label || entry.action}</p>
                  <p className="text-muted-foreground">
                    {fmt(entry.datetime)} · {entry.actor_name || "system"} ({entry.actor_role || "system"})
                    {entry.detail ? ` · ${entry.detail}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}