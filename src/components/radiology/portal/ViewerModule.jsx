import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DicomImportPanel from "./DicomImportPanel";
import { Loader2, Search, ScanLine, ExternalLink, MonitorPlay, HardDrive } from "lucide-react";

// DICOM Viewer module — the study archive of this facility: study and series
// metadata, authorized short-lived access to the stored DICOM files, and the
// two viewer paths (the facility's embedded OHIF deployment, or RadiAnt on a
// workstation). Launch URLs are built server-side from the facility's
// configured template; when nothing is configured the portal says so instead
// of guessing a viewer address.
export default function ViewerModule({ role, onImported, mode }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [launchMessage, setLaunchMessage] = useState("");
  const [launching, setLaunching] = useState("");

  const load = useCallback(async (term) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("radiologyPortal", { action: "studies", search: term });
      setStudies(res.data?.studies || []);
    } catch (err) {
      setStudies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 350);
    return () => clearTimeout(timer);
  }, [search, load]);

  const openStudy = async (studyId) => {
    setDetailLoading(true);
    setLaunchMessage("");
    try {
      const res = await base44.functions.invoke("radiologyPortal", { action: "study_detail", study_id: studyId });
      setDetail(res.data);
    } catch (err) {
      toast({ title: "Could not open the study", description: err.response?.data?.error || err.message, variant: "destructive" });
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const launch = async (viewer) => {
    if (!detail?.study) return;
    setLaunching(viewer);
    setLaunchMessage("");
    try {
      const res = await base44.functions.invoke("radiologyPortal", {
        action: "viewer_launch",
        study_id: detail.study.id,
        viewer,
      });
      const data = res.data || {};
      if (data.launch_url) {
        window.open(data.launch_url, "_blank", "noopener,noreferrer");
      } else {
        setLaunchMessage(data.message || "This viewer is not configured for the facility yet.");
      }
    } catch (err) {
      setLaunchMessage(err.response?.data?.error || err.message);
    } finally {
      setLaunching("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, CIN, accession number or Study Instance UID"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : studies.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center">
          <HardDrive className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">
            No studies archived for this facility yet. Import DICOM files below, or connect the facility PACS.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {studies.map((s) => (
            <button
              key={s.id}
              onClick={() => openStudy(s.id)}
              className={`text-left rounded-xl border p-3 transition-colors ${
                detail?.study?.id === s.id ? "border-portal-radiology bg-secondary/50" : "border-border bg-card hover:bg-secondary/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm truncate">{s.patient_name}</p>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-secondary">{s.modality || "—"}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.patient_cin || "No CIN"} · {s.study_date || "date not recorded"}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {s.series_count || 0} series · {s.image_count || 0} images · {s.status}
              </p>
            </button>
          ))}
        </div>
      )}

      {detailLoading && <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}

      {detail?.study && !detailLoading && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{detail.study.patient_name}</h2>
              <p className="text-xs text-muted-foreground">
                {detail.study.modality} · {detail.study.study_description || "No description"} ·{" "}
                {detail.study.study_date || "date not recorded"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 break-all">
                Study UID {detail.study.study_instance_uid}
                {detail.study.accession_number ? ` · Accession ${detail.study.accession_number}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => launch("ohif")} disabled={launching === "ohif"}>
                {launching === "ohif" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <MonitorPlay className="w-4 h-4 mr-1.5" />}
                Open in embedded viewer
              </Button>
              <Button size="sm" variant="outline" onClick={() => launch("radiant")} disabled={launching === "radiant"}>
                {launching === "radiant" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-1.5" />}
                Open in RadiAnt
              </Button>
            </div>
          </div>

          {launchMessage && (
            <p className="mt-3 text-xs rounded-md border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5 text-[hsl(var(--warning))] px-3 py-2">
              {launchMessage}
            </p>
          )}

          <div className="mt-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Series ({detail.series?.length || 0})
            </h3>
            {(detail.series || []).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs border border-border rounded-lg px-3 py-2">
                <span>
                  <strong>{s.modality || detail.study.modality}</strong>
                  {s.series_description ? ` — ${s.series_description}` : ""}
                  {s.series_number != null ? ` · series ${s.series_number}` : ""}
                </span>
                <span className="text-muted-foreground">{s.sop_instance_count || 0} images</span>
              </div>
            ))}
          </div>

          {detail.files?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Stored DICOM files (5-minute secure links)
              </h3>
              <div className="flex flex-wrap gap-2">
                {detail.files.map((f, i) => (
                  <a
                    key={i}
                    href={f.url || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[11px] px-2 py-1 rounded border border-border ${f.url ? "hover:bg-secondary" : "opacity-50 pointer-events-none"}`}
                  >
                    {f.file_name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(role === "technician" || role === "administrator") && <DicomImportPanel mode={mode} onImported={onImported} />}
    </div>
  );
}