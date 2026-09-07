import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { getTests, groupTestsByCategory, normalizeLabStatus } from "@/lib/labRequestUtils";
import { FlaskConical, FileText, CheckCircle2, Upload, Building2, Loader2 } from "lucide-react";

export default function LabRequestCard({ lab, onUpdate }) {
  const [resultOpen, setResultOpen] = useState(false);
  const [resultText, setResultText] = useState("");
  const [busy, setBusy] = useState(false);
  const status = normalizeLabStatus(lab.status);
  const categories = useMemo(() => groupTestsByCategory(getTests(lab)), [lab]);
  const today = new Date().toISOString().slice(0, 10);

  const update = async (data) => {
    setBusy(true);
    try {
      await base44.entities.LabRequest.update(lab.id, data);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const saveResults = async (fileUrl) => {
    const data = { status: "results", date_completed: today };
    if (resultText.trim()) data.result = resultText;
    if (fileUrl) data.result_file_url = fileUrl;
    await update(data);
    setResultOpen(false);
    setResultText("");
  };

  const attachResultFile = async (file) => {
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await saveResults(file_url);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium">Lab Request{lab.request_id ? ` · ${lab.request_id}` : ""}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{lab.patient_name} · CIN: {lab.patient_cin}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
            <span>Requested: {lab.date_requested}</span>
            {lab.lab_name && (
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{lab.lab_name}</span>
            )}
            <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3" />{categories.reduce((a, [, n]) => a + n.length, 0)} test(s)</span>
          </p>
        </div>
        <LabStatusBadge status={lab.status} />
      </div>

      <div className="mt-3 pt-3 border-t border-border space-y-2">
        {categories.map(([category, names]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category}</p>
            <p className="text-sm">{names.join(", ")}</p>
          </div>
        ))}
      </div>

      {(lab.indication || lab.instructions || lab.clinical_info) && (
        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
          {lab.indication && <p>Indication: {lab.indication}</p>}
          {lab.clinical_info && <p>Clinical information: {lab.clinical_info}</p>}
          {lab.instructions && <p>Instructions: {lab.instructions}</p>}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
        {lab.pdf_url && (
          <a href={lab.pdf_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-1" />
              Request PDF
            </Button>
          </a>
        )}
        {status === "requested" && (
          <Button size="sm" variant="outline" onClick={() => update({ status: "pending" })} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
            Confirm Lab Receipt
          </Button>
        )}
        {status !== "results" && (
          <Button size="sm" variant="outline" onClick={() => setResultOpen(!resultOpen)} disabled={busy}>
            <Upload className="w-4 h-4 mr-1" />
            Enter Results
          </Button>
        )}
      </div>

      {resultOpen && (
        <div className="mt-3 p-3 rounded-lg bg-muted space-y-2">
          <Textarea
            placeholder="Enter or paste the laboratory results..."
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => saveResults()} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              Save Results
            </Button>
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm border border-border hover:bg-accent">
                <Upload className="w-4 h-4 mr-1" />
                Attach Result File
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files[0] && attachResultFile(e.target.files[0])}
              />
            </label>
            <Button size="sm" variant="ghost" onClick={() => setResultOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {status === "results" && (lab.result || lab.result_file_url) && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          {lab.result && <p className="text-sm text-emerald-800 whitespace-pre-wrap">{lab.result}</p>}
          {lab.result_file_url && (
            <a
              href={lab.result_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 underline mt-2 inline-block"
            >
              View result file
            </a>
          )}
        </div>
      )}
    </div>
  );
}