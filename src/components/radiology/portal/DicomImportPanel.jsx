import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Loader2, FileArchive, AlertTriangle } from "lucide-react";

// Manual DICOM import — authorized technicians upload individual DICOM files
// or a ZIP package (stored privately). The backend verifies the DICOM
// structure, extracts the Study / Series / SOP Instance UIDs, modality, study
// date and accession number, rejects non-DICOM or mismatched-patient files and
// detects duplicates before anything is attached to the patient record.
export default function DicomImportPanel({ onImported, mode }) {
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [requestRef, setRequestRef] = useState("");
  const [cin, setCin] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const pick = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setResult(null);
    setError("");
  };

  const upload = async () => {
    if (files.length === 0) {
      setError("Choose at least one DICOM file or ZIP package.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        uploaded.push({ file_uri, file_name: file.name, size: file.size });
      }
      const res = await base44.functions.invoke("radiologyImportDicom", {
        action: "import",
        files: uploaded,
        request_id: requestRef.trim(),
        patient_cin: cin.trim(),
      });
      setResult(res.data);
      setFiles([]);
      toast({ title: res.data?.duplicate ? "Study already archived" : "Study imported" });
      if (onImported) onImported(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <FileArchive className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm">Manual DICOM import</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Upload files from the modality or the archive. The study is attached only to the existing patient record
        selected here, and duplicate studies are never created.
      </p>

      {mode && mode !== "live" && (
        <p className="text-[11px] text-muted-foreground rounded-md border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5 px-3 py-2 mb-4">
          {mode === "demonstration"
            ? "Demonstration mode: only synthetic studies for the fictional patients (CIN starting DEMO-) are accepted. Real patient images are refused by the server."
            : "Verification mode: real patient images stay blocked until the facility is switched to live operation."}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Imaging request reference (optional)</Label>
          <Input
            className="mt-1"
            value={requestRef}
            onChange={(e) => setRequestRef(e.target.value)}
            placeholder="IR-20261104-8F3K request id"
          />
        </div>
        <div>
          <Label className="text-xs">Patient CIN (when no request is selected)</Label>
          <Input className="mt-1" value={cin} onChange={(e) => setCin(e.target.value)} placeholder="CIN-000123" />
        </div>
      </div>

      <div className="mt-4">
        <Label className="text-xs">DICOM files or ZIP package</Label>
        <Input className="mt-1" type="file" multiple accept=".dcm,.ima,.zip,application/zip,application/dicom" onChange={pick} />
        <p className="text-[11px] text-muted-foreground mt-1">
          {files.length > 0 ? `${files.length} file(s) selected` : "Up to 30 files, 25 MB each."} Files are stored privately.
        </p>
      </div>

      <Button className="mt-4" onClick={upload} disabled={busy}>
        {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
        {busy ? "Verifying and importing…" : "Verify and import"}
      </Button>

      {error && (
        <p className="mt-3 text-xs rounded-md border border-[hsl(var(--critical))]/30 bg-[hsl(var(--critical))]/5 text-[hsl(var(--critical))] px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-3 rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs space-y-1">
          <p className="font-medium">
            {result.duplicate ? "This study is already archived — nothing was duplicated." : "Study imported."}
          </p>
          <p className="text-muted-foreground">
            {result.patient?.full_name} · {result.modality || result.study?.modality || "Modality not recorded"} ·{" "}
            {result.series_count} series · {result.image_count} images
            {result.study_date ? ` · ${result.study_date}` : ""}
          </p>
          {result.study?.study_instance_uid && (
            <p className="text-[11px] text-muted-foreground break-all">Study UID {result.study.study_instance_uid}</p>
          )}
          {Array.isArray(result.rejected) && result.rejected.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="font-medium inline-flex items-center gap-1 text-[hsl(var(--warning))]">
                <AlertTriangle className="w-3 h-3" /> {result.rejected.length} file(s) refused
              </p>
              {result.rejected.map((r, i) => (
                <p key={i} className="text-[11px] text-muted-foreground">
                  {r.file_name}: {r.reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}