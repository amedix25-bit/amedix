import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ScanLine, UploadCloud } from "lucide-react";
import DocumentScannerCamera from "@/components/verification/DocumentScannerCamera";
import ScanReview from "@/components/verification/ScanReview";
import { buildPdfFromImages, passportFileName } from "@/lib/documentScanner";

// Passport acquisition for identity verification — a true document scanner
// (edge detection → auto capture → perspective correction → crop/enhance →
// review → PDF) or an upload of an existing document. Only the confirmed
// result is uploaded to private storage; failed and retaken scans stay
// temporary. The verdict itself is decided by the backend verification
// process, never here.
export default function PassportScanUpload({ patientName = "", cin = "", file, onFile, t }) {
  const [mode, setMode] = useState("idle"); // idle | scan | review | processing
  const [pages, setPages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const scanSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const fileName = passportFileName(patientName, cin);

  const deliver = async (blob, name) => {
    setBusy(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({
        file: new File([blob], name, { type: blob.type || "application/pdf" }),
      });
      onFile({ uri: file_uri, name });
      setMode("idle");
      setPages([]);
    } catch (err) {
      console.error(err);
      setError(t("Something went wrong during verification. Please try again."));
      setMode(pages.length ? "review" : "idle");
    } finally {
      setBusy(false);
    }
  };

  const confirmScan = async () => {
    setMode("processing");
    try {
      const pdf = await buildPdfFromImages(pages);
      await deliver(pdf, fileName);
    } catch (err) {
      console.error(err);
      setError(t("Something went wrong during verification. Please try again."));
      setMode("review");
    }
  };

  const readAsDataUrl = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const first = files[0];
      const isPdf = /\.pdf$/i.test(first.name) || first.type === "application/pdf";
      if (isPdf) {
        // An existing PDF stays a PDF — only its filename is normalized.
        await deliver(new File([first], fileName, { type: "application/pdf" }), fileName);
      } else {
        const images = files.filter((f) => f.type.startsWith("image/"));
        if (!images.length) {
          setError(t("Please select a PDF or a photo of the document."));
          return;
        }
        const scanned = await Promise.all(images.map(readAsDataUrl));
        const pdf = await buildPdfFromImages(scanned);
        await deliver(pdf, fileName);
      }
    } catch (err) {
      console.error(err);
      setError(t("Something went wrong during verification. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  if (file) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
        <p className="text-sm truncate">{file.name}</p>
        <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => onFile(null)}>
          {t("Change file")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" disabled={!scanSupported || busy} onClick={() => { setPages([]); setMode("scan"); }}>
          <ScanLine className="w-4 h-4 rtl:ml-2 rtl:mr-0 ltr:mr-2" />
          {t("Scan Passport")}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" /> : <UploadCloud className="w-4 h-4 rtl:ml-2 rtl:mr-0 ltr:mr-2" />}
          {t("Upload Document")}
        </Button>
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleUpload} />
      {!scanSupported && (
        <p className="text-xs text-muted-foreground">
          {t("Scanning is not supported on this device — please use Upload Document.")}
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {mode === "scan" && (
        <DocumentScannerCamera
          t={t}
          onClose={() => setMode(pages.length ? "review" : "idle")}
          onCapture={(url) => {
            setPages((p) => [...p, url]);
            setMode("review");
          }}
        />
      )}
      {mode === "review" && (
        <ScanReview
          pages={pages}
          busy={busy}
          t={t}
          onRetake={() => {
            setPages((p) => p.slice(0, -1));
            setMode("scan");
          }}
          onAddPage={() => setMode("scan")}
          onRemovePage={(i) => setPages((p) => p.filter((_, idx) => idx !== i))}
          onConfirm={confirmScan}
        />
      )}
    </div>
  );
}