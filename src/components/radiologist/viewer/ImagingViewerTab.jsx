import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { STAGE_LABELS, STAGE_CHIP } from "@/lib/radiologyWorkflow";
import ImageViewer from "@/components/radiologist/review/ImageViewer";
import PacsOpenButton from "@/components/radiologist/review/PacsOpenButton";
import OhifWorkspace from "@/components/radiologist/viewer/OhifWorkspace";
import {
  Monitor, RefreshCw, Loader2, ShieldCheck, ImageOff, Server, ArrowLeft, Database, AlertTriangle,
} from "lucide-react";

// Imaging Viewer tab — opens the authorized study's examination in the
// facility's EXISTING imaging software (PACS / web viewer) when connected,
// or the in-app viewer for images stored in AMedix. The department-based
// workflow is unchanged: studies keep belonging to the facility's radiology
// department; this tab never reassigns or duplicates them.
export default function ImagingViewerTab({ user, radiologistProfile, onOpenReporting }) {
  const [studies, setStudies] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const load = async () => {
    setLoadError("");
    setStudies(null);
    try {
      const [mine, available] = await Promise.all([
        base44.functions.invoke("radiologyGetWorklist", { view: "mine" }),
        base44.functions.invoke("radiologyGetWorklist", { view: "available" }),
      ]);
      const byId = new Map();
      for (const row of [...(mine.data?.worklist || []), ...(available.data?.worklist || [])]) {
        byId.set(row.id, row);
      }
      const rows = [...byId.values()].sort((a, b) =>
        String(b.request_datetime || "").localeCompare(String(a.request_datetime || ""))
      );
      setStudies(rows);
    } catch (err) {
      setLoadError(err.response?.data?.error || err.message);
      setStudies([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openStudy = async (study) => {
    setSelected(study);
    setStatus(null);
    setStatusError("");
    setVerifyResult(null);
    try {
      const res = await base44.functions.invoke("radiologyPacsAccess", {
        action: "status",
        request_id: study.id,
      });
      setStatus(res.data);
    } catch (err) {
      setStatusError(err.response?.data?.error || err.message);
    }
  };

  const runVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await base44.functions.invoke("radiologyPacsAccess", {
        action: "verify",
        request_id: selected.id,
      });
      setVerifyResult(res.data);
    } catch (err) {
      setVerifyResult({ verified: false, message: err.response?.data?.error || err.message });
    } finally {
      setVerifying(false);
    }
  };

  const visible = (studies || []).filter(
    (s) => !onlyWithImages || s.images_count > 0
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyWithImages}
            onChange={(e) => setOnlyWithImages(e.target.checked)}
          />
          Only studies with images
        </label>
        <Button variant="outline" size="sm" onClick={load} disabled={studies === null}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {studies === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading your studies...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-4 items-start">
          {/* Study list */}
          <div className="rounded-xl border border-border bg-card divide-y divide-border max-h-[70vh] overflow-y-auto">
            {visible.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground text-center">
                No studies {onlyWithImages ? "with images " : ""}available to you yet.
              </p>
            )}
            {visible.map((s) => (
              <button
                key={s.id}
                onClick={() => openStudy(s)}
                className={`w-full text-left p-3 hover:bg-accent/50 ${selected?.id === s.id ? "bg-accent" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold truncate">{s.scan_type} — {s.examination}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STAGE_CHIP[s.stage] || "bg-secondary"}`}>
                    {STAGE_LABELS[s.stage]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {s.request_id} · {s.patient_name} · CIN {s.patient_cin}
                </p>
                <p className="text-xs mt-1 flex items-center gap-1.5">
                  {s.images_count > 0 ? (
                    <span className="text-emerald-600 font-medium">{s.images_count} image file(s)</span>
                  ) : (
                    <span className="text-muted-foreground">No images in AMedix yet</span>
                  )}
                </p>
              </button>
            ))}
          </div>

          {/* Study detail */}
          {!selected ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <Monitor className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <h3 className="font-semibold">Existing hospital imaging system</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select a study to open the authorized examination in the connected imaging system, or review images stored in AMedix.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => { setSelected(null); setStatus(null); }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to list
                </button>
                <Button variant="outline" size="sm" onClick={() => onOpenReporting && onOpenReporting(selected)}>
                  Return to reporting workspace
                </Button>
              </div>

              {/* Identity verification */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-bold">{selected.scan_type} — {selected.examination}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selected.request_id} · {selected.routed_hospital}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STAGE_CHIP[selected.stage] || "bg-secondary"}`}>
                    {STAGE_LABELS[selected.stage]}
                  </span>
                </div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                  <p><span className="text-muted-foreground">Patient:</span> {selected.patient_name}</p>
                  <p><span className="text-muted-foreground">CIN:</span> <span className="font-medium">{selected.patient_cin}</span></p>
                  <p className="sm:col-span-2">
                    <span className="text-muted-foreground">Study identifier:</span>{" "}
                    {status === null ? (
                      "checking..."
                    ) : status.study_instance_uid ? (
                      <span className="font-mono text-xs">{status.study_instance_uid}</span>
                    ) : (
                      <span className="text-amber-700">
                        no DICOM Study Instance UID recorded — the department must record it on the imaging request before
                        the imaging system can be opened to the right examination
                      </span>
                    )}
                  </p>
                  {status?.accession_number && (
                    <p className="sm:col-span-2">
                      <span className="text-muted-foreground">Accession number:</span>{" "}
                      <span className="font-mono text-xs">{status.accession_number}</span>
                    </p>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Patient and study identity checked against the AMedix imaging request before any images are opened.
                </p>
              </div>

              {statusError ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {statusError}
                </div>
              ) : status === null ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking image availability...
                </div>
              ) : (
                <>
                  {/* Availability */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      {status.amedix_images > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700">
                          <Database className="w-3.5 h-3.5" />
                          {status.amedix_images} image file(s) verified in AMedix
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          <ImageOff className="w-3.5 h-3.5" />
                          No images stored in AMedix
                        </span>
                      )}
                      {status.pacs?.enabled && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-sky-500/10 text-sky-700">
                          <Server className="w-3.5 h-3.5" />
                          Facility imaging system connected{status.pacs.vendor_name ? ` — ${status.pacs.vendor_name}` : ""}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {status.pacs?.enabled && status.pacs.mode !== "ohif_embedded" && (
                        <PacsOpenButton requestId={selected.id} pacsStatus={status.pacs} />
                      )}
                      {status.pacs?.enabled && status.pacs.dicomweb_configured && status.study_instance_uid && (
                        <Button variant="outline" size="sm" onClick={runVerify} disabled={verifying}>
                          {verifying ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1.5" />}
                          Verify on imaging system
                        </Button>
                      )}
                    </div>
                    {verifyResult && (
                      <p className={`text-xs rounded-md px-2.5 py-1.5 border ${verifyResult.verified ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                        {verifyResult.message}
                      </p>
                    )}
                    {!status.pacs?.enabled && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          This facility has not connected its imaging system yet. The hospital administrator connects it in the
                          Hospital Portal, Radiology Department tab, "Imaging System Connection", after confirming with the vendor:
                          the vendor and product name, whether it offers DICOMweb, a web viewer or an embedded OHIF deployment, the vendor-documented viewer
                          launch URL template ({`{study_instance_uid}`}, {`{accession_number}`}, {`{launch_token}`} placeholders), and
                          whether desktop software supports automatic study launching. Until then, review images stored in AMedix below.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Embedded OHIF workspace for facilities running their own approved OHIF deployment */}
                  {status.pacs?.enabled && status.pacs.mode === "ohif_embedded" && (
                    <OhifWorkspace requestId={selected.id} status={status} />
                  )}

                  {/* In-app viewer for AMedix-stored images */}
                  {status.amedix_images > 0 ? (
                    <ImageViewer images={status.image_file_urls} requestId={selected.id} />
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/40 py-10 text-center px-6">
                      <ImageOff className="w-9 h-9 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm font-medium">No images transferred into AMedix yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {status.pacs?.enabled
                          ? "Open the study in the facility imaging system above, or wait for the department to record the images."
                          : "The radiology department records the received study images here."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}