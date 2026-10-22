import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Loader2 } from "lucide-react";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";

export default function DoctorPatientLabResultsView({ patientId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // LOINC codes resolved from the TerminologyCode catalog — shown beside each
  // test type (standards alignment, Phase 1).
  const [testCodes, setTestCodes] = useState({});

  useEffect(() => {
    const load = async () => {
      if (!patientId) return;
      try {
        const res = await base44.functions.invoke("doctorPatientMedicalData", { patient_id: patientId });
        const results = res.data.lab_results || [];
        setItems(results);
        const names = [...new Set(results.map((r) => r.test_type).filter(Boolean))];
        if (names.length) {
          try {
            const lookup = await base44.functions.invoke("terminologyLookup", {
              concept_type: "lab_test",
              terms: names,
            });
            const map = {};
            (lookup.data.matched || []).forEach((m) => { map[m.term] = m.code; });
            setTestCodes(map);
          } catch (err) {
            console.error(err);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h4 className="font-semibold text-sm">Patient-Submitted Laboratory Results</h4>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="w-3.5 h-3.5" />
          View-only
        </span>
      </div>

      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">This patient has not submitted any laboratory results.</p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {r.test_type}
                    {testCodes[r.test_type] ? (
                      <span className="ms-2 text-xs font-normal text-muted-foreground">LOINC: {testCodes[r.test_type]}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Test date: {r.test_date}{r.lab_name ? ` · ${r.lab_name}` : ""}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted {r.submitted_date ? new Date(r.submitted_date).toLocaleDateString() : ""} by {r.submitted_by_name}
                  </p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Patient-submitted
                </span>
              </div>
              <ClinicalFileButton
                kind="patient_lab_result"
                id={r.id}
                fileRef={r.file_url}
                className="inline-flex items-center gap-2 rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-medium mt-2"
              >
                <FileText className="w-4 h-4 mr-1" />
                View Report
              </ClinicalFileButton>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        These results were uploaded by the patient. Original reports cannot be altered by healthcare professionals.
      </p>
    </div>
  );
}