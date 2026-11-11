import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAppLanguage } from "@/lib/appLanguage";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, KeyRound, Loader2, Plus, ShieldOff } from "lucide-react";

const TYPES = [
  { key: "hospital", label: "Hospital" },
  { key: "laboratory", label: "Laboratory" },
  { key: "pharmacy", label: "Pharmacy" },
];

const STATE_STYLES = {
  issued: "bg-blue-100 text-blue-700",
  used: "bg-emerald-100 text-emerald-700",
  revoked: "bg-red-100 text-red-700",
  disabled: "bg-slate-200 text-slate-700",
  expired: "bg-slate-200 text-slate-700",
};

// AMedix Administration Code management. Codes are issued here by an AMedix
// administrator, are valid for ONE institution type, and the plain code is
// shown only once — the server stores a fingerprint only.
export default function AdminAccessCodes() {
  const { t } = useAppLanguage();
  const { toast } = useToast();
  const [codes, setCodes] = useState(null);
  const [institutionType, setInstitutionType] = useState("hospital");
  const [assignedName, setAssignedName] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [maxUses, setMaxUses] = useState("1");
  const [notes, setNotes] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await base44.functions.invoke("registrationCode", { action: "list" });
      setCodes(res.data.codes || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const issue = async () => {
    setError("");
    setIssuing(true);
    try {
      const res = await base44.functions.invoke("registrationCode", {
        action: "issue",
        institution_type: institutionType,
        assigned_institution_name: assignedName,
        expiry_days: Number(expiryDays) || 30,
        max_uses: Number(maxUses) || 1,
        notes,
      });
      setIssued(res.data);
      setAssignedName("");
      setNotes("");
      load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIssuing(false);
    }
  };

  const withdraw = async (code, action) => {
    setBusyId(code.id);
    try {
      await base44.functions.invoke("registrationCode", {
        action,
        code_id: code.id,
        reason: action === "revoke" ? "Revoked by AMedix administration" : "Disabled by AMedix administration",
      });
      toast({ title: action === "revoke" ? t("Code revoked") : t("Code disabled") });
      load();
    } catch (err) {
      toast({ title: t("Could not update the code"), description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(issued.code);
      toast({ title: t("Code copied") });
    } catch (err) {
      /* the code stays visible */
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t("Issue an AMedix Administration Code")}</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("Institution type *")}</Label>
            <Select value={institutionType} onValueChange={setInstitutionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {t(type.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned-name">{t("Institution (optional)")}</Label>
            <Input id="assigned-name" value={assignedName} onChange={(e) => setAssignedName(e.target.value)} placeholder={t("e.g. Tripoli Central Hospital")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry-days">{t("Valid for (days)")}</Label>
            <Input id="expiry-days" type="number" min="1" max="180" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-uses">{t("Usage limit")}</Label>
            <Input id="max-uses" type="number" min="1" max="10" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="code-notes">{t("Internal note")}</Label>
          <Input id="code-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("Who it was issued to / why")} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={issue} disabled={issuing}>
          {issuing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("Generate code")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("A code is valid for one institution type only. Give it directly to the institution; it is shown once and cannot be recovered.")}
        </p>

        {issued && (
          <div className="rounded-xl border border-success/30 bg-success/5 p-4">
            <p className="text-sm font-medium">{t("Code issued — share it now")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="rounded-lg bg-card px-3 py-2 text-lg font-bold tracking-widest">{issued.code}</code>
              <Button size="sm" variant="outline" onClick={copy}>
                <Copy className="mr-1.5 h-4 w-4" />
                {t("Copy")}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("This is the only time the code is displayed. It authorises registration only — never portal or clinical access.")}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <KeyRound className="h-4 w-4 text-primary" />
          {t("Issued codes")}
        </h3>
        {codes === null ? (
          <p className="text-sm text-muted-foreground">{t("Loading...")}</p>
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No codes issued yet.")}</p>
        ) : (
          codes.map((code) => (
            <div key={code.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-sm font-semibold">{code.code_preview}</code>
                  <Badge className={`border-0 ${STATE_STYLES[code.state] || "bg-muted"}`}>{code.state}</Badge>
                  <span className="text-xs text-muted-foreground">{t(code.institution_type)}</span>
                  {code.assigned_institution_name && (
                    <span className="text-xs text-muted-foreground">· {code.assigned_institution_name}</span>
                  )}
                </div>
                {["issued", "disabled"].includes(code.state) && (
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => withdraw(code, "revoke")} disabled={busyId === code.id}>
                    <ShieldOff className="mr-1.5 h-4 w-4" />
                    {t("Revoke")}
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("Expires")} {code.expiry_datetime ? new Date(code.expiry_datetime).toLocaleDateString() : "—"} · {t("Used")} {code.used_count}/{code.max_uses}
                {code.used_by_email ? ` · ${code.used_by_email}` : ""}
                {code.issued_by_name ? ` · ${t("Issued by")} ${code.issued_by_name}` : ""}
              </p>
              {code.revoke_reason && <p className="mt-1 text-xs text-destructive">{code.revoke_reason}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}