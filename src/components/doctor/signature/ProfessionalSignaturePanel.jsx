import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import SignaturePad from "@/components/doctor/signature/SignaturePad";
import {
  blobToDataUrl, loadMySignature, saveMySignature, signatureImageDataUrl, signaturePreviewUrl, validateSignatureFile,
} from "@/lib/doctorSignature";
import { CheckCircle2, Loader2, PenLine, ShieldCheck, Upload, XCircle } from "lucide-react";

// Mandatory professional signature for a clinical document. Nothing is issued
// until the responsible doctor explicitly applies their signature here: either
// their saved signature after confirming, or one drawn/uploaded now.
// `subject` names the document being signed, e.g. "imaging request".
export default function ProfessionalSignaturePanel({ doctorProfile, value, onChange, subject = "request" }) {
  const [saved, setSaved] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // "saved" | "draw" | "upload"
  const [drawn, setDrawn] = useState(null);
  const [file, setFile] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const rec = await loadMySignature();
        setSaved(rec);
        if (rec?.signature_file_uri) setPreview(await signaturePreviewUrl(rec.signature_file_uri));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const reset = () => {
    setMode(null);
    setDrawn(null);
    setFile(null);
    setConfirmed(false);
    setError("");
  };

  const applySaved = async () => {
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      const img = await signatureImageDataUrl(saved.signature_file_uri);
      onChange({
        signed: true,
        signature_record_id: saved.id,
        signature_version: saved.version || 1,
        source: "saved_profile",
        image_data_url: img.data_url,
        image_format: img.format,
        image_preview: preview,
        signed_at: new Date().toISOString(),
        signed_by_name: doctorProfile?.full_name || saved.doctor_name || "",
      });
      reset();
    } catch (e) {
      console.error(e);
      setError(e.message || "The saved signature could not be applied.");
    } finally {
      setBusy(false);
    }
  };

  const applyNew = async () => {
    if (!confirmed) return;
    setBusy(true);
    setError("");
    try {
      const uploaded = file || null;
      if (uploaded) {
        const invalid = validateSignatureFile(uploaded);
        if (invalid) throw new Error(invalid);
      } else if (!drawn) {
        throw new Error("Draw your signature or choose an image first.");
      }
      // Saved to the doctor's own profile first, so this document is signed with
      // a real, versioned signature record the server can verify.
      const rec = await saveMySignature({
        doctorProfile,
        existing: saved,
        dataUrl: drawn || undefined,
        file: uploaded || undefined,
        source: uploaded ? "uploaded" : "drawn",
      });
      const image = uploaded
        ? { data_url: await blobToDataUrl(uploaded), format: uploaded.type === "image/jpeg" ? "JPEG" : "PNG" }
        : { data_url: drawn, format: "PNG" };
      onChange({
        signed: true,
        signature_record_id: rec.id,
        signature_version: rec.version || 1,
        source: uploaded ? "uploaded_now" : "drawn_now",
        image_data_url: image.data_url,
        image_format: image.format,
        image_preview: image.data_url,
        signed_at: new Date().toISOString(),
        signed_by_name: doctorProfile?.full_name || "",
      });
      setSaved(rec);
      setPreview(image.data_url);
      reset();
    } catch (e) {
      console.error(e);
      setError(e.message || "The signature could not be applied.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <PenLine className="mt-0.5 h-4 w-4 text-primary" />
        <div>
          <h4 className="font-heading text-sm font-semibold">Professional signature — required</h4>
          <p className="text-xs text-muted-foreground">
            This {subject} cannot be issued until you sign it. The signature, your name, licence and the signing time are recorded on the document.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your signature...
        </p>
      ) : value?.signed ? (
        <div className="rounded-lg border border-success/40 bg-success/5 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" /> Signed by {value.signed_by_name || doctorProfile?.full_name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Signature v{value.signature_version} · {new Date(value.signed_at).toLocaleString()} ·{" "}
            {value.source === "saved_profile" ? "saved professional signature" : value.source === "uploaded_now" ? "uploaded signature" : "drawn signature"}
          </p>
          {value.image_preview && (
            <img src={value.image_preview} alt="Applied signature" className="mt-2 h-14 w-full object-contain" />
          )}
          <Button type="button" variant="ghost" size="sm" className="mt-2 text-destructive" onClick={() => onChange({ signed: false })}>
            <XCircle className="mr-1.5 h-3.5 w-3.5" /> Remove this signature
          </Button>
        </div>
      ) : (
        <>
          {saved ? (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">My saved professional signature</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Version {saved.version} · saved to your profile</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => { setMode(mode === "saved" ? null : "saved"); setConfirmed(false); }}>
                  Use my saved signature
                </Button>
              </div>
              {preview && <img src={preview} alt="My saved signature" className="mt-2 h-16 w-full object-contain" />}
              {mode === "saved" && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    By signing you confirm that this is your professional signature and that you approve everything above.
                  </p>
                  <label className="flex items-start gap-2 text-xs">
                    <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(Boolean(v))} className="mt-0.5" />
                    <span>I confirm this signature is mine and I approve this {subject}.</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={applySaved} disabled={!confirmed || busy}>
                      {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Sign now
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              You have no saved professional signature yet. Create one now — it is saved to your profile and used to sign this {subject}.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={saved ? "outline" : "default"} onClick={() => { setMode(mode === "draw" ? null : "draw"); setConfirmed(false); setDrawn(null); }}>
              <PenLine className="mr-1.5 h-3.5 w-3.5" /> Sign now — draw
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setMode(mode === "upload" ? null : "upload"); setConfirmed(false); setFile(null); }}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Sign now — upload image
            </Button>
          </div>

          {mode === "draw" && (
            <div className="space-y-2">
              <SignaturePad onChange={(d) => { setDrawn(d); setConfirmed(false); }} />
              <ConfirmAndApply
                confirmed={confirmed}
                onConfirmed={setConfirmed}
                busy={busy}
                onApply={applyNew}
                onCancel={reset}
                replacing={Boolean(saved)}
                subject={subject}
              />
            </div>
          )}

          {mode === "upload" && (
            <div className="space-y-2">
              <Input type="file" accept="image/png,image/jpeg" onChange={(e) => { setFile(e.target.files?.[0] || null); setConfirmed(false); }} />
              <p className="text-xs text-muted-foreground">PNG or JPG, 1 MB maximum.</p>
              {file && <img src={URL.createObjectURL(file)} alt="Signature to apply" className="h-16 w-full rounded-lg border border-border object-contain" />}
              <ConfirmAndApply
                confirmed={confirmed}
                onConfirmed={setConfirmed}
                busy={busy}
                onApply={applyNew}
                onCancel={reset}
                replacing={Boolean(saved)}
                subject={subject}
              />
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
        Only you can sign your own documents. The signing event, the signature version and the time are recorded in the audit trail.
      </p>
    </section>
  );
}

function ConfirmAndApply({ confirmed, onConfirmed, busy, onApply, onCancel, replacing, subject }) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      {replacing && (
        <p className="text-xs text-muted-foreground">This signature replaces your saved professional signature in your profile.</p>
      )}
      <label className="flex items-start gap-2 text-xs">
        <Checkbox checked={confirmed} onCheckedChange={(v) => onConfirmed(Boolean(v))} className="mt-0.5" />
        <span>I have signed this {subject} myself and I approve it.</span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onApply} disabled={!confirmed || busy}>
          {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Apply signature
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
    </div>
  );
}