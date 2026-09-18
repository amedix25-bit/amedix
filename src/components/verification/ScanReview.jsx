import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Plus, Check, X, Loader2 } from "lucide-react";

// Review screen after a scan capture: preview the scanned pages, remove or
// retake individual pages via the thumbnails, add more pages, or confirm the
// scan. Confirmed scans proceed to PDF assembly; retaken pages never leave
// the device.
export default function ScanReview({ pages, onRetake, onAddPage, onRemovePage, onConfirm, busy, t }) {
  const [selected, setSelected] = useState(Math.max(0, pages.length - 1));
  const active = pages.length ? Math.min(selected, pages.length - 1) : -1;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
      {active >= 0 ? (
        <div className="rounded-lg overflow-hidden bg-white border border-border">
          <img src={pages[active]} alt={t("Scanned page")} className="w-full" />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-6">{t("No scanned pages yet. Tap Add Page to scan the passport page.")}</p>
      )}

      {pages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pages.map((p, i) => (
            <div key={i} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSelected(i)}
                className={`block w-16 h-20 rounded-md overflow-hidden border-2 ${i === active ? "border-primary" : "border-border"}`}
              >
                <img src={p} alt="" className="w-full h-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => onRemovePage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center"
                aria-label={t("Remove page")}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant="outline" onClick={onRetake} disabled={busy || !pages.length}>
          <RotateCcw className="w-4 h-4 rtl:ml-2 rtl:mr-0 ltr:mr-2" />
          {t("Retake")}
        </Button>
        <Button type="button" variant="outline" onClick={onAddPage} disabled={busy}>
          <Plus className="w-4 h-4 rtl:ml-2 rtl:mr-0 ltr:mr-2" />
          {t("Add Page")}
        </Button>
        <Button type="button" onClick={onConfirm} disabled={busy || !pages.length}>
          {busy ? <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" /> : <Check className="w-4 h-4 rtl:ml-2 rtl:mr-0 ltr:mr-2" />}
          {t("Confirm Scan")}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        {t("Confirm Scan combines the pages into one PDF and securely attaches it to your verification. Retaken pages are never saved.")}
      </p>
    </div>
  );
}