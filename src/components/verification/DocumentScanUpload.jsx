import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2, ScanLine, UploadCloud, FileUp, Check, AlertTriangle, RefreshCw, Image as ImageIcon,
} from "lucide-react";
import DocumentScannerCamera from "@/components/verification/DocumentScannerCamera";
import ScanReview from "@/components/verification/ScanReview";
import { documentFileName } from "@/lib/documentScanner";
import {
  IMAGE_ACCEPT, PDF_ACCEPT, MAX_INLINE_DOCUMENT_BYTES, isPdfFile, fileSizeLabel,
  prepareImageFile, rotateImageDataUrl, readFileAsDataUrl, dataUrlToBase64,
} from "@/lib/documentImage";

// THE unified document acquisition flow for every verification document —
// three ways in, whichever suits the device:
//   • Take a photo   → the integrated scanner (edge detection, auto-capture,
//                      crop, perspective correction, enhancement)
//   • Choose a photo → an existing photo from the gallery (JPG/PNG/HEIC)
//   • Upload a PDF   → an existing PDF, used as it is
// Every page is checked (rotate, retake, add the other side) before anything
// leaves the device; the pages are then combined into one PDF, uploaded to
// private storage with the original file preserved, and the document number is
// read and compared with the number entered — automatically, on submission.
export default function DocumentScanUpload({
  documentType, sides = "single", patientName = "", cin = "", hint = "", file, onFile, t,
}) {
  const [mode, setMode] = useState("idle"); // idle | camera | review
  const [pages, setPages] = useState([]);
  const [originals, setOriginals] = useState([]);
  const [stage, setStage] = useState(""); // prepare | upload | original | done
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const [retryable, setRetryable] = useState(false);
  const galleryRef = useRef(null);
  const pdfRef = useRef(null);
  const pendingRef = useRef(null);
  const busyRef = useRef(false);

  const twoSided = sides === "both";
  const cameraSupported = !!(typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const busy = preparing || !!stage;
  const fileName = documentFileName(documentType, patientName, cin);

  const pageLabel = (index) => {
    if (!twoSided) return t("Document");
    if (index === 0) return t("Front side");
    if (index === 1) return t("Back side");
    return `${t("Page")} ${index + 1}`;
  };

  const addPage = (page) => {
    setPages((prev) => [...prev, { ...page, label: pageLabel(prev.length) }]);
  };

  // NOTHING IS UPLOADED. The pages are held in memory and handed to the
  // verification request as base64, where they are read and released. No file is
  // written to private storage, public storage or anywhere else.
  const handOverPending = async () => {
    const pending = pendingRef.current;
    if (!pending || busyRef.current) return;
    busyRef.current = true;
    setError("");
    setRetryable(false);
    try {
      setStage("upload");
      onFile({
        pages: pending.pages,
        name: pending.name,
        source: pending.source,
        page_count: pending.pages.length,
        size: pending.size,
        mime: pending.pages.length === 1 ? pending.pages[0].mime : "application/pdf",
      });
      pendingRef.current = null;
      setPages([]);
      setOriginals([]);
      setMode("idle");
      setStage("done");
      setTimeout(() => setStage(""), 1200);
    } catch (err) {
      console.error(err);
      setError(t("The document could not be prepared. Please try again."));
      setRetryable(true);
      setMode(pages.length ? "review" : "idle");
    } finally {
      busyRef.current = false;
      setStage((s) => (s === "done" ? s : ""));
    }
  };

  const queue = async (inlinePages, name, source) => {
    pendingRef.current = {
      pages: inlinePages,
      name,
      source,
      size: inlinePages.reduce((sum, p) => sum + Math.round((p.base64.length * 3) / 4), 0),
    };
    await handOverPending();
  };

  const confirmPages = async () => {
    if (!pages.length || busyRef.current) return;
    setPreparing(true);
    setError("");
    try {
      const inlinePages = pages.map((page) => ({ mime: "image/jpeg", base64: dataUrlToBase64(page.dataUrl) }));
      const bytes = inlinePages.reduce((sum, p) => sum + Math.round((p.base64.length * 3) / 4), 0);
      if (bytes > MAX_INLINE_DOCUMENT_BYTES) {
        setError(t("These pages are too large to check at once. Photograph the document with the camera so it is compressed for reading."));
        setRetryable(false);
        return;
      }
      await queue(inlinePages, fileName, pages[0]?.source === "camera" ? "camera" : "gallery");
    } catch (err) {
      console.error(err);
      setError(t("The document could not be prepared. Please try again."));
      setRetryable(false);
    } finally {
      setPreparing(false);
    }
  };

  const handleGallery = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setError("");
    setRetryable(false);

    const pdf = files.find(isPdfFile);
    if (pdf) {
      if (pdf.size > MAX_INLINE_DOCUMENT_BYTES) {
        setError(t("This PDF is larger than 8 MB. Nothing is uploaded, so the document has to travel inside the check itself — photograph the pages instead."));
        return;
      }
      setPreparing(true);
      try {
        const dataUrl = await readFileAsDataUrl(pdf);
        await queue([{ mime: "application/pdf", base64: dataUrlToBase64(dataUrl) }], fileName, "pdf");
      } catch (err) {
        console.error(err);
        setError(t("This PDF could not be opened. Please choose another file."));
      } finally {
        setPreparing(false);
      }
      return;
    }

    setPreparing(true);
    try {
      const prepared = [];
      for (const f of files.slice(0, twoSided ? 2 : 1)) {
        try {
          const image = await prepareImageFile(f);
          prepared.push({ dataUrl: image.dataUrl, quality: image.quality, source: "gallery" });
        } catch (err) {
          if (err.message === "too_large") {
            setError(t("This photo is larger than 30 MB. Please choose a smaller photo."));
          } else {
            setError(
              t("This photo format cannot be opened by this browser (HEIC photos may not open outside Safari). Take the photo with the camera, or upload a PDF.")
            );
          }
          return;
        }
      }
      setOriginals(files);
      prepared.forEach((p) => addPage(p));
      setMode("review");
    } finally {
      setPreparing(false);
    }
  };

  const handlePdf = async (e) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    setError("");
    if (!isPdfFile(picked)) {
      setError(t("Please select a PDF file."));
      return;
    }
    if (picked.size > MAX_INLINE_DOCUMENT_BYTES) {
      setError(t("This PDF is larger than 8 MB. Nothing is uploaded, so the document has to travel inside the check itself — photograph the pages instead."));
      return;
    }
    setPreparing(true);
    try {
      const dataUrl = await readFileAsDataUrl(picked);
      await queue([{ mime: "application/pdf", base64: dataUrlToBase64(dataUrl) }], fileName, "pdf");
    } catch (err) {
      console.error(err);
      setError(t("This PDF could not be opened. Please choose another file."));
    } finally {
      setPreparing(false);
    }
  };

  const rotatePage = async (index, degrees) => {
    const page = pages[index];
    if (!page) return;
    try {
      const dataUrl = await rotateImageDataUrl(page.dataUrl, degrees);
      setPages((prev) => prev.map((p, i) => (i === index ? { ...p, dataUrl } : p)));
    } catch (err) {
      console.error(err);
    }
  };

  if (file) {
    return (
      <div className="rounded-lg bg-muted px-3 py-2 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm truncate">{file.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {[file.page_count ? `${file.page_count} ${file.page_count > 1 ? t("pages") : t("page")}` : "", file.size ? fileSizeLabel(file.size) : ""]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => { setPages([]); setOriginals([]); onFile(null); }}>
            {t("Change file")}
          </Button>
        </div>
      </div>
    );
  }

  const stageRow = (key, label) => {
    const order = ["prepare", "upload", "done"];
    const done = order.indexOf(stage) > order.indexOf(key);
    const activeRow = stage === key;
    return (
      <div className="flex items-center gap-2 text-xs">
        {done ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : activeRow ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : (
          <span className="w-3.5 h-3.5 rounded-full border border-border" />
        )}
        <span className={done || activeRow ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {mode === "review" ? (
        <ScanReview
          pages={pages}
          busy={busy}
          t={t}
          onRotate={rotatePage}
          onRemovePage={(i) => setPages((prev) => prev.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, label: pageLabel(idx) })))}
          onRetake={() => { setPages((prev) => prev.slice(0, -1)); setMode("camera"); }}
          onAddCamera={() => setMode("camera")}
          onAddGallery={() => galleryRef.current?.click()}
          onConfirm={confirmPages}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => setMode("camera")} className="justify-start">
            <ScanLine className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t("Take a photo")}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => galleryRef.current?.click()} className="justify-start">
            <ImageIcon className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t("Choose a photo")}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => pdfRef.current?.click()} className="justify-start">
            <FileUp className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t("Upload a PDF")}
          </Button>
        </div>
      )}

      <input ref={galleryRef} type="file" accept={IMAGE_ACCEPT} multiple={twoSided} className="hidden" onChange={handleGallery} />
      <input ref={pdfRef} type="file" accept={PDF_ACCEPT} className="hidden" onChange={handlePdf} />

      {hint && mode !== "review" && <p className="text-xs text-muted-foreground">{hint}</p>}
      {!cameraSupported && mode !== "review" && (
        <p className="text-xs text-muted-foreground">
          {t("The camera is not available on this device — choose a photo or upload a PDF instead.")}
        </p>
      )}

      {(busy || stage) && (
        <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          {stageRow("prepare", t("Preparing document"))}
          {stageRow("upload", t("Checking the document"))}
        </div>
      )}

      {error && (
        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
          {retryable && (
            <Button type="button" size="sm" variant="outline" onClick={handOverPending} disabled={busy}>
              <RefreshCw className="w-3.5 h-3.5 mr-2 rtl:ml-2 rtl:mr-0" />
              {t("Try again")}
            </Button>
          )}
        </div>
      )}

      {mode === "camera" && (
        <DocumentScannerCamera
          t={t}
          sideLabel={pageLabel(pages.length)}
          onClose={() => setMode(pages.length ? "review" : "idle")}
          onPickGallery={() => { setMode("idle"); galleryRef.current?.click(); }}
          onPickPdf={() => { setMode("idle"); pdfRef.current?.click(); }}
          onCapture={(page) => { addPage(page); setMode("review"); }}
        />
      )}
    </div>
  );
}