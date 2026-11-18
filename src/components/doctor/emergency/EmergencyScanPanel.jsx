import React, { useState } from "react";
import QrScanner from "@/components/lab/technician/QrScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, X } from "lucide-react";

// One camera scanner used for both emergency QRs. A manual field is offered for
// desktop testing and for a scanner that cannot use the camera.
export default function EmergencyScanPanel({ title, description, label, onScan, onClose }) {
  const [manual, setManual] = useState("");

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary shrink-0" />
            <p className="font-semibold">{title}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close scanner">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <QrScanner key={title} onScan={onScan} label={label} />

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Or paste the QR code value"
          className="font-mono text-xs"
        />
        <Button
          type="button"
          disabled={!manual.trim()}
          onClick={() => onScan(manual.trim())}
          className="shrink-0"
        >
          Use code
        </Button>
      </div>
    </div>
  );
}