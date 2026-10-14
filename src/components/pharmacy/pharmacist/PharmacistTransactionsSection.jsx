import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Receipt, Search } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// Payments and Transactions — every dispensing transaction recorded for this
// pharmacy, including the payment captured at the counter when one was
// recorded. Read-only: transactions are the permanent record saved on the
// prescription by the backend at dispensing time.
export default function PharmacistTransactionsSection({ prescriptions }) {
  const { t } = useAppLanguage();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const transactions = useMemo(() => {
    const out = [];
    for (const p of prescriptions) {
      for (const ev of p.dispensing_events || []) {
        out.push({
          key: `${p.id}-${ev.datetime}-${ev.quantity}`,
          datetime: ev.datetime,
          medication: `${p.medication_name}${p.strength ? ` ${p.strength}` : ""}`,
          patient_name: p.patient_name || "",
          patient_cin: p.patient_cin || "",
          prescription_ref: p.prescription_id || "",
          quantity: ev.quantity,
          quantity_number: ev.quantity_number || 0,
          batch_number: ev.batch_number || "",
          pharmacist_name: ev.pharmacist_name || "",
          pharmacy_name: ev.pharmacy_name || "",
          consumed_refill: !!ev.consumed_refill,
          payment_amount: typeof ev.payment_amount === "number" ? ev.payment_amount : null,
          payment_method: ev.payment_method || "",
        });
      }
    }
    out.sort((a, b) => String(b.datetime).localeCompare(String(a.datetime)));
    return out;
  }, [prescriptions]);

  const q = query.trim().toLowerCase();
  const filtered = transactions.filter((tr) => {
    if (filter === "paid" && tr.payment_amount === null) return false;
    if (filter === "unpaid" && tr.payment_amount !== null) return false;
    if (!q) return true;
    return (
      tr.patient_name.toLowerCase().includes(q) ||
      tr.patient_cin.toLowerCase().includes(q) ||
      tr.medication.toLowerCase().includes(q) ||
      tr.prescription_ref.toLowerCase().includes(q) ||
      tr.batch_number.toLowerCase().includes(q)
    );
  });

  const totalUnits = filtered.reduce((sum, tr) => sum + (tr.quantity_number || 0), 0);
  const totalCollected = filtered.reduce((sum, tr) => sum + (tr.payment_amount || 0), 0);

  const filters = [
    { key: "all", label: "All Transactions" },
    { key: "paid", label: "With Payment" },
    { key: "unpaid", label: "No Payment Recorded" },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
        <Input
          placeholder="Search by patient, CIN, medication, prescription reference or batch..."
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
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-lg font-bold mt-0.5">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Units Dispensed</p>
          <p className="text-lg font-bold mt-0.5">{totalUnits}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Payments Recorded</p>
          <p className="text-lg font-bold mt-0.5">{totalCollected}</p>
        </div>
      </div>

      {prescriptions === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t("Loading...")}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          No dispensing transactions yet. Fill prescriptions to record transactions here.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((tr) => (
            <div key={tr.key} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {tr.medication} · {tr.quantity}
                    {tr.consumed_refill && (
                      <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">Refill</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {tr.patient_name} · CIN {tr.patient_cin} · {tr.prescription_ref}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {tr.datetime ? new Date(tr.datetime).toLocaleString() : "—"}
                    {tr.batch_number ? ` · Batch ${tr.batch_number}` : ""} · {tr.pharmacist_name || "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {tr.payment_amount !== null ? (
                    <span className="inline-flex flex-col items-end">
                      <span className="text-sm font-bold">{tr.payment_amount}</span>
                      <span className="text-[10px] text-muted-foreground">{tr.payment_method}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No payment recorded</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Receipt className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        A dispensed medication is a supply record only — it is never treated as proof that the patient has taken a dose.
      </p>
    </div>
  );
}