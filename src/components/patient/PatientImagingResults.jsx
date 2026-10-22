import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Image as ImageIcon, Loader2, ScanLine, Send } from "lucide-react";
import SendImagingResultToDoctor from "@/components/patient/SendImagingResultToDoctor";
import DepartmentFlowResults from "@/components/patient/DepartmentFlowResults";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";

// Patient Portal → Imaging → View Results.
// Each completed imaging result is displayed under the radiologist's name:
// the finalized PDF imaging report, plus a clear "View Image" button for the
// actual completed imaging study images associated with that report.
export default function PatientImagingResults({ request, onBack }) {
  const { t } = usePatientLanguage();
  const [items, setItems] = useState(null);
  const [sendForId, setSendForId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await base44.entities.ImagingResult.filter(
          { imaging_request_id: request.id },
          "-created_datetime"
        );
        setItems(list);
      } catch (err) {
        console.error(err);
        setItems([]);
      }
    };
    load();
  }, [request?.id]);

  const groups = [];
  const map = new Map();
  (items || []).forEach((r) => {
    const key = r.radiologist_name || t("Radiologist");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  map.forEach((results, radiologistName) => groups.push({ radiologistName, results }));

  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("Back to Imaging")}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-medium">{t(request.scan_type)} — {request.examination}</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("Requested by Dr.")}{request.doctor_name} · {request.date_requested}
          {request.request_id ? ` · ${t("Ref:")} ${request.request_id}` : ""}
        </p>
      </div>

      {items === null ? (
        <div className="flex items-center text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("Loading results...")}
        </div>
      ) : groups.length === 0 ? (
        <DepartmentFlowResults request={request} />
      ) : (
        groups.map(({ radiologistName, results }) => (
          <div key={radiologistName} className="space-y-3">
            <p className="font-semibold text-sm flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-primary" />
              {t("Radiologist:")} {radiologistName}
            </p>
            {results.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap gap-2">
                  <ClinicalFileButton kind="imaging_result" id={r.id} fileRef={r.report_pdf_url} className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-medium">
                    <FileText className="w-4 h-4 mr-2" />
                    {t("Open Report (PDF)")}
                  </ClinicalFileButton>
                  {(r.images || []).map((img, i) => (
                    <ClinicalFileButton key={i} kind="imaging_result" id={r.id} fileRef={img.file_url} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 text-sm font-medium">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {(r.images || []).length > 1 ? `${t("View Image")} ${i + 1}` : t("View Image")}
                    </ClinicalFileButton>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setSendForId(sendForId === r.id ? null : r.id)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {t("Send to Doctor")}
                  </Button>
                </div>

                {sendForId === r.id && (
                  <SendImagingResultToDoctor patientId={request.patient_id} result={r} />
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  {t("Finalized")} {r.date_completed || ""}
                </p>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}