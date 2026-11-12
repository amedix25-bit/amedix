import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGE_LABELS, STAGE_CHIP, canonicalStage } from "@/lib/radiologyWorkflow";
import { actionsForStage } from "./stageActions";
import { ResolvedFileButton } from "@/components/radiology/ResolvedFile";
import { Loader2, Search, AlertTriangle, FilterX, FileImage, FileText } from "lucide-react";

const MODALITIES = ["X-Ray", "CT", "MRI", "Ultrasound", "Mammography", "Other"];
const MODE_STAGES = {
  requests: ["requested", "under_review", "clarification_required", "scheduled"],
  worklist: ["accepted", "scheduled", "in_progress", "examination_completed", "images_awaiting_transfer", "ready_for_reporting", "reporting_in_progress", "awaiting_signature"],
};

// Imaging Requests (triage) and the Imaging Worklist (active studies) share
// this one searchable, filterable surface — patient name, CIN, modality,
// examination date, priority and report status — with the facility's own
// studies only, and the workflow stage actions the caller's role may perform.
export default function StudiesWorklist({ mode = "worklist", role = "radiologist" }) {
  const { toast } = useToast();
  const [filters, setFilters] = useState({ search: "", modality: "", priority: "", status: "", date_from: "", date_to: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async (f) => {
    setLoading(true);
    try {
      const payload = { action: "worklist", stages: f.status ? [f.status] : MODE_STAGES[mode] };
      Object.entries(f).forEach(([k, v]) => {
        if (v && k !== "status") payload[k] = v;
      });
      const res = await base44.functions.invoke("radiologyPortal", payload);
      setData(res.data);
    } catch (err) {
      setData({ worklist: [], stage_counts: {} });
      toast({ title: "Could not load studies", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [mode, toast]);

  useEffect(() => {
    const timer = setTimeout(() => load(filters), 350);
    return () => clearTimeout(timer);
  }, [filters, load]);

  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));

  const runAction = async (row, action) => {
    setBusy(`${row.id}:${action}`);
    try {
      await base44.functions.invoke("radiologyUpdateWorkflowStatus", { request_id: row.id, action });
      toast({ title: "Study updated", description: `${row.request_id} — ${STAGE_LABELS[canonicalStage(row.stage)] || row.stage}` });
      load(filters);
    } catch (err) {
      toast({
        title: "Could not update the study",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy("");
    }
  };

  const rows = data?.worklist || [];
  const counts = data?.stage_counts || {};

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <Label className="text-xs">Patient, CIN or request reference</Label>
            <div className="relative mt-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => set("search")(e.target.value)}
                placeholder="e.g. Aisha or CIN-000123"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Modality</Label>
            <Select value={filters.modality || "all"} onValueChange={(v) => set("modality")(v === "all" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="All modalities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modalities</SelectItem>
                {MODALITIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Priority</Label>
            <Select value={filters.priority || "all"} onValueChange={(v) => set("priority")(v === "all" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="All priorities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="Routine">Routine</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Stage / report status</Label>
            <Select value={filters.status || "all"} onValueChange={(v) => set("status")(v === "all" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="All stages" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {MODE_STAGES[mode].map((s) => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
                <SelectItem value="final_report">Report Finalized</SelectItem>
                <SelectItem value="released">Released</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Examination from</Label>
            <Input type="date" className="mt-1" value={filters.date_from} onChange={(e) => set("date_from")(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Examination to</Label>
            <Input type="date" className="mt-1" value={filters.date_to} onChange={(e) => set("date_to")(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setFilters({ search: "", modality: "", priority: "", status: "", date_from: "", date_to: "" })}
            >
              <FilterX className="w-4 h-4 mr-1.5" /> Clear filters
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {MODE_STAGES[mode].map((s) => (
            <span key={s} className="text-[11px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
              {STAGE_LABELS[s]}: <strong>{counts[s] || 0}</strong>
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-14 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-14 text-center">
          <FileImage className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No studies match these filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const actions = actionsForStage(row.stage, role);
            return (
              <div key={row.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{row.patient_name}</p>
                      {row.is_critical && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--critical))]/10 text-[hsl(var(--critical))] font-semibold">
                          CRITICAL
                        </span>
                      )}
                      {row.overdue && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] font-semibold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {row.patient_cin || "No CIN"} · {row.request_id || row.id}
                    </p>
                    <p className="text-xs mt-1">
                      {row.scan_type}{row.examination ? ` — ${row.examination}` : ""} · {row.priority}
                      {row.assigned_radiologist_name ? ` · ${row.assigned_radiologist_name}` : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Requested {row.request_datetime ? new Date(row.request_datetime).toLocaleString() : "—"}
                      {row.study_count > 0 ? ` · ${row.study_count} study file group(s)` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${STAGE_CHIP[row.stage] || "bg-secondary"}`}>
                      {STAGE_LABELS[row.stage] || row.stage}
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {row.pdf_url && (
                        <ResolvedFileButton
                          requestId={row.id}
                          fileRef={row.pdf_url}
                          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background shadow-sm hover:bg-accent h-8 px-3 text-xs font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" /> Request PDF
                        </ResolvedFileButton>
                      )}
                    </div>
                    {actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {actions.map((a) => (
                          <Button
                            key={a.action}
                            size="sm"
                            variant={a.variant || "default"}
                            disabled={busy === `${row.id}:${a.action}`}
                            onClick={() => runAction(row, a.action)}
                          >
                            {busy === `${row.id}:${a.action}` && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                            {a.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}