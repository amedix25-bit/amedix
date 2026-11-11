import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAppLanguage } from "@/lib/appLanguage";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, PauseCircle, XCircle } from "lucide-react";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-slate-200 text-slate-700",
};

// AMedix administration review of laboratory and pharmacy registrations. The
// institution stays pending and inactive until it is approved here; approving
// creates and activates its institutional profile server-side.
export default function AdminInstitutionApprovals() {
  const { t } = useAppLanguage();
  const { toast } = useToast();
  const [rows, setRows] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [reason, setReason] = useState({});
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await base44.functions.invoke("adminInstitutionApprovals", { action: "list" });
      setRows(res.data.registrations || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (row, action) => {
    setBusyId(row.id);
    setError("");
    try {
      await base44.functions.invoke("adminInstitutionApprovals", {
        action,
        registration_id: row.id,
        reason: reason[row.id] || "",
        note: reason[row.id] || "",
      });
      toast({ title: action === "approve" ? t("Institution approved") : t("Decision recorded") });
      load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (rows === null) return <p className="text-sm text-muted-foreground">{t("Loading...")}</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("No institutional registrations have been submitted yet.")}</p>;

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{row.legal_name}</p>
            <Badge className={`border-0 ${STATUS_STYLES[row.status] || "bg-muted"}`}>{row.status}</Badge>
            <span className="text-xs text-muted-foreground">{t(row.institution_type)}</span>
            {row.registration_reference && <span className="text-xs text-muted-foreground">· {row.registration_reference}</span>}
          </div>
          <div className="mt-2 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
            <p>{t("Registration no.")}: {row.registration_number || "—"}</p>
            <p>{t("Licence no.")}: {row.license_number || "—"}</p>
            <p>{row.institution_type === "laboratory" ? t("Laboratory director") : t("Responsible pharmacist")}: {row.responsible_person_name || "—"}</p>
            <p>{t("Administrator")}: {row.administrator_name || "—"}</p>
            <p>{t("Address")}: {row.address || "—"}</p>
            <p>{t("Account email")}: {row.email || "—"}</p>
            <p>{t("Submitted")}: {row.submitted_datetime ? new Date(row.submitted_datetime).toLocaleString() : "—"}</p>
            <p>{t("Code used")}: {row.registration_code_preview || "—"}</p>
            {row.reviewed_by_name && <p>{t("Reviewed by")}: {row.reviewed_by_name}</p>}
          </div>
          {row.decision_note && <p className="mt-2 text-xs text-destructive">{row.decision_note}</p>}

          {(row.status === "pending" || row.status === "suspended") && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <input
                className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
                placeholder={t("Reason (required to reject)")}
                value={reason[row.id] || ""}
                onChange={(e) => setReason((s) => ({ ...s, [row.id]: e.target.value }))}
              />
              {row.status === "pending" && (
                <Button size="sm" onClick={() => decide(row, "approve")} disabled={busyId === row.id}>
                  {busyId === row.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                  {t("Approve & activate")}
                </Button>
              )}
              {row.status === "pending" ? (
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => decide(row, "reject")} disabled={busyId === row.id}>
                  <XCircle className="mr-1.5 h-4 w-4" />
                  {t("Reject")}
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => decide(row, "suspend")} disabled={busyId === row.id}>
                  <PauseCircle className="mr-1.5 h-4 w-4" />
                  {t("Suspend")}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}