import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pill, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const FORM_OPTIONS = [
  { value: "tablet", label: "Tablet" },
  { value: "capsule", label: "Capsule" },
  { value: "syrup", label: "Syrup" },
  { value: "injection", label: "Injection" },
  { value: "cream", label: "Cream" },
  { value: "drops", label: "Drops" },
  { value: "other", label: "Other" },
];

const EMPTY = { medication_name: "", active_ingredient: "", strength: "", dosage_form: "tablet", quantity_in_stock: "" };

// The pharmacy's live inventory: add medications, update stock levels, remove
// items. Stock automatically decreases when prescriptions are reserved or
// dispensed here.
export default function PharmacyInventorySection({ profile }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.medication_name.trim()) return setError("Medication name is required.");
    const qty = Number(form.quantity_in_stock);
    if (!Number.isFinite(qty) || qty < 0) return setError("Enter a valid stock quantity.");
    setAdding(true);
    try {
      await base44.entities.PharmacyInventory.create({
        pharmacy_id: profile.id,
        pharmacy_user_id: profile.user_id,
        medication_name: form.medication_name.trim(),
        active_ingredient: form.active_ingredient.trim(),
        strength: form.strength.trim(),
        dosage_form: form.dosage_form,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Medications in your stock are automatically checked when doctors issue prescriptions and patients search availability.
        </p>
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
                <Input placeholder="e.g. Panadol" value={form.medication_name} onChange={set("medication_name")} required />
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
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Pill className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {item.medication_name}
                  {item.strength ? ` ${item.strength}` : ""}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.active_ingredient || "—"} · {item.dosage_form || "—"}
                  {item.updated_datetime ? ` · Updated ${new Date(item.updated_datetime).toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="outline" size="sm" onClick={() => updateStock(item, -1)} className="w-8 h-8 p-0">−</Button>
                <span className={`text-sm font-bold w-12 text-center ${item.quantity_in_stock <= 10 ? "text-amber-600" : ""}`}>
                  {item.quantity_in_stock}
                </span>
                <Button variant="outline" size="sm" onClick={() => updateStock(item, 1)} className="w-8 h-8 p-0">+</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(item)} className="w-8 h-8 p-0 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}