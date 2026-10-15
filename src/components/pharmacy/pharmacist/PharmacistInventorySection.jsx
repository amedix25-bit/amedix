import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pill, Trash2, ArchiveX, PackageX, Search, History, PencilLine, Tag } from "lucide-react";
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

const MOVEMENT_LABELS = {
  receipt: "Receipt",
  adjustment: "Adjustment",
  dispensing: "Dispensed",
  reservation: "Reserved",
  reservation_release: "Reservation Released",
  quarantine: "Quarantined",
  disposal: "Disposed",
  removal: "Removed",
};

const MOVEMENT_BADGES = {
  receipt: "bg-emerald-50 text-emerald-700 border-emerald-200",
  adjustment: "bg-amber-50 text-amber-700 border-amber-200",
  dispensing: "bg-sky-50 text-sky-700 border-sky-200",
  reservation: "bg-violet-50 text-violet-700 border-violet-200",
  reservation_release: "bg-violet-50 text-violet-700 border-violet-200",
  quarantine: "bg-red-50 text-red-700 border-red-200",
  disposal: "bg-red-50 text-red-700 border-red-200",
  removal: "bg-muted text-muted-foreground border-border",
};

const EMPTY = {
  medication_name: "", active_ingredient: "", strength: "", dosage_form: "tablet",
  quantity_in_stock: "", price: "", batch_number: "", expiry_date: "", supplier: "",
};

