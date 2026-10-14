import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pill, Trash2, ArchiveX, PackageX, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import MedicationAutocomplete from "@/components/medications/MedicationAutocomplete";

const FORM_OPTIONS = [
  { value: "tablet", label: "Tablet" },
  { value: "capsule", label: "Capsule" },
  { value: "syrup", label: "Syrup" },
  { value: "injection", label: "Injection" },
  { value: "cream", label: "Cream" },
  { value: "drops", label: "Drops" },
  { value: "other", label: "Other" },
];

const EMPTY = {
  medication_name: "", active_ingredient: "", strength: "", dosage_form: "tablet",
  quantity_in_stock: "", batch_number: "", expiry_date: "",
};

const today = () => new Date().toISOString().slice(0, 10);
const horizon = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function expiryBadge(item) {
  if (item.is_quarantined) {
    return { label: `Quarantined${item.quarantine_action === "disposed" ? " · disposed" : ""}`, cls: "bg-red-100 text-red-700 border-red-200" };
  }
  if (item.expiry_date && item.expiry_date < today()) {
    return { label: "Expired", cls: "bg-red-100 text-red-700 border-red-200" };
  }
  if (item.expiry_date && item.expiry_date <= horizon(90)) {
    return { label: `Expires ${item.expiry_date}`, cls: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  return null;
}

// The pharmacist's inventory, saved on the backend through their individual
// session. Every action — adding a medication, adjusting stock, removing an
// item, disposing quarantined stock — is validated server-side and scoped to
// the pharmacist's own pharmacy.
export default function PharmacistInventorySection({ session, onSessionExpired }) {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const load = async () => {
    try {
      const res = await base44.functions.invoke("pharmacistInventoryManage", {
        action: "list",
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      setItems(res.data.items || []);
    } catch (err) {
      if (err.response?.status === 401) {
        onSessionExpired?.();
        return;
      }
      toast({ title: "Could not load inventory", description: err.response?.data?.error || err.message, variant: "destructive" });
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.pharmacist_id]);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setAdding(true);
    try {
      await base44.functions.invoke("pharmacistInventoryManage", {
        action: "create",
        ...form,
        medication_name: form.medication_name.trim(),
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      toast({ title: "Medication added", description: `${form.medication_name.trim()} is now searchable by doctors and patients.` });
      setForm(EMPTY);
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not add the medication.");
    } finally {
      setAdding(false);
    }
  };

  const setStock = async (item, next) => {
    setBusyId(item.id);
    try {
      await base44.functions.invoke("pharmacistInventoryManage", {
        action: "set_stock",
        inventory_id: item.id,
        quantity_in_stock: next,
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      load();
    } catch (err) {
      toast({ title: "Update failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item) => {
    setBusyId(item.id);
    try {
      await base44.functions.invoke("pharmacistInventoryManage", {
        action: "remove",
        inventory_id: item.id,
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      toast({ title: "Medication removed" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const dispose = async (item) => {
    setBusyId(item.id);
    try {
      await base44.functions.invoke("pharmacistInventoryManage", {
        action: "dispose",
        inventory_id: item.id,
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      toast({ title: "Stock disposed", description: "The quarantined batch was marked as disposed." });
      load();
    } catch (err) {
      toast({ title: "Dispose failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = (items || []).filter((item) => {
    const expired = item.expiry_date && item.expiry_date < today();
    if (statusFilter === "quarantined" && !item.is_quarantined) return false;
    if (statusFilter === "expiring" && (item.is_quarantined || !item.expiry_date || expired || item.expiry_date > horizon(90))) return false;
    if (statusFilter === "low" && (item.is_quarantined || (item.quantity_in_stock || 0) > 10)) return false;
    if (!q) return true;
    return (
      (item.medication_name || "").toLowerCase().includes(q) ||
      (item.active_ingredient || "").toLowerCase().includes(q) ||
      (item.batch_number || "").toLowerCase().includes(q)
    );
  });

  const filters = [
    { key: "all", label: "All" },
    { key: "low", label: "Low Stock" },
    { key: "expiring", label: "Expiring Soon" },
    { key: "quarantined", label: "Quarantined" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input
            placeholder="Search by medication, ingredient or batch number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rtl:pl-3 rtl:pr-9"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" /> Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Medication to Inventory</DialogTitle>
            </DialogHeader>
            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Medication Name *</Label>
                <MedicationAutocomplete
                  value={form.medication_name}
                  onChange={(name) => setForm((s) => ({ ...s, medication_name: name }))}
                  onSelect={(o) => setForm((s) => ({
                    ...s,
                    medication_name: o.medication_name,
                    active_ingredient: o.active_ingredient || s.active_ingredient,
                    strength: o.strength || s.strength,
                    dosage_form: o.dosage_form || s.dosage_form,
                  }))}
                  placeholder="e.g. Panadol"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Active Ingredient</Label>
                <Input placeholder="e.g. Paracetamol" value={form.active_ingredient} onChange={set("active_ingredient")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Strength</Label>
                  <Input placeholder="e.g. 500 mg" value={form.strength} onChange={set("strength")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dosage Form</Label>
                  <select
                    value={form.dosage_form}
                    onChange={set("dosage_form")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    {FORM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Batch Number</Label>
                  <Input placeholder="e.g. B-2026-0417" value={form.batch_number} onChange={set("batch_number")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <Input type="date" min={today()} value={form.expiry_date} onChange={set("expiry_date")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Quantity in Stock *</Label>
                <Input type="number" min="0" placeholder="e.g. 100" value={form.quantity_in_stock} onChange={set("quantity_in_stock")} required />
              </div>
              <Button type="submit" className="w-full" disabled={adding}>
                {adding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add to Inventory
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!items ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          {items.length === 0
            ? "Your inventory is empty. Add medications so doctors and patients can find them."
            : "No medications match this search or filter."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const badge = expiryBadge(item);
            const quarantined = item.is_quarantined;
            const busy = busyId === item.id;
            return (
              <div key={item.id} className={`flex items-center gap-3 rounded-xl border p-3 ${quarantined ? "border-red-300 bg-red-50" : "border-border bg-card"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${quarantined ? "bg-red-100" : "bg-primary/10"}`}>
                  {quarantined ? <ArchiveX className="w-4 h-4 text-red-700" /> : <Pill className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">
                      {item.medication_name}
                      {item.strength ? ` ${item.strength}` : ""}
                    </p>
                    {badge && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badge.cls}`}>{badge.label}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.active_ingredient || "—"} · {item.dosage_form || "—"}
                    {item.batch_number ? ` · Batch ${item.batch_number}` : ""}
                    {item.expiry_date ? ` · Expires ${item.expiry_date}` : ""}
                    {quarantined && item.quarantine_reason ? ` · ${item.quarantine_reason}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {quarantined && item.quarantine_action !== "disposed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dispose(item)}
                      disabled={busy}
                      className="gap-1 border-red-200 text-red-700 hover:bg-red-50 text-xs"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageX className="w-3.5 h-3.5" />}
                      Dispose
                    </Button>
                  )}
                  {!quarantined && (
                    <>
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => setStock(item, Math.max(0, (item.quantity_in_stock || 0) - 1))} className="w-8 h-8 p-0">−</Button>
                      <span className={`text-sm font-bold w-12 text-center ${item.quantity_in_stock <= 10 ? "text-amber-600" : ""}`}>
                        {item.quantity_in_stock}
                      </span>
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => setStock(item, (item.quantity_in_stock || 0) + 1)} className="w-8 h-8 p-0">+</Button>
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => remove(item)} className="w-8 h-8 p-0 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}