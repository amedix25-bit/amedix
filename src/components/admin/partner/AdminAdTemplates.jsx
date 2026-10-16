import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image } from "@/components/ui/image";
import { Loader2, Megaphone, Pencil, Plus, Trash2, Upload } from "lucide-react";

// Administrator-managed advertisement library for one partner type. Ads created
// and activated here are exactly what the laboratories (or pharmacies) see in
// their portal library and choose from — this is the single source of truth.
export default function AdminAdTemplates({ partnerType }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState(null); // null = loading
  const [editing, setEditing] = useState(null); // null | "new" | template object
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", offer: "", services: "", image_url: "" });
  const fileRef = useRef(null);

  const typeLabel = partnerType === "laboratory" ? "Laboratory" : partnerType === "hospital" ? "Hospital" : "Pharmacy";

  const load = useCallback(async () => {
    try {
      const res = await base44.entities.PartnerAdTemplate.filter(
        { partner_type: partnerType },
        { sort: "-created_date", limit: 100 }
      );
      setTemplates(res.items || res);
    } catch (err) {
      console.error(err);
      setTemplates([]);
    }
  }, [partnerType]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setForm({ title: "", description: "", offer: "", services: "", image_url: "" });
    setEditing("new");
  };

  const openEdit = (t) => {
    setForm({
      title: t.title || "",
      description: t.description || "",
      offer: t.offer || "",
      services: (t.services || []).join(", "),
      image_url: t.image_url || "",
    });
    setEditing(t);
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file }); // stored publicly — partners and patients view the ad
      setForm((f) => ({ ...f, image_url: res.file_url }));
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "A title is required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const base = {
        partner_type: partnerType,
        title: form.title.trim(),
        description: form.description.trim(),
        offer: form.offer.trim(),
        services: form.services.split(",").map((s) => s.trim()).filter(Boolean),
        image_url: form.image_url,
        updated_datetime: new Date().toISOString(),
      };
      if (editing === "new") {
        await base44.entities.PartnerAdTemplate.create({
          ...base,
          template_id: `PAT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          is_active: true,
          created_datetime: new Date().toISOString(),
        });
        toast({ title: "Advertisement added to the library" });
      } else {
        await base44.entities.PartnerAdTemplate.update(editing.id, base);
        toast({ title: "Advertisement updated" });
      }
      setEditing(null);
      await load();
    } catch (err) {
      toast({ title: "Something went wrong", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (t) => {
    try {
      await base44.entities.PartnerAdTemplate.update(t.id, {
        is_active: !t.is_active,
        updated_datetime: new Date().toISOString(),
      });
      await load();
    } catch (err) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete the advertisement "${t.title}" from the library?`)) return;
    try {
      await base44.entities.PartnerAdTemplate.delete(t.id);
      await load();
    } catch (err) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    }
  };

  if (templates === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" /> Ad Library — {typeLabel}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Advertisements you create here appear in the {typeLabel.toLowerCase()} portal, where organizations view the image, title, description and offer and choose the one they want to use. Deactivating an ad hides it there automatically.
          </p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4" /> New advertisement</Button>
      </div>

      {editing && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="font-semibold text-sm">{editing === "new" ? "New advertisement" : `Edit: ${editing.title}`}</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120}
              placeholder="e.g. Comprehensive health checkup package" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Offer (optional)</Label>
            <Input value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} maxLength={200}
              placeholder="e.g. 20% off home sample collection" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Image</Label>
            {form.image_url && <Image src={form.image_url} fittingType="fill" className="w-full h-28 rounded-lg border border-border" alt="Advertisement" />}
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {form.image_url ? "Replace image" : "Upload image"}
              </Button>
              {form.image_url && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, image_url: "" })}>Remove</Button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Services (comma separated)</Label>
            <Input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })}
              placeholder="e.g. Home sample collection, Full blood panel" />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy || uploading}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing === "new" ? "Create advertisement" : "Save changes"}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No advertisements in this library yet. Create the first one — it will appear in the {typeLabel.toLowerCase()} portal immediately.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {t.image_url && <Image src={t.image_url} fittingType="fill" className="w-full h-32" alt={t.title} />}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{t.title}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {t.offer && <p className="text-xs text-amber-600 font-medium">{t.offer}</p>}
                {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                <div className="flex gap-1 flex-wrap pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /> Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(t)}>
                    {t.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(t)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}