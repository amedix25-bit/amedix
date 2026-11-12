import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pill, Trash2, ShieldAlert, PackageX, ArchiveX, Tag } from "lucide-react";
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

const URGENCY_OPTIONS = [
  { value: "immediate", label: "Immediate — serious health hazard, stop dispensing now" },
  { value: "urgent", label: "Urgent — significant risk, act quickly" },
  { value: "routine", label: "Routine — minor defect, exchange during normal operations" },
];

const EMPTY = {
  medication_name: "", active_ingredient: "", strength: "", dosage_form: "tablet",
  quantity_in_stock: "", price: "", batch_number: "", expiry_date: "",
};

const formatPrice = (price) =>
  typeof price === "number"
    ? `LYD ${Number.isInteger(price) ? price : price.toFixed(2)}`
    : null;

const RECALL_EMPTY = {
  medication_name: "", active_ingredient: "", strength: "", batch_number: "",
  urgency: "urgent", reason: "", source: "",
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

// The pharmacy's live inventory: add medications with their batch number and
// expiry date, update stock levels, remove items. The daily safety scan
// auto-quarantines expired stock and alerts about batches expiring soon.
// Expired, quarantined and recalled batches are blocked from dispensing and
// never offered to doctors or patients. Pharmacists report supplier recalls
// here — recording a recall quarantines the affected stock and notifies the
// affected patients, prescribers and pharmacies with full audit history.
export default function PharmacyInventorySection({ profile }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recallOpen, setRecallOpen] = useState(false);
  const [recallForm, setRecallForm] = useState(RECALL_EMPTY);
  const [recallSubmitting, setRecallSubmitting] = useState(false);
  const [disposingId, setDisposingId] = useState(null);
  const [priceEdit, setPriceEdit] = useState(null); // { item, price }
  const [savingPrice, setSavingPrice] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const load = async () => {
    try {
      const page = await base44.entities.PharmacyInventory.filter(
        { pharmacy_id: profile.id },
        { sort: "-created_date", limit: 200 }
      );
      setItems(page.items || page);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));
  const setRecall = (f) => (e) => setRecallForm((s) => ({ ...s, [f]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.medication_name.trim()) return setError("Medication name is required.");
    const qty = Number(form.quantity_in_stock);
    if (!Number.isFinite(qty) || qty < 0) return setError("Enter a valid stock quantity.");
    if (form.expiry_date && form.expiry_date < today()) {
      return setError("The expiry date is in the past — expired stock cannot be added. Enter a valid expiry date.");
    }
    setAdding(true);
    try {
      await base44.entities.PharmacyInventory.create({
        pharmacy_id: profile.id,
        pharmacy_user_id: profile.user_id,
        medication_name: form.medication_name.trim(),
        active_ingredient: form.active_ingredient.trim(),
        strength: form.strength.trim(),
        dosage_form: form.dosage_form,
        batch_number: form.batch_number.trim(),
        expiry_date: form.expiry_date || "",
        price: form.price === "" ? undefined : Number(form.price),
        quantity_in_stock: qty,
        updated_datetime: new Date().toISOString(),
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

  const handleRecall = async (e) => {
    e.preventDefault();
    setError("");
    if (!recallForm.medication_name.trim()) return setError("Medication name is required.");
    if (!recallForm.reason.trim()) return setError("The recall reason is required.");
    setRecallSubmitting(true);
    try {
      const res = await base44.functions.invoke("pharmacyRecallManage", {
        action: "create",
        ...recallForm,
        medication_name: recallForm.medication_name.trim(),
        reason: recallForm.reason.trim(),
      });
      const r = res.data || {};
      toast({
        title: "Recall recorded",
        description: `${r.quarantined_items ?? 0} batch(es) quarantined and blocked from dispensing. ${r.affected_prescriptions ?? 0} dispensed prescription(s) traced — patients and prescribers notified.`,
      });
      setRecallForm(RECALL_EMPTY);
      setRecallOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not record the recall.");
    } finally {
      setRecallSubmitting(false);
    }
  };

  const dispose = async (item) => {
    setDisposingId(item.id);
    try {
      await base44.functions.invoke("pharmacyRecallManage", {
        action: "dispose",
        inventory_id: item.id,
      });
      toast({ title: "Stock disposed", description: "The quarantined batch was marked as disposed in the recall history." });
      load();
    } catch (err) {
      toast({ title: "Dispose failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setDisposingId(null);
    }
  };

  const updateStock = async (item, delta) => {
    const next = Math.max(0, (item.quantity_in_stock || 0) + delta);
    try {
      await base44.entities.PharmacyInventory.update(item.id, {
        quantity_in_stock: next,
        updated_datetime: new Date().toISOString(),
      });
      load();
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const remove = async (item) => {
    try {
      await base44.entities.PharmacyInventory.delete(item.id);
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const savePrice = async () => {
    setSavingPrice(true);
    try {
      await base44.entities.PharmacyInventory.update(priceEdit.item.id, {
        price: priceEdit.price === "" ? undefined : Number(priceEdit.price),
        updated_datetime: new Date().toISOString(),
      });
      toast({ title: "Price updated", description: `${priceEdit.item.medication_name} is now shown to patients at the new price.` });
      setPriceEdit(null);
      load();
    } catch (err) {
      toast({ title: "Price update failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Medications in your stock are automatically checked when doctors issue prescriptions and patients search availability.
        </p>
        <div className="flex items-center gap-2">
          <Dialog open={recallOpen} onOpenChange={setRecallOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0 border-red-200 text-red-700 hover:bg-red-50">
                <ShieldAlert className="w-4 h-4" /> Report Recall
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report a Medication Recall</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">
                Recording a recall quarantines the affected stock in your pharmacy, blocks it from dispensing, and notifies
                affected patients and prescribers with full audit history.
              </p>
              {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
              <form onSubmit={handleRecall} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Medication Name *</Label>
                    <MedicationAutocomplete
                      value={recallForm.medication_name}
                      onChange={(name) => setRecallForm((s) => ({ ...s, medication_name: name }))}
                      onSelect={(o) => setRecallForm((s) => ({
                        ...s,
                        medication_name: o.medication_name,
                        active_ingredient: o.active_ingredient || s.active_ingredient,
                        strength: o.strength || s.strength,
                      }))}
                      placeholder="e.g. Panadol"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Active Ingredient</Label>
                    <Input placeholder="e.g. Paracetamol" value={recallForm.active_ingredient} onChange={setRecall("active_ingredient")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Strength</Label>
                    <Input placeholder="e.g. 500 mg" value={recallForm.strength} onChange={setRecall("strength")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Batch Number</Label>
                    <Input placeholder="e.g. B-2026-0417" value={recallForm.batch_number} onChange={setRecall("batch_number")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Urgency *</Label>
                  <select
                    value={recallForm.urgency}
                    onChange={setRecall("urgency")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    {URGENCY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Reason *</Label>
                  <Input placeholder="e.g. contamination detected by the manufacturer" value={recallForm.reason} onChange={setRecall("reason")} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Input placeholder="e.g. manufacturer notice, medicines authority" value={recallForm.source} onChange={setRecall("source")} />
                </div>
                <Button type="submit" variant="destructive" className="w-full" disabled={recallSubmitting}>
                  {recallSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Record Recall & Quarantine Stock
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Batch Number</Label>
                    <Input placeholder="e.g. B-2026-0417" value={form.batch_number} onChange={set("batch_number")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Expiry Date</Label>
                    <Input type="date" min={today()} value={form.expiry_date} onChange={set("expiry_date")} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </div>

      {!items ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          Your inventory is empty. Add medications so doctors and patients can find them.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const badge = expiryBadge(item);
            const quarantined = item.is_quarantined;
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
                    {formatPrice(item.price) ? ` · ${formatPrice(item.price)}` : ""}
                    {quarantined && item.quarantine_reason ? ` · ${item.quarantine_reason}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {quarantined && item.quarantine_action !== "disposed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dispose(item)}
                      disabled={disposingId === item.id}
                      className="gap-1 border-red-200 text-red-700 hover:bg-red-50 text-xs"
                    >
                      {disposingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageX className="w-3.5 h-3.5" />}
                      Dispose
                    </Button>
                  )}
                  {!quarantined && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPriceEdit({ item, price: typeof item.price === "number" ? String(item.price) : "" })}
                        className="w-8 h-8 p-0 text-muted-foreground"
                        title={formatPrice(item.price) || "Set price"}
                      >
                        <Tag className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updateStock(item, -1)} className="w-8 h-8 p-0">−</Button>
                      <span className={`text-sm font-bold w-12 text-center ${item.quantity_in_stock <= 10 ? "text-amber-600" : ""}`}>
                        {item.quantity_in_stock}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => updateStock(item, 1)} className="w-8 h-8 p-0">+</Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(item)} className="w-8 h-8 p-0 text-destructive">
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

      {/* Price edit — patients see this price when comparing pharmacies. */}
      <Dialog open={!!priceEdit} onOpenChange={(open) => { if (!open) setPriceEdit(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price{priceEdit ? ` — ${priceEdit.item.medication_name}` : ""}</DialogTitle>
          </DialogHeader>
          {priceEdit && (
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
                  value={priceEdit.price}
                  onChange={(e) => setPriceEdit((s) => ({ ...s, price: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setPriceEdit(null)} disabled={savingPrice}>Cancel</Button>
                <Button onClick={savePrice} disabled={savingPrice || priceEdit.price === ""} className="gap-1.5">
                  {savingPrice && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Price
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}