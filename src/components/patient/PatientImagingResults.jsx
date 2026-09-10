import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Image as ImageIcon, Loader2, ScanLine, Send } from "lucide-react";
import SendImagingResultToDoctor from "@/components/patient/SendImagingResultToDoctor";

// Patient Portal → Imaging → View Results.
// Each completed imaging result is displayed under the radiologist's name:
// the finalized PDF imaging report, plus a clear "View Image" button for the
// actual completed imaging study images associated with that report.
export default function PatientImagingResults({ request, onBack }) {
  const [items, setItems] = useState(null);
  const [sendForId, setSendForId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await base44.entities.ImagingResult.filter(
          { imaging_request_id: request.id },
          "-created_datetime"
        );
        setItems(list);
      } catch (err) {
        console.error(err);
        setItems([]);
      }
    };
    load();
  }, [request?.id]);

  const groups = [];
  const map = new Map();
  (items || []).forEach((r) => {
    const key = r.radiologist_name || "Radiologist";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  map.forEach((results, radiologistName) => groups.push({ radiologistName, results }));

  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Imaging
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-medium">{request.scan_type} — {request.examination}</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Requested by Dr. {request.doctor_name} · {request.date_requested}
          {request.request_id ? ` · Ref: ${request.request_id}` : ""}
        </p>
      </div>

      {items === null ? (
        <div className="flex items-center text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading results...
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
          <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No results yet</p>
          <p className="text-xs mt-1">
            The radiologist's finalized report PDF and study images will appear here once submitted.
          </p>
        </div>
      ) : (
        groups.map(({ radiologistName, results }) => (
          <div key={radiologistName} className="space-y-3">
            <p className="font-semibold text-sm flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-primary" />
              Radiologist: {radiologistName}
            </p>
            {results.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap gap-2">
                  <a href={r.report_pdf_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Open Report (PDF)
                    </Button>
                  </a>
                  {(r.images || []).map((img, i) => (
                    <a key={i} href={img.file_url} target="_blank" rel="noopener noreferrer">
                      <Button>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {(r.images || []).length > 1 ? `View Image ${i + 1}` : "View Image"}
                      </Button>
                    </a>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setSendForId(sendForId === r.id ? null : r.id)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Doctor
                  </Button>
                </div>

                {sendForId === r.id && (
                  <SendImagingResultToDoctor patientId={request.patient_id} result={r} />
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Finalized {r.date_completed || ""}
                </p>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}