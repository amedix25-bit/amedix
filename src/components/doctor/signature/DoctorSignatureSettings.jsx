import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SignaturePad from "@/components/doctor/signature/SignaturePad";
import {
  loadMySignature, saveMySignature, removeMySignature, signaturePreviewUrl, validateSignatureFile,
} from "@/lib/doctorSignature";
import { Loader2, PenLine, ShieldCheck, Trash2, Upload } from "lucide-react";

// Doctor Portal → Settings → My Professional Signature. One active signature
// per doctor, stored privately; drawn on the pad or uploaded as PNG/JPG.
export default function DoctorSignatureSettings({ profile, user }) {
  const [record, setRecord] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // "draw" | "upload"
  const [drawn, setDrawn] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const actorName = profile?.full_name || user?.full_name || user?.email || "";

  const load = async () => {
    setLoading(true);
    try {
      const rec = await loadMySignature();
      setRecord(rec);
      setPreview(rec?.signature_file_uri ? await signaturePreviewUrl(rec.signature_file_uri) : "");
    } catch (e) {
      console.error(e);
      setError("Your professional signature could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setError("");
    if (file) {
      const invalid = validateSignatureFile(file);
      if (invalid) { setError(invalid); return; }
    } else if (!drawn) {
      setError("Draw your signature or choose an image first.");
      return;
    }
    setSaving(true);
    try {
      await saveMySignature({
        doctorProfile: profile,
        existing: record,
        dataUrl: drawn || undefined,
        file: file || undefined,
        source: file ? "uploaded" : "drawn",
      });
      setMode(null);
      setDrawn(null);
      setFile(null);
      await load();
    } catch (e) {
      console.error(e);
      setError(e.message || "The signature could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await removeMySignature(record, actorName);
      setConfirmDelete(false);
      setPreview("");
      await load();
    } catch (e) {
      console.error(e);
      setError("The signature could not be deleted.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your signature...
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {record && !mode && (
        <>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <img
              src={preview}
              alt="Your saved professional signature"
              className="h-20 w-full object-contain"
            />
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Version {record.version} · {record.source === "uploaded" ? "Uploaded image" : "Drawn signature"}
            {record.updated_datetime ? ` · updated ${new Date(record.updated_datetime).toLocaleString()}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Stored privately and applied only when you explicitly sign a laboratory request.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode("draw")}>
              <PenLine className="mr-1.5 h-3.5 w-3.5" /> Replace — draw
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMode("upload")}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Replace — upload
            </Button>
            {!confirmDelete ? (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            ) : (
              <>
                <Button variant="destructive" size="sm" onClick={remove} disabled={saving}>
                  {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null} Confirm delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Keep it</Button>
              </>
            )}
          </div>
        </>
      )}

      {!record && !mode && (
        <>
          <p className="text-sm text-muted-foreground">
            You have not created a professional signature yet. Every laboratory request must be signed before it is issued.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setMode("draw")}>
              <PenLine className="mr-1.5 h-3.5 w-3.5" /> Draw my signature
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMode("upload")}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload an image
            </Button>
          </div>
        </>
      )}

      {mode === "draw" && (
        <>
          <SignaturePad onChange={setDrawn} />
          <SaveRow saving={saving} onCancel={() => { setMode(null); setDrawn(null); }} onSave={save} />
        </>
      )}

      {mode === "upload" && (
        <>
          <Input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-muted-foreground">PNG or JPG, 1 MB maximum. A clear image of your signature on a plain background works best.</p>
          {file && (
            <img src={URL.createObjectURL(file)} alt="Signature to upload" className="h-20 w-full rounded-lg border border-border object-contain" />
          )}
          <SaveRow saving={saving} onCancel={() => { setMode(null); setFile(null); }} onSave={save} />
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function SaveRow({ saving, onSave, onCancel }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={onSave} disabled={saving}>
        {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
        Save signature
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
    </div>
  );
}