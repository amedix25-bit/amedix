import React, { useEffect, useRef, useState } from "react";
import { X, Zap, ZapOff, Loader2 } from "lucide-react";
import { detectDocumentQuad, warpQuad, enhanceDocument } from "@/lib/documentScanner";

// The AMedix document-scanning camera — a real scanner interface, not a
// normal camera upload. It detects the document's edges and four corners in
// the live video, shows when the page is correctly positioned, captures
// automatically once the page is stable (manual capture and torch are also
// available), then crops to the detected boundaries, corrects perspective
// and rotation, and enhances readability — producing a clean scan instead of
// a raw photograph.
export default function DocumentScannerCamera({ onCapture, onClose, t }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const quadRef = useRef(null);
  const prevQuadRef = useRef(null);
  const stableRef = useRef(0);
  const capturingRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [detected, setDetected] = useState(false);
  const [stable, setStable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const start = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(t("Document scanning is not supported on this device. Please use Upload Document instead."));
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        setTorchAvailable(!!caps.torch);
        setReady(true);
        timer = setInterval(detectLoop, 400);
      } catch (err) {
        setError(t("Camera access is required for scanning. Allow camera access and try again, or use Upload Document instead."));
      }
    };
    start();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  const drawOverlay = (quad, isStable) => {
    const overlay = overlayRef.current;
    const video = videoRef.current;
    if (!overlay || !video || !video.videoWidth) return;
    const cw = overlay.clientWidth;
    const ch = overlay.clientHeight;
    if (overlay.width !== cw || overlay.height !== ch) {
      overlay.width = cw;
      overlay.height = ch;
    }
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, cw, ch);
    const scale = Math.min(cw / video.videoWidth, ch / video.videoHeight);
    const ox = (cw - video.videoWidth * scale) / 2;
    const oy = (ch - video.videoHeight * scale) / 2;
    if (!quad) {
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(cw * 0.1, ch * 0.08, cw * 0.8, ch * 0.84);
      return;
    }
    const pts = quad.map((p) => ({ x: ox + p.x * video.videoWidth * scale, y: oy + p.y * video.videoHeight * scale }));
    ctx.setLineDash([]);
    ctx.strokeStyle = isStable ? "#34d399" : "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = isStable ? "#34d399" : "#ffffff";
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const detectLoop = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || capturingRef.current) return;
    const work = document.createElement("canvas");
    work.width = 160;
    work.height = Math.round((video.videoHeight * 160) / video.videoWidth);
    work.getContext("2d", { willReadFrequently: true }).drawImage(video, 0, 0, work.width, work.height);
    const quad = detectDocumentQuad(work);
    quadRef.current = quad;
    setDetected(!!quad);
    if (quad && prevQuadRef.current) {
      const move =
        quad.reduce((s, p, i) => s + Math.hypot(p.x - prevQuadRef.current[i].x, p.y - prevQuadRef.current[i].y), 0) / 4;
      stableRef.current = move < 0.025 ? stableRef.current + 1 : 0;
    } else {
      stableRef.current = 0;
    }
    setStable(stableRef.current >= 3);
    prevQuadRef.current = quad;
    drawOverlay(quad, stableRef.current >= 3);
    // Automatic capture: a valid document quad held stable across frames.
    if (quad && stableRef.current >= 3) capture();
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || capturingRef.current) return;
    capturingRef.current = true;
    setCapturing(true);
    try {
      const frame = document.createElement("canvas");
      frame.width = video.videoWidth;
      frame.height = video.videoHeight;
      frame.getContext("2d", { willReadFrequently: true }).drawImage(video, 0, 0);
      // Edge detection runs on the full-resolution capture; the scan is then
      // cropped to the detected boundaries, perspective-corrected and
      // enhanced. When detection fails, the enhanced full frame is delivered
      // — the user can review it and retake.
      const quad = detectDocumentQuad(frame);
      let scan = null;
      if (quad) {
        try {
          scan = warpQuad(frame, quad);
        } catch (err) {
          scan = null;
        }
      }
      if (!scan) scan = frame;
      enhanceDocument(scan);
      const dataUrl = scan.toDataURL("image/jpeg", 0.92);
      onCapture(dataUrl);
    } finally {
      capturingRef.current = false;
    }
  };

  const toggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (!track) return;
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch (err) {
      /* torch unsupported on this device */
    }
  };

  const statusText = error
    ? ""
    : capturing
      ? t("Capturing…")
      : detected
        ? stable
          ? t("Hold steady… capturing")
          : t("Hold steady…")
        : t("Position the passport page inside the frame");

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <p className="text-white font-semibold">{t("Scan Passport")}</p>
        <button type="button" onClick={onClose} className="p-2 -mr-2" aria-label={t("Close")}>
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video ref={videoRef} autoPlay muted playsInline className="max-w-full max-h-full object-contain" />
        <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">{t("Starting camera…")}</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="rounded-xl bg-white p-5 text-center max-w-sm">
              <p className="text-sm text-foreground">{error}</p>
              <button type="button" onClick={onClose} className="mt-3 text-sm font-medium text-primary underline">
                {t("Back to Upload Document")}
              </button>
            </div>
          </div>
        )}
      </div>

      {!error && (
        <div className="p-6 space-y-4 text-center">
          <p className="text-sm text-white/85 min-h-[1.25rem]">{statusText}</p>
          <div className="flex items-center justify-center gap-8">
            {torchAvailable && (
              <button
                type="button"
                onClick={toggleTorch}
                className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center"
                aria-label={t("Flash")}
              >
                {torchOn ? <ZapOff className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
              </button>
            )}
            <button
              type="button"
              onClick={capture}
              disabled={!ready || capturing}
              className="w-16 h-16 rounded-full bg-white disabled:opacity-40 ring-4 ring-white/40 active:scale-95 transition-transform"
              aria-label={t("Capture")}
            />
          </div>
          <p className="text-[11px] text-white/50">{t("The page is captured automatically when it is stable and correctly positioned.")}</p>
        </div>
      )}
    </div>
  );
}