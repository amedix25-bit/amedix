import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Building2, ShieldCheck, UserRound, Clock, PauseCircle, Flag, Trash2, Loader2, RefreshCw, ScrollText } from "lucide-react";
import AccountActionRow from "./AccountActionRow";
import GovernanceAuditLog from "./GovernanceAuditLog";

const SECTIONS = [
  { key: "verified_hospitals", label: "Verified hospitals", icon: Building2 },
  { key: "verified_doctors", label: "Verified doctors", icon: ShieldCheck },
  { key: "verified_patients", label: "Verified patients", icon: UserRound },
  { key: "pending_accounts", label: "Pending accounts", icon: Clock },
  { key: "suspended_accounts", label: "Suspended accounts", icon: PauseCircle },
  { key: "test_accounts", label: "Identified test accounts", icon: Trash2 },
  { key: "flagged_accounts", label: "Flagged for review", icon: Flag },
];

// Administrator dashboard for the verified communication network: who is
// verified, who is pending or suspended, which accounts the audit identified as
// test accounts, and the controls that change any of it.
export default function AdminAccountGovernance() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [section, setSection] = useState("verified_hospitals");
  const [view, setView] = useState("accounts");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await base44.functions.invoke("adminAccountGovernance", { action: "overview" });
      setData(res.data);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.error || "The account governance view is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (account, action, extra = {}) => {
    setBusy(account.user_id);
    try {
      await base44.functions.invoke("adminAccountGovernance", { action, user_id: account.user_id, ...extra });
      toast({ title: "Account updated", description: `${account.display_name || account.email} — ${action.replace(/([A-Z])/g, " $1").toLowerCase()}.` });
      await load();
    } catch (e) {
      toast({ variant: "destructive", title: "Change not applied", description: e?.response?.data?.error });
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <p className="rounded-lg border border-critical/30 bg-critical/5 px-3 py-2 text-xs text-critical">{error}</p>;
  }

  const counts = data?.counts || {};
  const current = SECTIONS.find((s) => s.key === section);
  const rows = (data?.groups || {})[section] || [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold">Verified Communication Network</h2>
            <p className="text-xs text-muted-foreground">
              Only verified, approved and active accounts can message. These figures come from the live account records.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => { setSection(s.key); setView("accounts"); }}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  section === s.key && view === "accounts" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <Icon className="mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-semibold leading-none">{counts[s.key] ?? 0}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 text-xs">
        <button
          onClick={() => setView("accounts")}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium ${view === "accounts" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Accounts
        </button>
        <button
          onClick={() => setView("audit")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium ${view === "audit" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          <ScrollText className="h-3.5 w-3.5" /> Audit trail ({data?.audit?.length || 0})
        </button>
      </div>

      {view === "audit" ? (
        <GovernanceAuditLog entries={data?.audit || []} />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{current?.label}</p>
            <p className="text-xs text-muted-foreground">{rows.length} account{rows.length === 1 ? "" : "s"}</p>
          </div>
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-xs text-muted-foreground">
              No accounts in this group.
            </p>
          ) : (
            rows.map((account) => (
              <AccountActionRow key={`${account.user_id}-${account.account_type}`} account={account} busy={busy} onAct={act} />
            ))
          )}
        </div>
      )}
    </div>
  );
}