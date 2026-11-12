import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image as ImageIcon, FileText, ScanLine, Loader2 } from "lucide-react";
import PatientImagingResults from "@/components/patient/PatientImagingResults";
import { ResolvedFileButton } from "@/components/radiology/ResolvedFile";
import { capitalize } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { STAGE_LABELS, STAGE_CHIP, canonicalStage } from "@/lib/radiologyWorkflow";

// Patient Portal → Imaging. Each imaging record shows only two large options:
// View Request (opens the original request PDF) and View Results (opens the
// radiologist's finalized report PDF and study images).
export default function PatientImaging({ patientId }) {
  const { t, locale } = usePatientLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsRequest, setResultsRequest] = useState(null);

  useEffect(() => {
    load();
  }, [patientId]);

  const load = async () => {
    try {
      const data = await base44.entities.ImagingRequest.filter({ patient_id: patientId }, "-date_requested");
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (resultsRequest) {
    return <PatientImagingResults request={resultsRequest} onBack={() => setResultsRequest(null)} />;
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex items-center text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("Loading...")}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("No imaging requests")}</p>
        </div>
      ) : (
        items.map((img) => (
          <div key={img.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium">{t(img.scan_type)} — {img.examination}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("Requested by Dr.")}{img.doctor_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{img.date_requested}</p>
                {(img.scheduled_datetime || img.requested_date) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {img.scheduled_datetime
                      ? `${t("Scheduled")}: ${new Date(img.scheduled_datetime).toLocaleString(locale)}`
                      : `${t("Requested for")}: ${img.requested_date}`}
                  </p>
                )}
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  STAGE_CHIP[canonicalStage(img.workflow_status)] ||
                  (img.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
                }`}
              >
                {STAGE_LABELS[canonicalStage(img.workflow_status)] || t(capitalize(img.status || ""))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <ResolvedFileButton
                requestId={img.id}
                fileRef={img.pdf_url}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 text-primary py-5 text-sm font-semibold hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileText className="w-6 h-6" />
                {t("View Request")}
              </ResolvedFileButton>
              <button
                type="button"
                onClick={() => setResultsRequest(img)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-5 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <ScanLine className="w-6 h-6" />
                {t("View Results")}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}