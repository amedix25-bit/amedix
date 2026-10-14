import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import {
  Loader2, Receipt, Search, Plus, Download, ShieldCheck, Clock3, ChevronDown, ChevronUp,
} from "lucide-react";
import PaymentRecordDialog, { METHODS } from "./PaymentRecordDialog";
import PaymentCorrectionDialog from "./PaymentCorrectionDialog";
import { generateReceiptPdf } from "@/lib/pharmacyReceiptPdf";
import { useAppLanguage } from "@/lib/appLanguage";

export const METHOD_LABELS = Object.fromEntries(METHODS.map((m) => [m.key, m.label]));

const STATUS = {
  unpaid: { label: "Payment Pending", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  partial: { label: "Partially Paid", cls: "border-sky-200 bg-sky-50 text-sky-700" },
  paid: { label: "Paid", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  refunded: { label: "Refunded", cls: "border-border bg-muted text-muted-foreground" },
};

// Payments and Transactions — the pharmacy's financial ledger. Every payment,
// refund and adjustment is a separate, traceable record linked to the patient,
// prescription and dispensing transaction. Payment status is kept strictly
// separate from dispensing status, and card / transfer / insurance payments
// stay pending until a pharmacist verifies them.
export default function PharmacistTransactionsSection({ prescriptions, session, onSessionExpired }) {
  const { t } = useAppLanguage();
  const [txs, setTxs] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [expanded, setExpanded] = useState({});

  const loadTxs = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("pharmacyPaymentManage", {
        action: "list",
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      setTxs(res.data.transactions || []);
    } catch (err) {
      if (err.response?.status === 401) {
        onSessionExpired?.();
        return;
      }
      setTxs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.pharmacist_id, session?.session_token]);

  useEffect(() => {
    loadTxs();
  }, [loadTxs]);

  // Rows: every ledger transaction, plus dispensing events with no ledger
  // record yet (older fills and unpaid fills).
  const transactions = useMemo(() => {
    const rows = (txs || []).map((tx) => ({ kind: "ledger", tx }));
    const seen = new Set(
      (txs || []).map((tx) => `${tx.prescription_ref || ""}|${tx.dispensing_datetime || ""}`)
    );
    for (const p of prescriptions || []) {
      for (const ev of p.dispensing_events || []) {
        const key = `${p.prescription_id || ""}|${ev.datetime || ""}`;
        if (seen.has(key)) continue;
        rows.push({ kind: "event", event: ev, prescription: p });
      }
    }
    rows.sort((a, b) => {
      const da = a.kind === "ledger" ? (a.tx.updated_datetime || a.tx.created_datetime || "") : a.event.datetime || "";
      const db = b.kind === "ledger" ? (b.tx.updated_datetime || b.tx.created_datetime || "") : b.event.datetime || "";
      return String(db).localeCompare(String(da));
    });
    return rows;
  }, [txs, prescriptions]);

  const q = query.trim().toLowerCase();
  const filtered = transactions.filter((r) => {
    if (r.kind === "ledger") {
      const tx = r.tx;
      if (filter === "balance" && !(tx.outstanding_balance > 0)) return false;
      if (filter === "pending" && !(tx.payments || []).some((e) => e.verification === "pending_verification")) return false;
      if (filter === "paid" && !(tx.payment_status === "paid" || tx.payment_status === "refunded")) return false;
    } else if (filter !== "all") {
      return false;
    }
    if (!q) return true;
    const src = r.kind === "ledger" ? r.tx : r.prescription;
    return [
      src.patient_name, src.patient_cin, r.kind === "ledger" ? src.transaction_id : "",
      src.prescription_ref || src.prescription_id,
      r.kind === "ledger" ? (src.items || []).map((i) => i.medication_name).join(" ") : src.medication_name,
      r.kind === "event" ? r.event.batch_number : "",
    ].some((v) => String(v || "").toLowerCase().includes(q));
  });

  const ledgerRows = filtered.filter((r) => r.kind === "ledger");
  const totalDue = ledgerRows.reduce((s, r) => s + (r.tx.amount_due || 0), 0);
  const totalPaid = ledgerRows.reduce((s, r) => s + (r.tx.amount_paid || 0), 0);
  const totalBalance = ledgerRows.reduce((s, r) => s + (r.tx.outstanding_balance || 0), 0);

  const invokeAction = async (payload) => {
    setBusy(true);
    try {
      await base44.functions.invoke("pharmacyPaymentManage", {
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
        ...payload,
      });
      await loadTxs();
      return true;
    } catch (err) {
      if (err.response?.status === 401) {
        onSessionExpired?.();
      } else {
        setDialogError(err.response?.data?.error || "The action failed. Please try again.");
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitRecord = async (form) => {
    setDialogError("");
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setDialogError("Enter a payment amount greater than zero.");
      return;
    }
    const ok = await invokeAction({
      action: "record",
      prescription_ref: form.prescription_ref,
      transaction_id: dialog.tx?.id || undefined,
      dispensing_datetime: dialog.dispensing_datetime || (dialog.event ? dialog.event.datetime : ""),
      amount_due: form.amount_due ? Number(form.amount_due) : undefined,
      amount,
      method: form.method,
      note: form.note || "",
      idempotency_key: `${session.pharmacist_id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
    if (ok) setDialog(null);
  };

  const submitCorrection = async (form) => {
    setDialogError("");
    const amount = Number(form.amount);
    if (dialog.mode === "refund") {
      if (!Number.isFinite(amount) || amount <= 0) {
        setDialogError("Enter a refund amount greater than zero.");
        return;
      }
    } else if (!Number.isFinite(amount) || amount === 0) {
      setDialogError("Enter a non-zero adjustment amount.");
      return;
    }
    const ok = await invokeAction({
      action: dialog.mode,
      transaction_id: dialog.tx.id,
      amount,
      reason: form.reason,
    });
    if (ok) setDialog(null);
  };

  const confirmPending = async (tx) => {
    setBusy(true);
    try {
      for (const e of (tx.payments || []).filter((p) => p.verification === "pending_verification")) {
        await base44.functions.invoke("pharmacyPaymentManage", {
          action: "confirm",
          transaction_id: tx.id,
          entry_id: e.entry_id,
          pharmacist_id: session.pharmacist_id,
          pharmacist_session_token: session.session_token,
        });
      }
      await loadTxs();
    } catch (err) {
      if (err.response?.status === 401) onSessionExpired?.();
    } finally {
      setBusy(false);
    }
  };

  const openRecordForEvent = (p, ev) => {
    setDialogError("");
    setDialog({
      mode: "record",
      prescription: p,
      event: ev,
      dispensing_datetime: ev.datetime,
      prefill: { amount: ev.payment_amount ?? "", amount_due: ev.payment_amount ?? "" },
    });
  };

  const openRecordForBalance = (tx) => {
    setDialogError("");
    const p = (prescriptions || []).find((x) => x.prescription_id === tx.prescription_ref) || null;
    setDialog({
      mode: "record",
      prescription: p,
      tx,
      event: null,
      dispensing_datetime: tx.dispensing_datetime || "",
      prefill: { amount: tx.outstanding_balance, amount_due: "" },
    });
  };

  const openPrepayment = () => {
    setDialogError("");
    setDialog({ mode: "record", prescription: null, prescriptions: prescriptions || [], event: null, prefill: {} });
  };

  const filters = [
    { key: "all", label: "All" },
    { key: "balance", label: "Outstanding Balance" },
    { key: "pending", label: "Pending Verification" },
    { key: "paid", label: "Settled / Refunded" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground max-w-md">
          Payments are recorded separately from dispensing: a medication may be dispensed while payment is pending,
          and a payment may be taken before dispensing. Non-cash payments must be verified before they count as confirmed.
        </p>
        <button
          type="button"
          onClick={openPrepayment}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
        <Input
          placeholder="Search by patient, CIN, medication, prescription or transaction reference..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 rtl:pl-3 rtl:pr-9"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Amount Due</p>
          <p className="text-lg font-bold mt-0.5">{totalDue}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Amount Paid</p>
          <p className="text-lg font-bold mt-0.5">{totalPaid}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-lg font-bold mt-0.5">{totalBalance}</p>
        </div>
      </div>

      {txs === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t("Loading...")}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          No transactions yet. Fill prescriptions or record a payment to see them here.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => {
            if (r.kind === "event") {
              const ev = r.event;
              const p = r.prescription;
              return (
                <div key={`ev-${p.id}-${ev.datetime}`} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {p.medication_name}{p.strength ? ` ${p.strength}` : ""} · {ev.quantity}
                        {ev.consumed_refill && (
                          <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">Refill</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {p.patient_name} · CIN {p.patient_cin} · {p.prescription_id}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {ev.datetime ? new Date(ev.datetime).toLocaleString() : "—"}
                        {ev.batch_number ? ` · Batch ${ev.batch_number}` : ""} · {ev.pharmacist_name || "—"}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock3 className="w-3.5 h-3.5" /> Not in payment ledger
                      </span>
                      <button
                        type="button"
                        onClick={() => openRecordForEvent(p, ev)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold hover:bg-accent disabled:opacity-50"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Record Payment
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            const tx = r.tx;
            const pendingCount = (tx.payments || []).filter((e) => e.verification === "pending_verification").length;
            const status = STATUS[tx.payment_status] || STATUS.unpaid;
            const isOpen = expanded[tx.id];
            return (
              <div key={tx.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {(tx.items || []).map((it) => `${it.medication_name}${it.strength ? ` ${it.strength}` : ""}`).join(", ") || tx.prescription_ref}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {tx.patient_name} · CIN {tx.patient_cin} · {tx.prescription_ref}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {tx.transaction_id} · {tx.dispensing_datetime ? `Dispensed ${new Date(tx.dispensing_datetime).toLocaleString()}` : "Payment before dispensing"} · {tx.pharmacist_name || "—"}
                    </p>
                    <p className="text-xs mt-1">
                      <span className="font-semibold">Paid {tx.amount_paid ?? 0}</span>
                      <span className="text-muted-foreground"> of {tx.amount_due ?? 0} · Balance {tx.outstanding_balance ?? 0}</span>
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${status.cls}`}>{status.label}</span>
                    {pendingCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">
                        <Clock3 className="w-3 h-3" /> {pendingCount} pending verification
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mt-2.5">
                  <button
                    type="button"
                    onClick={() => generateReceiptPdf(tx)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold hover:bg-accent"
                  >
                    <Download className="w-3.5 h-3.5" /> Receipt
                  </button>
                  {pendingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => confirmPending(tx)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Verify Payment
                    </button>
                  )}
                  {tx.outstanding_balance > 0 && (
                    <button
                      type="button"
                      onClick={() => openRecordForBalance(tx)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold hover:bg-accent disabled:opacity-50"
                    >
                      <Receipt className="w-3.5 h-3.5" /> Add Payment
                    </button>
                  )}
                  {tx.amount_paid > 0 && (
                    <button
                      type="button"
                      onClick={() => { setDialogError(""); setDialog({ mode: "refund", tx }); }}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold hover:bg-accent disabled:opacity-50"
                    >
                      Refund
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setDialogError(""); setDialog({ mode: "adjust", tx }); }}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold hover:bg-accent disabled:opacity-50"
                  >
                    Adjust
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded((s) => ({ ...s, [tx.id]: !s[tx.id] }))}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                  >
                    History {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-2.5 space-y-1.5 border-t border-border pt-2.5">
                    {(tx.payments || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No payment entries recorded yet.</p>
                    ) : (
                      (tx.payments || []).slice().reverse().map((e) => (
                        <div key={e.entry_id} className="flex items-start justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {e.entry_type === "payment" ? "Payment" : e.entry_type === "refund" ? "Refund" : "Adjustment"} · {e.amount}
                              {e.method ? ` · ${METHOD_LABELS[e.method] || e.method}` : ""}
                            </p>
                            <p className="text-muted-foreground truncate">
                              {e.datetime ? new Date(e.datetime).toLocaleString() : "—"} · {e.pharmacist_name || "—"}
                              {e.note ? ` · ${e.note}` : ""}
                            </p>
                          </div>
                          {e.entry_type === "payment" && e.method && (
                            e.verification === "pending_verification" ? (
                              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">
                                <Clock3 className="w-3 h-3" /> Pending verification
                              </span>
                            ) : (
                              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">
                                <ShieldCheck className="w-3 h-3" /> Confirmed
                              </span>
                            )
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PaymentRecordDialog
        dialog={dialog?.mode === "record" ? dialog : null}
        busy={busy}
        error={dialogError}
        onSubmit={submitRecord}
        onClose={() => setDialog(null)}
      />
      <PaymentCorrectionDialog
        dialog={(dialog?.mode === "refund" || dialog?.mode === "adjust") ? dialog : null}
        busy={busy}
        error={dialogError}
        onSubmit={submitCorrection}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}