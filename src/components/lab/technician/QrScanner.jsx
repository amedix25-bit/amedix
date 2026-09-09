import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Keyboard, Loader2, ScanLine } from "lucide-react";

// Live QR scanner that works across modern mobile and desktop browsers
// (Safari, Chrome, Edge, Firefox). Uses the native BarcodeDetector when the
// browser provides one, and falls back to jsQR frame decoding otherwise, so
// supported browsers never see a "not supported" message. If the camera
// permission is denied or the camera fails, a clear error is shown together
// with an "Enter CIN Manually" backup option (when onManualEntry is given).
export default function QrScanner({ onScan, label, onManualEntry, manualLabel }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let stream;
    let timer;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const handleDetected = (value) => {
      if (value && !stopped) {
        stopped = true;
        onScan(value);
      }
    };

    // Native detection (Chrome / Edge / Android)
    const detectNative = async (detector) => {
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0 && codes[0].rawValue) handleDetected(codes[0].rawValue);
      } catch {
        /* frame not ready */
      }
    };

    // Universal fallback (Safari / Firefox / iOS) — decode frames with jsQR
    const detectFallback = () => {
      const video = videoRef.current;
      if (!video || !video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(image.data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
      if (code && code.data) handleDetected(code.data);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "This browser cannot access the camera. Please enter the code manually or use a supported browser."
        );
        setStarting(false);
        return;
      }
      try {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      } catch (err) {
        if (err.name === "NotAllowedError" || err.name === "SecurityError") {
          setError("Camera access was denied. Allow camera access in your browser settings, or enter the CIN manually.");
        } else if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
          setError("No usable camera was found on this device. Enter the CIN manually instead.");
        } else {
          setError("Could not start the camera. Enter the CIN manually instead.");
        }
        setStarting(false);
        return;
      }

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch {
        /* autoplay already in progress */
      }

      const detect =
        "BarcodeDetector" in window
          ? () => detectNative(new window.BarcodeDetector({ formats: ["qr_code"] }))
          : detectFallback;
      setStarting(false);
      timer = setInterval(detect, 400);
    };
    start();

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label || "Scan the patient's QR code"}</Label>
      {error ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground text-center space-y-3">
          <p>{error}</p>
          {onManualEntry && (
            <Button size="sm" variant="outline" onClick={onManualEntry}>
              <Keyboard className="w-4 h-4 mr-1" />
              {manualLabel || "Enter CIN Manually"}
            </Button>
          )}
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-border bg-black aspect-video flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {starting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 text-sm bg-black/40">
              <Loader2 className="w-5 h-5 mb-2 animate-spin" />
              Starting camera...
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ScanLine className="w-10 h-10 text-white/70" />
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        The QR code contains only a secure identifier (patient CIN or request reference) — no medical information.
      </p>
    </div>
  );
}