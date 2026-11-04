import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, ImageOff, MonitorPlay, Server, GitCompare, X, Layers, Info } from "lucide-react";
import ImageViewer from "@/components/radiologist/review/ImageViewer";
import RadiAntStudyDownload from "@/components/radiologist/imaging/RadiAntStudyDownload";

// Centre panel — the imaging workspace. The facility's own connected viewer
// (embedded OHIF) opens the verified study when it is genuinely connected;
// otherwise the images held in AMedix are displayed in the in-app viewer, and
// the panel states exactly which capabilities that viewer provides.
export default function CaseViewerPanel({ request, pacs, imagingStudies, comparison, onClearComparison }) {
  const [tab, setTab] = useState("current");
  const studies = imagingStudies || [];
  const primary = studies[0] || null;
  const series = primary?.series || [];
  const pacsInfo = pacs?.pacs || null;
  const amedixImages = request.image_file_urls || [];
  const comparing = !!comparison && tab === "prior";
  const images = comparing ? comparison.images || [] : amedixImages;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant={tab === "current" ? "default" : "outline"} className="h-7 text-xs px-2"
            onClick={() => setTab("current")}>
            Current study
          </Button>
          {comparison && (
            <Button size="sm" variant={tab === "prior" ? "default" : "outline"} className="h-7 text-xs px-2"
              onClick={() => setTab("prior")}>
              <GitCompare className="w-3.5 h-3.5 mr-1" /> {comparison.request_id}
              <X className="w-3.5 h-3.5 ml-1.5" onClick={(e) => { e.stopPropagation(); onClearComparison(); setTab("current"); }} />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {pacs === null ? null : pacsInfo?.enabled ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700">
              <Server className="w-3 h-3" /> {pacsInfo.vendor_name || "Facility imaging system"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              <Info className="w-3 h-3" /> No facility PACS connected
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">
            <Database className="w-3 h-3" /> {(comparing ? images : amedixImages).length} image file(s)
          </span>
          {primary && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700">
              <Layers className="w-3 h-3" /> {series.length} series · {primary.image_count || 0} image(s)
            </span>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Series of the matched study — read from the linked imaging study */}
        {!comparing && series.length > 0 && (
          <div className="rounded-lg border border-border p-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Available series</p>
            <div className="flex flex-wrap gap-1.5">
              {series.map((s, i) => (
                <span key={s.series_instance_uid || i} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary">
                  #{s.series_number ?? i + 1} {s.modality} {s.description ? `· ${s.description}` : ""} · {s.image_count} img
                </span>
              ))}
            </div>
          </div>
        )}

        {comparing ? (
          <ImageViewer images={images} requestId={comparison.id} />
        ) : (
          <>
            <RadiAntStudyDownload requestId={request.id} compact />
            {amedixImages.length > 0 ? (
              <ImageViewer images={amedixImages} requestId={request.id} />
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/40 py-8 text-center px-4">
                <ImageOff className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm font-medium">No images attached to this request yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Download the study above to review it in RadiAnt; images the department records in AMedix appear here.
                </p>
              </div>
            )}
          </>
        )}

        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
          <MonitorPlay className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Download the study and open it in RadiAnt for full diagnostic display — window/level, measurements, multi-planar reconstruction and series navigation. The in-app AMedix viewer below provides image navigation, zoom and pan only.
        </p>
        {request.image_notes && (
          <p className="text-xs whitespace-pre-wrap rounded-lg bg-muted/50 p-2">
            <span className="font-semibold">Department image notes: </span>{request.image_notes}
          </p>
        )}
      </div>
    </div>
  );
}