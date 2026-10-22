import React, { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Upload } from "lucide-react";
import VisitStatusBadge from "@/components/lab/VisitStatusBadge";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";

const MAX_FILE_BYTES = 3 * 1024 * 1024;

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VisitCard({ visit, busy, onAction }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast({
        title: "File too large",
        description: "Please upload a report up to 3 MB.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const b64 = await toBase64(file);
      await onAction(
        "labUploadResults",
        { visit_id: visit.id, file_b64: b64, file_name: file.name, file_type: file.type },
        "Results uploaded"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">{visit.patient_name}</p>
          <p className="text-xs text-muted-foreground">
            {visit.patient_cin} · {visit.request_ref || "Lab request"} · {visit.request_date || ""}
          </p>
        </div>
        <VisitStatusBadge status={visit.status} />
      </div>
      {visit.requested_tests && (
        <p className="text-xs text-muted-foreground">Requested tests: {visit.requested_tests}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {visit.status === "testing_pending" && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              onAction("labSetVisitStatus", { visit_id: visit.id, action: "tests_completed" }, "Tests marked completed")
            }
          >
            Mark Tests Completed
          </Button>
        )}
        {visit.status === "tests_completed" && (
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="application/pdf,image/jpeg,image/jpg,image/png"
              onChange={handleFile}
            />
            <Button size="sm" disabled={uploading || busy} onClick={() => fileRef.current && fileRef.current.click()}>
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
              UPLOAD RESULTS
            </Button>
          </>
        )}
        {visit.status === "results_uploaded" && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              onAction("labMarkResultsReady", { visit_id: visit.id }, "Results ready — the patient has been notified")
            }
          >
            RESULTS READY
          </Button>
        )}
        {visit.status === "patient_notified" && visit.result_file_url && (
          <ClinicalFileButton kind="lab_patient_visit" id={visit.id} fileRef={visit.result_file_url} className="inline-flex items-center gap-2 rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-medium">
            <FileText className="w-4 h-4 mr-1" />
            View Report
          </ClinicalFileButton>
        )}
      </div>
      {visit.results_ready_at && (
        <p className="text-xs text-muted-foreground">
          Results ready {new Date(visit.results_ready_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}