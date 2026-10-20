import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, ScanLine } from "lucide-react";
import { canonicalStage } from "@/lib/radiologyWorkflow";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Department-routed studies (Phase 8.2): the finalized report and study
// images live on the imaging request itself. Shown ONLY once the report is
// finalized/released — internal drafts and unreviewed AI-generated content
// are never exposed to the patient.
export default function DepartmentFlowResults({ request }) {
  const { t } = usePatientLanguage();
  const stage = canonicalStage(request.workflow_status);
  const released = ["final_report", "released"].includes(stage);
  const report = request.report || "";
  const images = request.image_file_urls || [];
  const followUpMatch = report.match(/Recommendations?:\s*([\s\S]*)/i);
  const followUp = followUpMatch ? followUpMatch[1].trim() : "";

  if (!released || (!report && images.length === 0)) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
        <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{t("No results yet")}</p>
        <p className="text-xs mt-1">
          {t("The finalized report and study images will appear here once completed.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-semibold text-emerald-700 uppercase">{t("Finalized Report")}</p>
        {report && <p className="text-sm whitespace-pre-wrap">{report}</p>}
        {request.report_file_url && (
          <a href={request.report_file_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              {t("Open Report (PDF)")}
            </Button>
          </a>
        )}
      </div>

      {followUp && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{t("Follow-up Instructions")}</p>
          <p className="text-sm whitespace-pre-wrap">{followUp}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t("Study Images")}</p>
          <div className="flex flex-wrap gap-2">
            {images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <Button>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {images.length > 1 ? `${t("View Image")} ${i + 1}` : t("View Image")}
                </Button>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}