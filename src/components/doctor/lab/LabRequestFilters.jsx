import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function LabRequestFilters({ query, onQueryChange, status, onStatusChange, date, onDateChange }) {
  return (
    <div className="grid sm:grid-cols-3 gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patient name or CIN..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="requested">Requested</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="results">Results available</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
      />
    </div>
  );
}