const formatPrice = (price) =>
  typeof price === "number"
    ? `LYD ${Number.isInteger(price) ? price : price.toFixed(2)}`
    : null;

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
// session. Every action — receipts, adjustments, removals, disposals — is
// validated server-side, requires a reason where one is due, and is recorded
// in the pharmacy's permanent inventory movement history.
export default function PharmacistInventorySection({ session, onSessionExpired }) {
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(EMPTY);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [adjust, setAdjust] = useState(null); // { item, qty, reason }
  const [pricing, setPricing] = useState(null); // { item, price }
  const [removing, setRemoving] = useState(null); // { item, reason }
  const [history, setHistory] = useState(null); // { loading, movements }
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

  const confirmPrice = async () => {
    setBusyId(pricing.item.id);
    try {
      await base44.functions.invoke("pharmacistInventoryManage", {
        action: "set_price",
        inventory_id: pricing.item.id,
        price: pricing.price === "" ? undefined : Number(pricing.price),
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      toast({ title: "Price updated", description: `${pricing.item.medication_name} is now shown to patients at the new price.` });
      setPricing(null);
      load();
    } catch (err) {
      toast({ title: "Price update failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const confirmAdjust = async () => {
    setBusyId(adjust.item.id);
    try {
      await base44.functions.invoke("pharmacistInventoryManage", {
        action: "set_stock",
        inventory_id: adjust.item.id,
        quantity_in_stock: Number(adjust.qty),
        reason: adjust.reason.trim(),
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      setAdjust(null);
      load();
    } catch (err) {
      toast({ title: "Adjustment failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = async () => {
    setBusyId(removing.item.id);
    try {
      await base44.functions.invoke("pharmacistInventoryManage", {
        action: "remove",
        inventory_id: removing.item.id,
        reason: removing.reason.trim(),
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      toast({ title: "Medication removed", description: "The removal was recorded in the movement history." });
      setRemoving(null);
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
      toast({ title: "Stock disposed", description: "The quarantined batch was marked as disposed and recorded in the movement history." });
      load();
    } catch (err) {
      toast({ title: "Dispose failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const openHistory = async (item) => {
    setHistory({ loading: true, movements: [] });
    try {
      const res = await base44.functions.invoke("pharmacistInventoryManage", {
        action: "movements",
        inventory_id: item.id,
        pharmacist_id: session.pharmacist_id,
        pharmacist_session_token: session.session_token,
      });
      setHistory({ loading: false, movements: res.data.movements || [] });
    } catch (err) {
      setHistory(null);
      toast({ title: "Could not load movement history", description: err.response?.data?.error || err.message, variant: "destructive" });
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
                <Label>Supplier</Label>
                <Input placeholder="e.g. National Medical Supply" value={form.supplier} onChange={set("supplier")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity in Stock *</Label>
                  <Input type="number" min="0" placeholder="e.g. 100" value={form.quantity_in_stock} onChange={set("quantity_in_stock")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Price (LYD)</Label>
                  <Input type="number" min="0" step="0.01" placeholder="e.g. 12.50" value={form.price} onChange={set("price")} />
                </div>
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
            const low = !quarantined && (item.quantity_in_stock || 0) <= 10;
            return (
              <div key={item.id} className={`rounded-xl border p-3 ${quarantined ? "border-red-300 bg-red-50" : "border-border bg-card"}`}>
                <div className="flex items-center gap-3">
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
                      {low && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-amber-100 text-amber-700 border-amber-200">Low Stock</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.active_ingredient || "—"} · {item.dosage_form || "—"}
                      {item.batch_number ? ` · Batch ${item.batch_number}` : ""}
                      {item.expiry_date ? ` · Expires ${item.expiry_date}` : ""}
                      {item.supplier ? ` · Supplier: ${item.supplier}` : ""}
                      {formatPrice(item.price) ? ` · ${formatPrice(item.price)}` : ""}
                      {quarantined && item.quarantine_reason ? ` · ${item.quarantine_reason}` : ""}
                    </p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${low ? "text-amber-600" : ""}`}>
                    {item.quantity_in_stock}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {quarantined && item.quarantine_action !== "disposed" ? (
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
                  ) : (
                    !quarantined && (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => setAdjust({ item, qty: String(item.quantity_in_stock ?? 0), reason: "" })} className="gap-1 text-xs">
                        <PencilLine className="w-3.5 h-3.5" /> Adjust Stock
                      </Button>
                    )
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy || quarantined}
                    onClick={() => setPricing({ item, price: typeof item.price === "number" ? String(item.price) : "" })}
                    className="gap-1 text-xs text-muted-foreground"
                  >
                    <Tag className="w-3.5 h-3.5" /> {formatPrice(item.price) || "Set Price"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openHistory(item)} className="gap-1 text-xs text-muted-foreground">
                    <History className="w-3.5 h-3.5" /> History
                  </Button>
                  {!quarantined && (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => setRemoving({ item, reason: "" })} className="gap-1 text-xs text-destructive ml-auto">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock adjustment — the reason is required and kept in the movement
          history with the timestamp and the responsible user. */}
      <Dialog open={!!adjust} onOpenChange={(open) => { if (!open) setAdjust(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock{adjust ? ` — ${adjust.item.medication_name}` : ""}</DialogTitle>
          </DialogHeader>
          {adjust && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Current stock: <span className="font-semibold">{adjust.item.quantity_in_stock}</span>. Dispensing deductions are recorded automatically — use this for manual corrections.
              </p>
              <div className="space-y-1.5">
                <Label>New Quantity *</Label>
                <Input
                  type="number"
                  min="0"
                  value={adjust.qty}
                  onChange={(e) => setAdjust((s) => ({ ...s, qty: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reason *</Label>
                <Input
                  placeholder="e.g. Stock count correction, damaged units, supplier delivery"
                  value={adjust.reason}
                  onChange={(e) => setAdjust((s) => ({ ...s, reason: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAdjust(null)} disabled={busyId === adjust?.item?.id}>Cancel</Button>
                <Button onClick={confirmAdjust} disabled={busyId === adjust?.item?.id || !adjust.qty || !adjust.reason.trim()} className="gap-1.5">
                  {busyId === adjust?.item?.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Adjustment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Price edit — shown to patients when they compare pharmacies. */}
      <Dialog open={!!pricing} onOpenChange={(open) => { if (!open) setPricing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price{pricing ? ` — ${pricing.item.medication_name}` : ""}</DialogTitle>
          </DialogHeader>
          {pricing && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Price per unit, in LYD. This is the price patients see when they compare pharmacies and authorize a prescription. Leave empty to show no price.
              </p>
              <div className="space-y-1.5">
                <Label>Price (LYD)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 12.50"
                  value={pricing.price}
                  onChange={(e) => setPricing((s) => ({ ...s, price: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setPricing(null)} disabled={busyId === pricing?.item?.id}>Cancel</Button>
                <Button onClick={confirmPrice} disabled={busyId === pricing?.item?.id || pricing.price === ""} className="gap-1.5">
                  {busyId === pricing?.item?.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Price
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Removal — also requires a reason, recorded in the movement history. */}
      <Dialog open={!!removing} onOpenChange={(open) => { if (!open) setRemoving(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Medication{removing ? ` — ${removing.item.medication_name}` : ""}</DialogTitle>
          </DialogHeader>
          {removing && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                This removes {removing.item.medication_name} from your inventory list. The removal is kept permanently in the movement history.
              </p>
              <div className="space-y-1.5">
                <Label>Reason *</Label>
                <Input
                  placeholder="e.g. Discontinued product, entry created in error"
                  value={removing.reason}
                  onChange={(e) => setRemoving((s) => ({ ...s, reason: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setRemoving(null)} disabled={busyId === removing?.item?.id}>Cancel</Button>
                <Button variant="destructive" onClick={confirmRemove} disabled={busyId === removing?.item?.id || !removing.reason.trim()} className="gap-1.5">
                  {busyId === removing?.item?.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Remove Medication
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Movement history — every stock change for this item, permanently. */}
      <Dialog open={!!history} onOpenChange={(open) => { if (!open) setHistory(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movement History</DialogTitle>
          </DialogHeader>
          {history && (
            history.loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
              </div>
            ) : history.movements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No movements recorded yet for this item.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {history.movements.map((mv) => (
                  <div key={mv.id} className="rounded-lg border border-border p-2.5 text-xs space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${MOVEMENT_BADGES[mv.movement_type] || "border-border"}`}>
                        {MOVEMENT_LABELS[mv.movement_type] || mv.movement_type}
                      </span>
                      {typeof mv.quantity_change === "number" && mv.quantity_change !== 0 && (
                        <span className={`font-semibold ${mv.quantity_change > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {mv.quantity_change > 0 ? `+${mv.quantity_change}` : mv.quantity_change}
                        </span>
                      )}
                      {typeof mv.quantity_before === "number" && typeof mv.quantity_after === "number" && (
                        <span className="text-muted-foreground">{mv.quantity_before} → {mv.quantity_after}</span>
                      )}
                      <span className="text-muted-foreground ml-auto">{new Date(mv.datetime).toLocaleString()}</span>
                    </div>
                    <p className="text-muted-foreground">{mv.reason}</p>
                    <p className="text-muted-foreground">
                      By {mv.performed_by_name || "—"}{mv.performed_by_role ? ` (${mv.performed_by_role})` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}