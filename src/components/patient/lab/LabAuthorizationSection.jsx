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
import LabCard from "@/components/patient/lab/LabCard";
import SelectedLabCard from "@/components/patient/lab/SelectedLabCard";
import { Building2, Loader2, Search, ShieldCheck } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function LabAuthorizationSection({ request, onAuthorized }) {
  const { t } = usePatientLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  // Real-time search — results update automatically as the patient types,
  // matching by laboratory name or A&M Lab Number. No search button needed.
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
        setError(err.response?.data?.error || err.message || t("Laboratory search failed."));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(err.response?.data?.error || err.message || t("Failed to authorize the laboratory."));
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-sm font-semibold flex items-center gap-1.5">
        <Building2 className="w-4 h-4 text-primary" />
        {t("Select Laboratory")}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {t("The laboratory only receives this request after you select it and explicitly allow access.")}
      </p>

      {!selectedLab ? (
        <>
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <Input
              placeholder={t("Search by laboratory name or A&M Lab Number...")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 rtl:pl-3 rtl:pr-9"
            />
          </div>
          {searching && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> {t("Searching laboratories...")}
            </p>
          )}
          {!searching && results.length > 0 && (
            <div className="mt-3 space-y-2">
              {results.map((lab) => (
                <LabCard key={lab.id} lab={lab} onSelect={setSelectedLab} />
              ))}
            </div>
          )}
          {!searching && query.trim().length >= 1 && results.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {t('No registered laboratories match "{query}".', { query: query.trim() })}
            </p>
          )}
        </>
      ) : (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <SelectedLabCard lab={selectedLab} />
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={submitting} className="gap-1.5">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {t("Allow Laboratory to View Request")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("Allow Laboratory Access?")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      "You are giving {lab} (A&M Lab Number {number}) permission to view this laboratory request and the information required to perform the requested tests.",
                      { lab: selectedLab.lab_name, number: selectedLab.lab_number || "—" }
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-end gap-2">
                  <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                  <Button onClick={handleAllow} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t("Yes, Allow")}
                  </Button>
                </div>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm" onClick={() => setSelectedLab(null)}>
              {t("Change")}
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}