import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FilterX } from "lucide-react";
import { REPORTING_FILTER_OPTIONS } from "@/lib/radiologistWorklist";

const ALL = "all";
const PRIORITIES = ["Routine", "Urgent", "Emergency"];

function Picker({ label, value, onChange, options, placeholder, width = "" }) {
  return (
    <div className={`space-y-1 ${width}`}>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{placeholder}</SelectItem>
          {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// Advanced worklist filters — hospital, modality, body region, priority, date,
// ordering doctor and reporting status. All are applied server-side to the
// radiologist's authorized studies.
export default function WorklistFilters({ filters, options, onChange, onReset }) {
  const set = (key) => (value) => onChange(key, value);
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => set("search")(e.target.value)}
          placeholder="Search patient name, CIN or request ID..."
          className="pl-9 h-9"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        <Picker label="Hospital" value={filters.facility} onChange={set("facility")}
          options={(options.facilities || []).map((f) => [f, f])} placeholder="All hospitals" />
        <Picker label="Modality" value={filters.modality} onChange={set("modality")}
          options={(options.modalities || []).map((m) => [m, m])} placeholder="All modalities" />
        <Picker label="Body region" value={filters.body_region} onChange={set("body_region")}
          options={(options.body_regions || []).map((b) => [b, b])} placeholder="All regions" />
        <Picker label="Priority" value={filters.priority} onChange={set("priority")}
          options={[["Urgent/Emergency", "Urgent & Emergency"], ...PRIORITIES.map((p) => [p, p])]} placeholder="All priorities" />
        <Picker label="Ordering doctor" value={filters.ordering_doctor} onChange={set("ordering_doctor")}
          options={(options.ordering_doctors || []).map((d) => [d, d])} placeholder="All doctors" />
        <Picker label="Reporting status" value={filters.reporting_status} onChange={set("reporting_status")}
          options={REPORTING_FILTER_OPTIONS} placeholder="All statuses" />
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Study date from</Label>
          <Input type="date" className="h-9 text-xs" value={filters.date_from} onChange={(e) => set("date_from")(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Study date to</Label>
          <div className="flex gap-1.5">
            <Input type="date" className="h-9 text-xs" value={filters.date_to} onChange={(e) => set("date_to")(e.target.value)} />
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onReset} title="Clear filters">
              <FilterX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}