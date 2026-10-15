import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image } from "@/components/ui/image";
import { Loader2, Upload } from "lucide-react";

// Advertisement content editor for an approved partner — description, cover
// image, services, contact number and opening hours. The organization logo
// comes from the existing profile and stays in sync automatically.
export default function PartnerAdForm({ subscription, partnerType, onSaved }) {
  const [description, setDescription] = useState(subscription.ad_description || "");
  const [coverUrl, setCoverUrl] = useState(subscription.ad_cover_url || "");
  const [services, setServices] = useState((subscription.ad_services || []).join(", "));
  const [phone, setPhone] = useState(subscription.ad_contact_phone || "");
  const [hours, setHours] = useState(subscription.ad_hours || "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setCoverUrl(res.file_url);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("partnerSubscriptionManage", {
        action: "update_ad",
        partner_type: partnerType,
        ad_description: description,
        ad_cover_url: coverUrl,
        ad_services: services.split(",").map((s) => s.trim()).filter(Boolean),
        ad_contact_phone: phone,
        ad_hours: hours,
      });
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to save the advertisement.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <p className="font-semibold">Advertisement</p>
      <p className="text-xs text-muted-foreground">
        Shown to patients in your section only. Your name, logo and address come from your profile automatically.
      </p>
      <div className="space-y-1.5">
        <Label className="text-xs">Short description</Label>
        <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Cover image</Label>
        {coverUrl && <Image src={coverUrl} fittingType="fill" className="w-full h-28 rounded-lg border border-border" alt="Cover" />}
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadCover} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {coverUrl ? "Replace cover" : "Upload cover"}
          </Button>
          {coverUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setCoverUrl("")}>Remove</Button>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Available services (comma separated)</Label>
        <Input value={services} onChange={(e) => setServices(e.target.value)} placeholder="e.g. Home sample collection, Chronic medication stock" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Contact number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Opening hours</Label>
          <Input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 9:00 to 22:00 daily" />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button onClick={save} disabled={busy}>
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        Save advertisement
      </Button>
    </div>
  );
}