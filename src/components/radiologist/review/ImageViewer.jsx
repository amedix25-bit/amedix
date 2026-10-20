import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Maximize2, Minimize2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw, FileText, Info, Loader2, ImageOff,
} from "lucide-react";

const isPdf = (url) => /\.pdf($|\?)/i.test(url || "");

// In-app image viewer — displays the study images and PDF reports stored in
// AMedix (uploaded by the radiology department). Series navigation, zoom, pan
// and fullscreen are supported. Full DICOM display (window/level, MPR,
// measurements) is NOT integrated — connect the facility PACS for
// diagnostic-grade DICOM viewing.
function ViewerCore({ images, emptyLabel }) {
  const usable = (images || []).filter((u) => u && !isPdf(u));
  const pdfs = (images || []).filter(isPdf);
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const wrapRef = useRef(null);
  const dragRef = useRef(null);

  const reset = () => {
    setIdx(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLoaded(false);
    setFailed(false);
  };

  useEffect(() => {
    reset();
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (i) => {
    setIdx(i);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLoaded(false);
    setFailed(false);
  };

  // Non-passive wheel zoom over the canvas.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !usable.length) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setZoom((z) => Math.min(8, Math.max(0.2, +(z + delta).toFixed(2))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [usable.length]);

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (wrapRef.current) {
      wrapRef.current.requestFullscreen();
    }
  };

  const onKey = (e) => {
    if (e.key === "ArrowLeft" && idx > 0) go(idx - 1);
    if (e.key === "ArrowRight" && idx < usable.length - 1) go(idx + 1);
    if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(8, z + 0.2));
    if (e.key === "-") setZoom((z) => Math.max(0.2, z - 0.2));
    if (e.key === "0") { setZoom(1); setPan({ x: 0, y: 0 }); }
  };

  if (!usable.length) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 py-12 text-center px-6">
        <ImageOff className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm font-medium">{emptyLabel || "No images transferred yet"}</p>
        <p className="text-xs text-muted-foreground mt-1">
          The radiology department records the received study images here.
        </p>
        {pdfs.length > 0 && (
          <div className="mt-3 space-y-1">
            {pdfs.map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mx-3">
                <FileText className="w-3.5 h-3.5" /> Open attached PDF {pdfs.length > 1 ? i + 1 : ""}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  const safeIdx = Math.min(idx, usable.length - 1);
  const src = usable[safeIdx];

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={safeIdx === 0} onClick={() => go(safeIdx - 1)} title="Previous image (←)">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums px-1">
          {safeIdx + 1} / {usable.length}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={safeIdx >= usable.length - 1} onClick={() => go(safeIdx + 1)} title="Next image (→)">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="w-px h-5 bg-border mx-1" />
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))} title="Zoom out (-)">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums px-1 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(8, z + 0.2))} title="Zoom in (+)">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset (0)">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <span className="w-px h-5 bg-border mx-1" />
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={toggleFullscreen} title="Fullscreen">
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={wrapRef}
        tabIndex={0}
        onKeyDown={onKey}
        className={`relative overflow-hidden rounded-lg border border-border bg-black flex items-center justify-center outline-none ${fullscreen ? "h-screen" : "h-[420px]"}`}
      >
        {!loaded && !failed && (
          <Loader2 className="w-6 h-6 text-white/60 animate-spin absolute" />
        )}
        {failed ? (
          <div className="text-center px-6">
            <ImageOff className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm text-red-300">This image failed to load — a transfer error occurred.</p>
            <button className="text-xs text-white/70 underline mt-2" onClick={() => { setFailed(false); setLoaded(false); }}>
              Retry
            </button>
          </div>
        ) : (
          <img
            src={src}
            alt={`Study image ${safeIdx + 1}`}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="max-w-none select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              cursor: zoom > 1 ? (dragRef.current ? "grabbing" : "grab") : "default",
              visibility: loaded ? "visible" : "hidden",
              position: loaded ? "static" : "absolute",
            }}
            onMouseDown={(e) => {
              dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
            }}
            onMouseMove={(e) => {
              if (!dragRef.current) return;
              setPan({
                x: dragRef.current.px + (e.clientX - dragRef.current.sx),
                y: dragRef.current.py + (e.clientY - dragRef.current.sy),
              });
            }}
            onMouseUp={() => { dragRef.current = null; }}
            onMouseLeave={() => { dragRef.current = null; }}
            onDoubleClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          />
        )}
      </div>

      {/* Thumbnails */}
      {usable.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {usable.map((u, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`shrink-0 h-12 w-16 rounded-md overflow-hidden border-2 ${i === safeIdx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <img src={u} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {pdfs.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs">
          {pdfs.map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline">
              <FileText className="w-3.5 h-3.5" /> Attached PDF {pdfs.length > 1 ? i + 1 : ""}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ImageViewer({ images, comparisonImages, comparisonLabel }) {
  const hasComparison = Array.isArray(comparisonImages);
  const [tab, setTab] = useState("current");

  useEffect(() => {
    if (!hasComparison) setTab("current");
  }, [hasComparison]);

  const active = tab === "comparison" ? comparisonImages : images;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-sm">Image Viewer</h3>
        {hasComparison && (
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            <button
              className={`px-3 py-1.5 ${tab === "current" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              onClick={() => setTab("current")}
            >
              Current Study
            </button>
            <button
              className={`px-3 py-1.5 ${tab === "comparison" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              onClick={() => setTab("comparison")}
            >
              Comparison{comparisonLabel ? `: ${comparisonLabel}` : ""}
            </button>
          </div>
        )}
      </div>

      <ViewerCore
        key={tab}
        images={active}
        emptyLabel={tab === "comparison" ? "No images on the comparison study" : undefined}
      />

      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5 text-[11px] text-muted-foreground">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p>
          In-app viewer for the images and PDF reports stored in AMedix (series navigation, zoom, pan, fullscreen).
          Full DICOM display — window/level, MPR, measurements — is not integrated; connect the facility PACS for
          diagnostic-grade DICOM viewing.
        </p>
      </div>
    </div>
  );
}