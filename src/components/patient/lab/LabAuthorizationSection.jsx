import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Building2, Loader2, MapPin, Search, ShieldCheck } from "lucide-react";

export default function LabAuthorizationSection({ request, onAuthorized }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke("searchLaboratories", { query: q });
        setResults(res.data.laboratories || []);
        setError("");
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Laboratory search failed.");
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleAllow = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await base44.functions.invoke("authorizeLabRequest", {
        lab_request_id: request.id,
        lab_id: selectedLab.id,
      });
      onAuthorized?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to authorize the laboratory.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-sm font-semibold flex items-center gap-1.5">
        <Building2 className="w-4 h-4 text-primary" />
        Select Laboratory
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        The laboratory only receives this request after you select it and explicitly allow access.
      </p>

      {!selectedLab ? (
        <>
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Type a laboratory name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {searching && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Searching laboratories...
            </p>
          )}
          {!searching && results.length > 0 && (
            <div className="mt-2 rounded-lg border border-border divide-y divide-border overflow-hidden">
              {results.map((lab) => (
                <div key={lab.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{lab.lab_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Lab ID: {lab.lab_number || "—"}</p>
                    {lab.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" /> {lab.address}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedLab(lab)}>
                    Select
                  </Button>
                </div>
              ))}
            </div>
          )}
          {!searching && query.trim().length >= 1 && results.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">No laboratories match "{query.trim()}".</p>
          )}
        </>
      ) : (
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm font-medium">Selected Laboratory: {selectedLab.lab_name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Lab ID: {selectedLab.lab_number || "—"}</p>
          {selectedLab.address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {selectedLab.address}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={submitting} className="gap-1.5">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Allow Laboratory to View Request
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Allow Laboratory Access?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are giving {selectedLab.lab_name} permission to view this laboratory request and the
                    information required to perform the requested tests.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button onClick={handleAllow} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Yes, Allow
                  </Button>
                </div>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm" onClick={() => setSelectedLab(null)}>
              Change
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}