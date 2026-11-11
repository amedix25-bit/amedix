import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Inbox } from "lucide-react";
import IdentitySubmissionCard from "@/components/admin/identity/IdentitySubmissionCard";
import { useAppLanguage } from "@/lib/appLanguage";

// The identity-document review queue. Submitting a document never verifies an
// account — it lands here, and only an administrator's decision approves or
// rejects it. Documents open through short-lived signed links issued by the
// backend, and every access is written into the submission's audit trail.
const TABS = [
  { key: "pending", label: "Pending Review" },
  { key: "verified", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminIdentityReview() {
  const { t } = useAppLanguage();
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (status) => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("adminIdentityReview", { action: "list", status });
      if (res.data?.error) setError(res.data.error);
      setItems(res.data?.items || []);
    } catch (err) {
      setError(t("The review queue could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(tab); }, [tab, load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border p-1 gap-1">
          {TABS.map((x) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setTab(x.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === x.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(x.label)}
            </button>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => load(tab)} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          {t("Refresh")}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("Submitting a document never verifies an account. Review the document and approve or reject it here — the decision is recorded with your name and the time.")}
      </p>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("Loading…")}
        </div>
      )}

      {!loading && error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <Inbox className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">{t("Nothing in this list.")}</p>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {!loading && items.map((item) => (
          <IdentitySubmissionCard key={item.id} item={item} t={t} onDone={() => load(tab)} />
        ))}
      </div>
    </div>
  );
}