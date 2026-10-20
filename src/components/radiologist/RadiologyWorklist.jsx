import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGE_LABELS, STAGE_CHIP } from "@/lib/radiologyWorkflow";
import StudyReviewScreen from "@/components/radiologist/review/StudyReviewScreen";
import {
  Loader2, ClipboardList, Search, AlertTriangle, FilterX, Hand, FileEdit, Lock, Unlock,
} from "lucide-react";

const MODALITIES = ["X-Ray", "CT", "MRI", "Ultrasound", "Mammography", "Other"];
const PRIORITIES = ["Routine", "Urgent", "Emergency"];
const VIEW_TABS = [
  ["mine", "My Assigned"],
  ["available", "Available"],
  ["in_progress", "In Progress"],
  ["drafts", "Draft Reports"],
  ["awaiting_signature", "Awaiting Signature"],
  ["completed", "Completed"],
  ["urgent", "Urgent"],
  ["overdue", "Overdue"],
  ["critical", "Critical Awaiting"],
];
const REPORTABLE = ["ready_for_reporting", "performed", "examination_completed"];

const DEFAULT_FILTERS = {
  search: "", modality: "", body_region: "", priority: "", facility: "",
  date_from: "", date_to: "", reporting_status: "",
};

// Radiologist worklist (Phase 4.2) — one workflow, eight views, server-side
// filters. Opening a study shows exactly who owns it: unassigned, assigned to
// you, assigned to another radiologist, or already finalized.
export default function RadiologyWorklist({ radiologistProfile, user, initialView }) {
  const { toast } = useToast();
  const [view, setView] = useState(initialView?.view || "mine");
  const [completedToday, setCompletedToday] = useState(!!initialView?.completedToday);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [claiming, setClaiming] = useState("");

  useEffect(() => {
    if (initialView) {
      setView(initialView.view || "mine");
      setCompletedToday(!!initialView.completedToday);
      setSelectedId(null);
    }
  }, [initialView]);

  const load = useCallback(async () => {
    try {
      const payload = Object.fromEntries(
        Object.entries({ view, completed_today: completedToday, ...filters })
          .filter(([, v]) => v !== "" && v !== false && v != null)
      );
      const res = await base44.functions.invoke("radiologyGetWorklist", payload);
      setData(res.data);
    } catch (err) {
      setData({ counts: {}, worklist: [], facilities: [] });
      toast({
        title: "Could not load the worklist",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  }, [view, completedToday, JSON.stringify(filters), toast]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));

  const claim = async (item) => {
    setClaiming(item.id);
    try {
      await base44.functions.invoke("radiologyUpdateWorkflowStatus", {
        request_id: item.id,
        action: "claim_study",
      });
      toast({ title: "Study claimed", description: `${item.request_id} is now assigned to you.` });
      load();
    } catch (err) {
      toast({
        title: "Claim failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setClaiming("");
    }
  };

  if (selectedId) {
    return (
      <StudyReviewScreen
        requestId={selectedId}
        user={user}
        radiologistProfile={radiologistProfile}
        onBack={() => setSelectedId(null)}
        onChanged={load}
      />
    );
  }

  const counts = data?.counts || {};

  return (
    <div className="space-y-4">
      {/* View tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {VIEW_TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => { if (key === "completed") { setCompletedToday(false); } setView(key); }}
            className={`shrink-0 px-3 py-2 rounded-lg text-sm border transition-colors ${
              view === key ? "bg-primary text-primary-foreground border-primary font-medium" : "bg-card border-border hover:bg-accent"
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs tabular-nums ${view === key ? "opacity-80" : "text-muted-foreground"}`}>
              {counts[key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => set("search")(e.target.value)}
            placeholder="Search patient name, CIN, or request ID..."
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Modality</Label>
            <Select value={filters.modality} onValueChange={set("modality")}>
              <SelectTrigger><SelectValue placeholder="All modalities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-none">All modalities</SelectItem>
                {MODALITIES.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body Region</Label>
            <Input value={filters.body_region} onChange={(e) => set("body_region")(e.target.value)} placeholder="e.g. Chest" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select value={filters.priority} onValueChange={set("priority")}>
              <SelectTrigger><SelectValue placeholder="All priorities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-none">All priorities</SelectItem>
                <SelectItem value="Urgent/Emergency">Urgent & Emergency</SelectItem>
                {PRIORITIES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Facility</Label>
            <Select value={filters.facility} onValueChange={set("facility")}>
              <SelectTrigger><SelectValue placeholder="All facilities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-none">All facilities</SelectItem>
                {(data?.facilities || []).map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reporting Status</Label>
            <Select value={filters.reporting_status} onValueChange={set("reporting_status")}>
              <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-none">All statuses</SelectItem>
                <SelectItem value="not_started">Not started</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input type="date" value={filters.date_from} onChange={(e) => set("date_from")(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input type="date" value={filters.date_to} onChange={(e) => set("date_to")(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => { setFilters(DEFAULT_FILTERS); setCompletedToday(false); }}
            >
              <FilterX className="w-4 h-4 mr-1" /> Clear filters
            </Button>
          </div>
        </div>
        {view === "completed" && (
          <Button
            size="sm"
            variant={completedToday ? "default" : "outline"}
            onClick={() => setCompletedToday(!completedToday)}
          >
            Today only
          </Button>
        )}
      </div>

      {/* Worklist */}
      {data === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading the worklist...
        </div>
      ) : data.worklist.length === 0 ? (
        <div className="rounded-xl border border-border bg-card text-center py-12 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No studies in this view.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {data.worklist.map((item) => {
            const claimable = item.ownership === "unassigned" && REPORTABLE.includes(item.stage);
            return (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {item.patient_name}{" "}
                      <span className="text-muted-foreground font-normal">· {item.patient_cin}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.request_id} · {item.scan_type} — {item.examination}
                      {item.body_part ? ` (${item.body_part})` : ""}
                      {item.images_count > 0 && ` · ${item.images_count} image file(s)`}
                      {item.has_draft && <span className="text-amber-600 font-medium"> · draft saved</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Referring: Dr. {item.doctor_name} · {item.routed_hospital || item.doctor_hospital} ·{" "}
                      {item.request_datetime ? new Date(item.request_datetime).toLocaleString() : ""}
                    </p>
                    {item.reporting_since && (
                      <p className="text-xs text-purple-600 mt-0.5 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {item.ownership === "mine"
                          ? `You started reporting ${new Date(item.reporting_since).toLocaleString()}`
                          : `${item.assigned_radiologist_name} is reporting since ${new Date(item.reporting_since).toLocaleString()}`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STAGE_CHIP[item.stage] || "bg-secondary"}`}>
                      {STAGE_LABELS[item.stage]}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.ownership === "mine" ? "bg-teal-500/15 text-teal-700"
                      : item.ownership === "finalized" ? "bg-emerald-500/15 text-emerald-700"
                      : item.ownership === "other" ? "bg-purple-500/15 text-purple-700"
                      : "bg-amber-500/15 text-amber-700"}`}>
                      {item.ownership === "mine" ? "Yours"
                        : item.ownership === "finalized" ? "Finalized"
                        : item.ownership === "other" ? `Dr. ${item.assigned_radiologist_name}`
                        : "Unassigned"}
                    </span>
                    {item.priority !== "Routine" && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-600">
                        {item.priority}
                      </span>
                    )}
                    {item.is_critical && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive text-destructive-foreground flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> CRITICAL
                      </span>
                    )}
                    {item.is_overdue && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-500/10 text-red-600">
                        OVERDUE
                      </span>
                    )}
                    {item.authorized_by_patient && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> authorized by patient
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {claimable && (
                    <Button size="sm" disabled={claiming === item.id} onClick={() => claim(item)}>
                      {claiming === item.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Hand className="w-4 h-4 mr-1" />}
                      Claim Study
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setSelectedId(item.id)}>
                    {item.has_draft && <FileEdit className="w-4 h-4 mr-1" />}
                    Open Review
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}