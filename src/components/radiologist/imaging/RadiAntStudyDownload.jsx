import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle, CheckCircle2, Download, FileArchive, FolderOpen, Loader2, MonitorDown, ShieldCheck,
} from "lucide-react";

// RadiAnt desktop workflow — the radiologist downloads the authorized study as a
// ZIP and opens it in the locally installed RadiAnt DICOM Viewer. Browsers cannot
// start a desktop application, so no launch link is generated: the manual open
// steps are shown instead. The download is authorized and packaged server-side;
// the browser only ever receives a short-lived signed URL for the archive.
export default function RadiAntStudyDownload({ requestId, compact = false, className = "" }) {
  const [info, setInfo] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    setPhase("loading");
    setDone(null);
    setError("");
    (async () => {
      try {
        const res = await base44.functions.invoke("radiologyStudyDownload", { action: "status", request_id: requestId });
        if (cancelled) return;
        setInfo(res.data || null);
        setPhase("idle");
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.error || err.message);
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const start = async () => {
    setError("");
    setDone(null);
    setProgress(0);
    setPhase("preparing");
    try {
      const res = await base44.functions.invoke("radiologyStudyDownload", { action: "prepare", request_id: requestId });
      const data = res.data || {};
      if (!data.download_url) throw new Error(data.message || "The study archive could not be prepared.");

      setPhase("transfer");
      const response = await fetch(data.download_url);
      if (!response.ok) throw new Error("The prepared archive is no longer available. Download it again.");

      const total = Number(response.headers.get("content-length") || data.size_bytes || 0);
      const reader = response.body?.getReader();
      const chunks = [];
      let received = 0;
      if (reader) {
        for (;;) {
          const { done: finished, value } = await reader.read();
          if (finished) break;
          chunks.push(value);
          received += value.length;
          if (total) setProgress(Math.min(99, Math.round((received / total) * 100)));
        }
      } else {
        chunks.push(new Uint8Array(await response.arrayBuffer()));
      }

      const blob = new Blob(chunks, { type: "application/zip" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = data.file_name || "AMedix-study.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);

      setProgress(100);
      setDone({
        file_name: data.file_name,
        file_count: data.file_count,
        series_count: data.series_count,
        size_bytes: blob.size,
        skipped: data.skipped_files || 0,
      });
      setPhase("done");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setPhase("error");
    }
  };

  const busy = phase === "preparing" || phase === "transfer";
  const sizeMb = (bytes) => `${(Number(bytes || 0) / (1024 * 1024)).toFixed(1)} MB`;

  if (phase === "loading") {
    return (
      <p className={`text-xs text-muted-foreground flex items-center gap-1.5 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking DICOM study availability…
      </p>
    );
  }

  return (
    <div className={`rounded-lg border border-border bg-card ${compact ? "p-2.5" : "p-3"} space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <MonitorDown className="w-3.5 h-3.5 text-primary" /> Open in RadiAnt — download DICOM study
          </p>
          {info?.study_instance_uid && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              Study {info.study_instance_uid}
              {info.series_count ? ` · ${info.series_count} series` : ""}
              {info.file_count ? ` · ${info.file_count} image file(s)` : ""}
            </p>
          )}
        </div>
        {info?.ready && (
          <Button size="sm" onClick={start} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
            {busy ? "Preparing…" : "Download Study (ZIP)"}
          </Button>
        )}
      </div>

      {!info?.ready && phase !== "error" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5">
          <p className="text-xs text-amber-800 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {info?.message ||
              "A PACS/DICOM source is required before study retrieval can work. No DICOM study files are available for this request."}
          </p>
        </div>
      )}

      {busy && (
        <div className="space-y-1">
          <Progress value={phase === "preparing" ? 5 : progress} className="h-1.5" />
          <p className="text-[11px] text-muted-foreground">
            {phase === "preparing"
              ? "Checking your access and packaging the study archive on the server…"
              : `Downloading the archive… ${progress}%`}
          </p>
        </div>
      )}

      {error && phase === "error" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 space-y-1.5">
          <p className="text-xs text-amber-800 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
          </p>
          {info?.ready && (
            <Button size="sm" variant="outline" onClick={start}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Try again
            </Button>
          )}
        </div>
      )}

      {phase === "done" && done && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2.5 space-y-1">
          <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Download complete — {done.file_name} ({sizeMb(done.size_bytes)})
          </p>
          <p className="text-[11px] text-emerald-800/90">
            {done.file_count} DICOM file(s){done.series_count ? ` in ${done.series_count} series` : ""} saved to your computer.
            {done.skipped ? ` ${done.skipped} file(s) could not be retrieved and were left out.` : ""}
          </p>
        </div>
      )}

      {info?.ready && (
        <div className="rounded-md bg-muted/50 p-2.5 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" /> Opening the study in RadiAnt
          </p>
          <ol className="text-[11px] text-muted-foreground list-decimal ml-4 space-y-0.5">
            <li>Unzip the downloaded archive — the study's series folders are preserved inside it.</li>
            <li>In RadiAnt DICOM Viewer choose <span className="font-medium">File → Open Folder</span> and select the unzipped study folder (or drag the folder onto RadiAnt).</li>
            <li>Browsers cannot start a desktop application, so RadiAnt is opened by you, not by AMedix. If your facility has confirmed a RadiAnt launch protocol, its administrator can record it in Imaging System Connection.</li>
          </ol>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground flex items-start gap-1">
        <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5 text-emerald-600" />
        <span>
          Authorized for your account only. The archive is built server-side from privately stored study files; every download is
          recorded in the clinical audit trail.
        </span>
      </p>

      {info?.ready && !info?.file_count ? (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <FileArchive className="w-3.5 h-3.5" /> No files available to package.
        </p>
      ) : null}
    </div>
  );
}