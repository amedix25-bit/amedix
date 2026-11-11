import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, Plus, Check, X, Loader2, AlertTriangle, Camera, Image as ImageIcon } from "lucide-react";

// Review screen: check every page of the submission before it is sent —
// rotate it upright, remove a page, retake or add another side, then submit.
// Nothing here has left the device yet.
export default function ScanReview({
  pages, busy, t,
  onRotate, onRemovePage, onRetake, onAddCamera, onAddGallery, onConfirm,
}) {
  const [selected, setSelected] = useState(Math.max(0, pages.length - 1));
  const active = pages.length ? Math.min(selected, pages.length - 1) : -1;
  const page = active >= 0 ? pages[active] : null;
  const warning =
    page?.quality?.blurry
      ? t("This page looks blurry. Retake it if the text is hard to read.")
      : page?.quality?.dark
        ? t("This page looks dark. Retake it in better light if the text is hard to read.")
        : page?.quality?.tooSmall
          ? t("This photo is small. Retake it if the details are hard to read.")
          : "";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
      {page ? (
        <div className="rounded-lg overflow-hidden bg-white border border-border">
          <img src={page.dataUrl} alt={t("Document page")} className="w-full max-h-72 object-contain" />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-6">{t("No pages yet.")}</p>
      )}

      {page && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground truncate">{page.label}</p>
          <div className="flex gap-1.5">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onRotate(active, -90)} aria-label={t("Rotate left")}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onRotate(active, 90)} aria-label={t("Rotate right")}>
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {warning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 dark:border-amber-900 dark:bg-amber-950/40">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800 dark:text-amber-300">{warning}</p>
        </div>
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
                <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
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

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onRetake} disabled={busy} className="w-full">
          <Camera className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t("Retake page")}
        </Button>
        <Button type="button" variant="outline" onClick={onAddCamera} disabled={busy} className="w-full">
          <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t("Add a page")}
        </Button>
      </div>
      <Button type="button" variant="ghost" onClick={onAddGallery} disabled={busy} className="w-full">
        <ImageIcon className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
        {t("Add a photo from the gallery")}
      </Button>
      <Button type="button" onClick={onConfirm} disabled={busy || !pages.length} className="w-full">
        {busy ? <Loader2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" /> : <Check className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />}
        {t("Submit document")}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        {t("Your pages are combined into one document and stored privately. Nothing is saved until you submit.")}
      </p>
    </div>
  );
}