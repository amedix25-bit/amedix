import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FacilityPicker from "@/components/FacilityPicker";
import { Building2 } from "lucide-react";

// Doctor's destination-laboratory chooser for lab requests — a searchable list
// of officially registered laboratories, each with its logo and address.
export default function LaboratorySelect({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(!value);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke("searchLaboratories", { query: query.trim() });
        setResults(res.data.laboratories || []);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-1.5">
      <Label>Laboratory *</Label>
      {value && !open ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{value}</p>
              <p className="text-xs text-muted-foreground">Destination laboratory</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Change
          </Button>
        </div>
      ) : (
        <FacilityPicker
          items={(results || []).map((l) => ({
            id: l.id,
            name: l.lab_name,
            lab_name: l.lab_name,
            subtitle: l.lab_number ? `A&M Lab Number: ${l.lab_number}` : "",
            logo_url: l.logo_url,
            address: l.address,
          }))}
          loading={loading}
          placeholder="Search by laboratory name or A&M Lab Number..."
          emptyText="No registered laboratories match your search."
          query={query}
          onQueryChange={setQuery}
          onSelect={(lab) => {
            onChange(lab);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}