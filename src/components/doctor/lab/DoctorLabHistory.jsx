import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import DoctorLabHistoryRow from "@/components/doctor/lab/DoctorLabHistoryRow";
import { LAB_STATUS } from "@/lib/labRequestUtils";
import { Search, RotateCcw, ChevronDown, Loader2, FlaskConical } from "lucide-react";

const DEFAULT_FILTERS = { search: "", status: "all", from: "", to: "", test: "" };

export default function DoctorLabHistory({ doctorProfile }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const cursorRef = useRef(null);
  const hasMoreRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const load = useCallback(async (f, { append = false, cursor = null } = {}) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("doctorLabHistory", {
        search: f.search.trim(),
        status: f.status === "all" ? "" : f.status,
        from: f.from,
        to: f.to,
        test: f.test.trim(),
        limit: 25,
        cursor: cursor || undefined,
      });
      const data = res.data || {};
      cursorRef.current = data.next_cursor || null;
      hasMoreRef.current = !!data.has_more;
      setRequests((prev) => (append ? [...prev, ...(data.requests || [])] : data.requests || []));
    } catch (err) {
      console.error(err);
      if (!append) setRequests([]);
      setError("Could not load the request history. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Live reload while filters change — debounced so typing feels instant.
  const debounceRef = useRef();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(filters), 350);
    return () => clearTimeout(debounceRef.current);
  }, [filters, load]);

  const loadMore = () => {
    if (!cursorRef.current || loadingMore) return;
    load(filtersRef.current, { append: true, cursor: cursorRef.current });
  };

  const openRequest = (r) => navigate(`/doctor/lab-request/${r.id}`);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patient name, CIN or Request ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(LAB_STATUS).map(([key, s]) => (
                  <SelectItem key={key} value={key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Test name</Label>
            <Input
              placeholder="e.g. Hemoglobin"
              value={filters.test}
              onChange={(e) => setFilters({ ...filters, test: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Requested from</Label>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Requested to</Label>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            disabled={filters.search === "" && filters.status === "all" && !filters.from && !filters.to && !filters.test}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Clear filters
          </Button>
          {doctorProfile && (
            <p className="text-xs text-muted-foreground">
              Showing only requests you ordered as {doctorProfile.full_name}
            </p>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-10">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading requests...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <Button size="sm" variant="outline" className="ml-3" onClick={() => load(filters)}>Retry</Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No lab requests match your filters.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {requests.map((r) => (
              <DoctorLabHistoryRow key={r.id} r={r} onOpen={openRequest} />
            ))}
          </div>
          {hasMoreRef.current && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" /> Load more
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}