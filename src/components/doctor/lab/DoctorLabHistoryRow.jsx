import React from "react";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { getTests, groupTestsByCategory } from "@/lib/labRequestUtils";
import { ChevronRight, FileText, CheckCircle2, FileWarning } from "lucide-react";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";

export default function DoctorLabHistoryRow({ r, onOpen }) {
  const tests = getTests(r);
  const categories = groupTestsByCategory(tests);
  const names = categories.flatMap(([, list]) => list);
  const hasResults = r.status === "results" || !!r.result || !!r.result_file_url;

  return (
    <button
      onClick={() => onOpen(r)}
      className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{r.patient_name || "Unknown patient"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            CIN: {r.patient_cin || "-"}
            {r.request_id ? ` · ${r.request_id}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {r.priority && r.priority !== "Routine" && (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              {r.priority}
            </span>
          )}
          <LabStatusBadge status={r.status} />
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      {names.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1.5 truncate">
          {tests.length} test{tests.length !== 1 ? "s" : ""}: {names.slice(0, 4).join(", ")}
          {names.length > 4 ? ` +${names.length - 4} more` : ""}
        </p>
      )}
      {r.indication && <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.indication}</p>}
      <p className="text-xs text-muted-foreground mt-0.5">
        {r.date_requested || "-"}
        {r.doctor_name ? ` · ${r.doctor_name}` : ""}
        {r.doctor_hospital ? ` · ${r.doctor_hospital}` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-1.5">
        {hasResults && (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="w-3 h-3" /> Results available
          </span>
        )}
        {r.result_verified && (
          <span className="text-xs text-emerald-600">Verified{r.verified_by_name ? ` by ${r.verified_by_name}` : ""}</span>
        )}
        {r.corrected_result_file_url && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <FileWarning className="w-3 h-3" /> Corrected result on file
          </span>
        )}
        {r.pdf_url && (
          <ClinicalFileButton
            kind="lab_request"
            id={r.id}
            fileRef={r.pdf_url}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs font-medium hover:bg-accent"
            title="Open Laboratory Request PDF"
          >
            <FileText className="w-3 h-3" /> PDF
          </ClinicalFileButton>
        )}
      </div>
    </button>
  );
}