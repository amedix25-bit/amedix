import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import WorklistSummary from "@/components/radiologist/worklist/WorklistSummary";
import WorklistCategories from "@/components/radiologist/worklist/WorklistCategories";
import WorklistFilters from "@/components/radiologist/worklist/WorklistFilters";
import WorklistTable from "@/components/radiologist/worklist/WorklistTable";
import ImagingCaseScreen from "@/components/radiologist/case/ImagingCaseScreen";

const DEFAULT_FILTERS = {
  search: "", facility: "", modality: "", body_region: "", priority: "",
  ordering_doctor: "", reporting_status: "", date_from: "", date_to: "",
};

// Dashboard card / legacy view → worklist category + filters.
const LEGACY_MAP = {
  available: { category: "ready_for_interpretation" },
  mine: { category: "all" },
  in_progress: { category: "in_progress" },
  drafts: { category: "all", reporting_status: "in_progress" },
  awaiting_signature: { category: "awaiting_signature" },
  completed: { category: "completed" },
  urgent: { category: "all", priority: "Urgent/Emergency" },
  overdue: { category: "all" },
  critical: { category: "all" },
};

// Radiology Worklist — the department's shared queue, filtered server-side to
// the studies this radiologist is authorized for (patient authorization,
// direct assignment or their own facilities).
export default function RadiologyWorklist({ radiologistProfile, user, initialView, initialFacility }) {
  const { toast } = useToast();
  const [category, setCategory] = useState(
    initialView?.view ? LEGACY_MAP[initialView.view]?.category || "all" : "all"
  );
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    ...(initialView?.view ? LEGACY_MAP[initialView.view] || {} : {}),
    facility: initialFacility || "",
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [claiming, setClaiming] = useState("");

  useEffect(() => {
    if (!initialView?.view) return;
    const mapped = LEGACY_MAP[initialView.view] || { category: "all" };
    setCategory(mapped.category || "all");
    setFilters((f) => ({ ...DEFAULT_FILTERS, ...mapped, facility: f.facility }));
    setSelectedId(null);
  }, [initialView]);

  useEffect(() => {
    setFilters((f) => ({ ...f, facility: initialFacility || "" }));
  }, [initialFacility]);

  const load = useCallback(async () => {
    try {
      const payload = Object.fromEntries(
        Object.entries({ category, ...filters }).filter(([, v]) => v !== "" && v != null)
      );
      const res = await base44.functions.invoke("radiologyGetWorklist", payload);
      setData(res.data);
    } catch (err) {
      setData({ counts: {}, summary: {}, worklist: [], facilities: [], modalities: [] });
      toast({
        title: "Could not load the worklist",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [category, JSON.stringify(filters), toast]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  // Live updates — the department queue stays accurate as studies move
  // through the workflow anywhere in the portal.
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const unsubscribe = base44.entities.ImagingRequest.subscribe((event) => {
      if (event.type === "create" || event.type === "update") loadRef.current();
    });
    return unsubscribe;
  }, []);

  const claim = async (item) => {
    setClaiming(item.id);
    try {
      await base44.functions.invoke("radiologyUpdateWorkflowStatus", { request_id: item.id, action: "claim_study" });
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
      <ImagingCaseScreen
        requestId={selectedId}
        user={user}
        radiologistProfile={radiologistProfile}
        onBack={() => setSelectedId(null)}
        onChanged={load}
      />
    );
  }

  const onSummary = (card) => {
    if (card.target === "urgent") {
      setCategory("all");
      setFilters((f) => ({ ...f, priority: "Urgent/Emergency" }));
    } else {
      setCategory(card.target);
    }
  };

  return (
    <div className="space-y-4">
      <WorklistSummary summary={data?.summary || {}} activeCategory={category} onSelect={onSummary} />
      <WorklistCategories counts={data?.counts || {}} active={category} onChange={setCategory} />
      <WorklistFilters
        filters={filters}
        options={data || {}}
        onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        onReset={() => setFilters({ ...DEFAULT_FILTERS, facility: initialFacility || "" })}
      />
      <WorklistTable
        rows={data?.worklist || []}
        loading={loading && !data}
        claiming={claiming}
        onOpen={setSelectedId}
        onClaim={claim}
      />
      {data?.total_accessible !== undefined && (
        <p className="text-[11px] text-muted-foreground">
          {data.worklist.length} case(s) in this view of {data.total_accessible} studies you are authorized for.
        </p>
      )}
    </div>
  );
}