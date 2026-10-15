import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image } from "@/components/ui/image";
import { Loader2, Upload, SendHorizonal, Undo2, Clock, CheckCircle2, XCircle, FileEdit } from "lucide-react";

const AD_STATUS = {
  draft: { label: "Draft", style: "bg-muted text-muted-foreground" },
  pending_review: { label: "Pending review", style: "bg-blue-100 text-blue-700" },
  approved: { label: "Approved", style: "bg-emerald-100 text-emerald-700" },
  scheduled: { label: "Scheduled", style: "bg-indigo-100 text-indigo-700" },
  published: { label: "Published", style: "bg-emerald-100 text-emerald-700" },
  paused: { label: "Paused", style: "bg-amber-100 text-amber-700" },
  rejected: { label: "Rejected", style: "bg-red-100 text-red-700" },
  expired: { label: "Expired", style: "bg-muted text-muted-foreground" },
};

// Advertisement editor for the partner's own organization. Partners can edit
// and submit for review, but never approve their own advertisement. Editing an
// approved, scheduled, published or paused advertisement sends it back for
// renewed administrator approval; editing a rejected one returns it to draft.
export default function PartnerAdForm({ subscription, advertisement, partnerType, onSaved }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(advertisement?.title || "");
  const [description, setDescription] = useState(advertisement?.description || "");
  const [coverUrl, setCoverUrl] = useState(advertisement?.cover_url || "");
  const [services, setServices] = useState((advertisement?.services || []).join(", "));
  const [phone, setPhone] = useState(advertisement?.contact_phone || "");
  const [hours, setHours] = useState(advertisement?.hours || "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const status = advertisement?.status || "draft";
  const canEdit = status !== "expired" && subscription.status !== "cancelled";
  const canSubmit = ["draft", "rejected"].includes(status);

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file }); // stored publicly — patients view the ad
      setCoverUrl(res.file_url);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const call = async (payload, successMsg) => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("partnerSubscriptionManage", {
        partner_type: partnerType, ...payload,
      });
      if (successMsg) toast({ title: successMsg });
      await onSaved?.();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Something went wrong.";
      setError(msg);
      toast({ title: "Something went wrong", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const save = () => call(
    {
      action: "update_ad", ad_id: advertisement?.id,
      title, description, cover_url: coverUrl,
      services: services.split(",").map((s) => s.trim()).filter(Boolean),
      contact_phone: phone, hours,
    },
    "Advertisement saved"
  );

  const submit = () => call({ action: "submit_ad" }, "Submitted for administrator review");
  const withdraw = () => call({ action: "withdraw_ad" }, "Returned to draft");

  const statusBadge = AD_STATUS[status] || AD_STATUS.draft;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="font-semibold flex items-center gap-2"><FileEdit className="w-4 h-4 text-primary" /> Advertisement</p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge.style}`}>
          {statusBadge.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Shown to patients in your section only. Your name, logo and address come from your profile automatically. Only the AMedix administrator can approve and publish it.
      </p>

      {status === "rejected" && advertisement?.rejection_reason && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">Rejected: {advertisement.rejection_reason}</p>
        </div>
      )}
      {status === "pending_review" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2">
          <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">Awaiting administrator content review.</p>
        </div>
      )}
      {status === "published" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800">Live in the Patient Portal. Saving a content change sends it back for renewed approval.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} disabled={!canEdit}
          placeholder="e.g. Home delivery for chronic medications" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} disabled={!canEdit} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Cover image</Label>
        {coverUrl && <Image src={coverUrl} fittingType="fill" className="w-full h-28 rounded-lg border border-border" alt="Cover" />}
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadCover} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading || !canEdit}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {coverUrl ? "Replace cover" : "Upload cover"}
          </Button>
          {coverUrl && canEdit && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setCoverUrl("")}>Remove</Button>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Available services (comma separated)</Label>
        <Input value={services} onChange={(e) => setServices(e.target.value)} disabled={!canEdit}
          placeholder="e.g. Home sample collection, Chronic medication stock" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Contact number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canEdit} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Opening hours</Label>
          <Input value={hours} onChange={(e) => setHours(e.target.value)} disabled={!canEdit} placeholder="e.g. 9:00 to 22:00 daily" />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {canEdit && (
        <div className="flex gap-2 flex-wrap">
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </Button>
          {canSubmit && (
            <Button variant="outline" onClick={submit} disabled={busy || !title.trim() || !description.trim()}>
              <SendHorizonal className="w-4 h-4" /> Submit for review
            </Button>
          )}
          {status === "pending_review" && (
            <Button variant="ghost" onClick={withdraw} disabled={busy}>
              <Undo2 className="w-4 h-4" /> Withdraw to draft
            </Button>
          )}
        </div>
      )}
      {canSubmit && (!title.trim() || !description.trim()) && (
        <p className="text-xs text-muted-foreground">A title and description are required before submitting for review.</p>
      )}
    </div>
  );
}