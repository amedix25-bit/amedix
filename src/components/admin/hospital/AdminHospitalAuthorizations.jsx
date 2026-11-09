import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Building2, ShieldQuestion } from "lucide-react";
import HospitalAuthorizationCard from "./HospitalAuthorizationCard";

const FILTERS = [
  { key: "pending", label: "Pending approval" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All requests" },
];

// AMedix administration workspace for hospital registration authorization.
// Reads through a server function that verifies the administrator role, so the
// data behind it is never reachable from a non-admin session.
export default function AdminHospitalAuthorizations() {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("adminHospitalAuthorizations", { action: "list" });
      setItems(res.data?.items || []);
    } catch (err) {
      toast({
        title: "Could not load hospital requests",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
      setItems([]);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const list = items || [];
    return {
      pending: list.filter((i) => i.status === "pending").length,
      approved: list.filter((i) => i.status === "approved").length,
      rejected: list.filter((i) => i.status === "rejected").length,
      all: list.length,
    };
  }, [items]);

  const visible = (items || []).filter((i) => filter === "all" || i.status === filter);

  const replace = (updated) => {
    setItems((prev) => (prev || []).map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            No hospital can create its AMedix Hospital Code, or have doctors affiliate with it, until the institution
            is approved here and activates the single-use authorization code issued to it.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.label}
            <span className="ml-2 text-xs opacity-80">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          {filter === "pending" ? (
            <>
              <ShieldQuestion className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">No hospital registrations are awaiting approval</p>
              <p className="text-sm text-muted-foreground mt-1">New submissions appear here automatically.</p>
            </>
          ) : (
            <>
              <Building2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">Nothing in this view</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <HospitalAuthorizationCard key={item.id} item={item} onChanged={replace} />
          ))}
        </div>
      )}
    </div>
  );
}