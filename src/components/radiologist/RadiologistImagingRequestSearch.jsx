import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, QrCode, ArrowLeft, Loader2, ScanLine, FileText, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DoctorScanPatientQr from "@/components/doctor/DoctorScanPatientQr";
import RadiologistImagingRequestDetail from "@/components/radiologist/RadiologistImagingRequestDetail";

// Radiologist Portal → Find Imaging Request (Enter CIN).
// Shows ONLY the patient's imaging request(s) — no profile, history, notes,
// diagnoses, medications or lab results. Each request stays inaccessible
// until the patient authorizes it (pending / accepted / declined).
export default function RadiologistImagingRequestSearch({ user, onBack }) {
  const [cin, setCin] = useState("");
  const [result, setResult] = useState(null); // { patient, requests }
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState(null);
  const [viewRequestId, setViewRequestId] = useState(null);
  const [scanning, setScanning] = useState(false);

  const search = async (cinValue) => {
    if (!cinValue.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("radiologyFindRequestsByCin", { cin: cinValue.trim() });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    search(cin);
  };

  const handleRequestAccess = async (req) => {
    setRequestingId(req.imaging_request_id);
    try {
      await base44.functions.invoke("radiologyRequestAccess", { imaging_request_id: req.imaging_request_id });
      await search(cin.trim());
    } catch (err) {
      console.error(err);
    } finally {
      setRequestingId(null);
    }
  };

  if (viewRequestId) {
    return <RadiologistImagingRequestDetail requestId={viewRequestId} onBack={() => setViewRequestId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter patient CIN (e.g. 7F3-829-461)"
            value={cin}
            onChange={(e) => setCin(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading || !cin.trim()}>
          {loading ? "Searching..." : "Search"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setScanning(true)}>
          <QrCode className="w-4 h-4 mr-2" />
          Scan QR Code
        </Button>
      </form>

      {scanning && (
        <DoctorScanPatientQr
          onCinDetected={(cinValue) => {
            setScanning(false);
            setCin(cinValue);
            search(cinValue);
          }}
          onCancel={() => setScanning(false)}
        />
      )}

      {result && result.patient === null && (
        <div className="text-center py-12 text-muted-foreground">
          <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No patient found with that CIN</p>
        </div>
      )}

      {result && result.patient && (
        <>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium">{result.patient.full_name}</p>
            <p className="text-sm text-primary font-semibold">CIN: {result.patient.cin}</p>
          </div>

          {result.requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No imaging requests found for this patient</p>
            </div>
          ) : (
            <div className="space-y-3">
              {result.requests.map((req) => (
                <div key={req.imaging_request_id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{req.scan_type} — {req.examination}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">Requested by Dr. {req.doctor_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {req.date_requested} · Priority: {req.priority}
                        {req.request_ref ? ` · Ref: ${req.request_ref}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {req.access_status === "accepted" ? (
                        <Button size="sm" onClick={() => setViewRequestId(req.imaging_request_id)}>
                          <ScanLine className="w-4 h-4 mr-1" />
                          View Request
                        </Button>
                      ) : req.access_status === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          Awaiting patient authorization
                        </span>
                      ) : req.access_status === "declined" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                          <XCircle className="w-3.5 h-3.5" />
                          Access declined by patient
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestAccess(req)}
                          disabled={requestingId === req.imaging_request_id}
                        >
                          {requestingId === req.imaging_request_id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Requesting...
                            </>
                          ) : (
                            "Request Access"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}