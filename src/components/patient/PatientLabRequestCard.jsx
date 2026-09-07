import React from "react";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { normalizeLabStatus } from "@/lib/labRequestUtils";
import { Building2, FileText } from "lucide-react";

export default function PatientLabRequestCard({ group }) {
  const first = group[0];
  const consolidated = Array.isArray(first.tests) && first.tests.length > 0;

  const tests = consolidated
    ? first.tests
    : group.map((l) => ({ name: l.test_name, category: l.category }));
  const status = consolidated
    ? normalizeLabStatus(first.status)
    : normalizeLabStatus(group.every((l) => l.status === "completed") ? "results" : first.status);

  const result = consolidated
    ? first.result
    : group.map((l) => l.result).filter(Boolean).join("\n");
  const resultFile = consolidated
    ? first.result_file_url
    : (group.find((l) => l.result_file_url) || {}).result_file_url;

  const byCategory = new Map();
  tests.forEach((t) => {
    const key = t.category || "Other";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(t.name);
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            {consolidated
              ? `Lab Request${first.request_id ? ` · ${first.request_id}` : ""}`
              : `Lab Request — ${tests.length} test${tests.length > 1 ? "s" : ""}`}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">Requested by {first.doctor_name}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{first.date_requested}</span>
            {first.lab_name && (
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{first.lab_name}</span>
            )}
          </p>
        </div>
        <LabStatusBadge status={status === "results" ? "results" : status} />
      </div>

      <div className="mt-3 pt-3 border-t border-border space-y-2">
        {[...byCategory.entries()].map(([category, names]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category}</p>
            <p className="text-sm">{names.join(", ")}</p>
          </div>
        ))}
        {first.indication && (
          <p className="text-xs text-muted-foreground">Indication: {first.indication}</p>
        )}
        {first.instructions && (
          <p className="text-xs text-muted-foreground">Instructions: {first.instructions}</p>
        )}
      </div>

      {status === "results" && (result || resultFile) && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          {result && <p className="text-sm text-emerald-800 whitespace-pre-wrap">{result}</p>}
          {resultFile && (
            <a
              href={resultFile}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 underline mt-2 inline-block"
            >
              View result file
            </a>
          )}
        </div>
      )}

      {first.pdf_url && (
        <div className="mt-3 pt-3 border-t border-border">
          <a
            href={first.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary underline"
          >
            <FileText className="w-4 h-4" />
            Download request PDF
          </a>
        </div>
      )}
    </div>
  );
}