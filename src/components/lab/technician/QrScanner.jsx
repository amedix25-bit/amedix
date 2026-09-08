import React, { useEffect, useRef, useState } from "react";
import { Loader2, ScanLine } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function QrScanner({ onScan }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let stream;
    let timer;
    let stopped = false;

    const start = async () => {
      if (!("BarcodeDetector" in window)) {
        setError("QR scanning is not supported by this browser. Please use Enter CIN instead.");
        setStarting(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        timer = setInterval(async () => {
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && codes[0].rawValue && !stopped) {
              stopped = true;
              onScan(codes[0].rawValue);
            }
          } catch {
            /* frame not ready */
          }
        }, 500);
        setStarting(false);
      } catch (err) {
        setError("Could not access the camera. Please use Enter CIN instead.");
        setStarting(false);
      }
    };
    start();

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Scan the patient's QR code</Label>
      {error ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
          {error}
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
        The QR code contains only the patient's secure CIN identifier — no medical information.
      </p>
    </div>
  );
}