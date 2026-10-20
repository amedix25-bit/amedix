import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGE_LABELS, STAGE_CHIP, STAGE_ORDER, canonicalStage } from "@/lib/radiologyWorkflow";
import DepartmentRequestDialog from "./DepartmentRequestDialog";
import { Loader2, Search, ClipboardList, AlertTriangle, Paperclip, FilterX } from "lucide-react";

const MODALITIES = ["X-Ray", "CT", "MRI", "Ultrasound", "Mammography", "Other"];
const PRIORITIES = ["Routine", "Urgent", "Emergency"];

// Central, searchable, filterable worklist for the entire radiology
// department — every study routed to this facility, with scheduling,
// examination, image availability, assignment and reporting status.
export default function DepartmentWorklist({ mode, initialFilter }) {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    status: initialFilter?.status || "",
    priority: initialFilter?.priority || "",
    modality: initialFilter?.modality || "",
    assigned: initialFilter?.assigned || "",
    overdue: !!initialFilter?.overdue,
    date_from: initialFilter?.date_from || "",
    date_to: initialFilter?.date_to || "",
    search: initialFilter?.search || "",
  });
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [claiming, setClaiming] = useState("");

  const load = useCallback(async (f) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(f).filter(([, v]) => v !== "" && v !== false && v != null)
      );
      const res = await base44.functions.invoke("radiologyDepartmentWorklist", payload);
      setData(res.data);
    } catch (err) {
      setData({ counts: {}, worklist: [] });
      toast({
        title: "Could not load the department worklist",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => load(filters), 350);
    return () => clearTimeout(timer);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));

  const claim = async (item) => {
    setClaiming(item.id);
    try {
      await base44.functions.invoke("radiologyDepartmentManage", { request_id: item.id, action: "claim" });
      toast({ title: "Study claimed", description: `${item.request_id} is now assigned to you.` });
      load(filters);
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

  const isRadiologist = mode === "radiologist";
  const canClaim = (item) =>
    isRadiologist &&
    !item.assigned_radiologist_user_id &&
    ["ready_for_reporting", "performed"].includes(item.stage);

  return (
    <div className="space-y-4">
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
            <Label className="text-xs">Status</Label>
            <Select value={filters.status} onValueChange={set("status")}>
              <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-none">All statuses</SelectItem>
                {STAGE_ORDER.map((s) => (<SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>))}
              </SelectContent>
            </Select>
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
            <Label className="text-xs">Assignment</Label>
            <Select value={filters.assigned} onValueChange={set("assigned")}>
              <SelectTrigger><SelectValue placeholder="All studies" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-none">All studies</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
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
              variant={filters.overdue ? "destructive" : "outline"}
              size="sm"
              className="w-full"
              onClick={() => set("overdue")(!filters.overdue)}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Overdue only
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setFilters({ status: "", priority: "", modality: "", assigned: "", overdue: false, date_from: "", date_to: "", search: "" })}
            >
              <FilterX className="w-4 h-4 mr-1" />
              Clear filters
            </Button>
          </div>
        </div>
      </div>

      {/* Worklist */}
      {data === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading the worklist...
        </div>
      ) : data.worklist.length === 0 ? (
        <div className="rounded-xl border border-border bg-card text-center py-12 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No imaging requests match this view.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {data.worklist.map((item) => (
            <div key={item.id} className="p-4 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {item.patient_name}{" "}
                    <span className="text-muted-foreground font-normal">· {item.patient_cin}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.request_id} · {item.scan_type} — {item.examination}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Referring: Dr. {item.doctor_name} · {item.doctor_hospital} ·{" "}
                    {item.request_datetime ? new Date(item.request_datetime).toLocaleString() : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Assigned: {item.assigned_radiologist_name || "Unassigned"}
                    {item.images_count > 0 && ` · ${item.images_count} image file(s) attached`}
                    {item.has_report && " · report submitted"}
                    {item.updated_datetime && ` · last update ${new Date(item.updated_datetime).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STAGE_CHIP[item.stage] || "bg-secondary"}`}>
                    {STAGE_LABELS[item.stage]}
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
                </div>
              </div>
              {item.clarification_request && (
                <p className="text-xs text-orange-600">
                  Clarification requested: {item.clarification_request}
                  {item.clarification_response ? ` — responded: ${item.clarification_response}` : " — awaiting the doctor's response"}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {canClaim(item) && (
                  <Button
                    size="sm"
                    disabled={claiming === item.id}
                    onClick={() => claim(item)}
                  >
                    {claiming === item.id && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    Claim Study
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setOpenId(item.id)}>
                  Details & Actions
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {openId && (
        <DepartmentRequestDialog
          requestId={openId}
          mode={mode}
          onClose={() => setOpenId(null)}
          onChanged={() => load(filters)}
        />
      )}
    </div>
  );
}