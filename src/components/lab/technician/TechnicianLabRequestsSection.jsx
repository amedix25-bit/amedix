import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import ScanRequestQrFlow from "@/components/lab/technician/ScanRequestQrFlow";
import { normalizeLabStatus } from "@/lib/labRequestUtils";
import { FileText, FlaskConical, Loader2, QrCode, Upload } from "lucide-react";

const MAX_FILE_BYTES = 3 * 1024 * 1024;

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TechnicianLabRequestsSection({ session }) {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [showScan, setShowScan] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [correctingId, setCorrectingId] = useState(null);
  const [correctFile, setCorrectFile] = useState(null);
  const [correctReason, setCorrectReason] = useState("");
  const [correcting, setCorrecting] = useState(false);

  // Result verification — records the responsible laboratory professional,
  // date/time and verification status, then releases the result.
  const verifyResult = async (r) => {
    setBusyId(r.id);
    try {
      const res = await base44.functions.invoke("labVerifyResult", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        lab_request_id: r.id,
      });
      toast({
        title: res.data.already_verified ? "Already verified" : "Result verified & released",
        description: res.data.already_verified
          ? `Verified by ${res.data.verified_by_name || "the laboratory"}.`
          : "The verified result has been released to the patient's record.",
      });
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusyId("");
    }
  };

  const pickCorrectedFile = (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "PDF required", description: "Please upload the corrected results as a PDF.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "Please upload a PDF up to 3 MB.", variant: "destructive" });
      return;
    }
    setCorrectFile(f);
  };

  // Corrected results never overwrite the original released result — the
  // corrected PDF is attached alongside it with the reason and full history.
  const submitCorrection = async (r) => {
    if (!correctFile) {
      toast({ title: "Corrected PDF required", description: "Upload the corrected results PDF.", variant: "destructive" });
      return;
    }
    if (!correctReason.trim()) {
      toast({ title: "Reason required", description: "Enter the reason for the corrected result.", variant: "destructive" });
      return;
    }
    setCorrecting(true);
    try {
      const b64 = await toBase64(correctFile);
      await base44.functions.invoke("labCorrectResult", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        lab_request_id: r.id,
        file_b64: b64,
        file_name: correctFile.name,
        file_type: correctFile.type || "application/pdf",
        correction_reason: correctReason.trim(),
      });
      toast({
        title: "Corrected result issued",
        description: "The original result is preserved in the patient's record. The patient has been notified.",
      });
      setCorrectingId(null);
      setCorrectFile(null);
      setCorrectReason("");
    } catch (err) {
      toast({
        title: "Correction failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setCorrecting(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("labRequestNotifications", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        all_statuses: true,
      });
      setItems(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    }
  }, [session.technician_id, session.session_token]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card text-center py-12 text-muted-foreground">
        <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No authorized laboratory requests yet.</p>
        <p className="text-xs mt-1">
          Requests appear here only after a patient explicitly allows your laboratory to access them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Scanning a request QR code opens the exact existing request your laboratory is authorized to view.
        </p>
        <Button size="sm" onClick={() => setShowScan((s) => !s)}>
          <QrCode className="w-4 h-4 mr-1" />
          Scan Laboratory Request QR
        </Button>
      </div>
      {showScan && <ScanRequestQrFlow session={session} onClose={() => setShowScan(false)} />}
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
      {items.map((r) => (
        <div key={r.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {r.patient_name} <span className="text-muted-foreground font-normal">· {r.patient_cin}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {r.request_ref} · Requested{" "}
                {r.created_date ? new Date(r.created_date).toLocaleString() : r.date_requested}
              </p>
            </div>
            <LabStatusBadge status={normalizeLabStatus(r.status)} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tests: {(r.tests || []).join(", ") || "—"}
          </p>
          {r.pdf_url && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => window.open(r.pdf_url, "_blank")}
            >
              <FileText className="w-4 h-4 mr-1" /> View Lab Request PDF
            </Button>
          )}
          {normalizeLabStatus(r.status) === "results" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={busyId === r.id} onClick={() => verifyResult(r)}>
                {busyId === r.id && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {r.result_verified ? "Verify & Release Again" : "Verify & Release Result"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCorrectingId(correctingId === r.id ? null : r.id);
                  setCorrectFile(null);
                  setCorrectReason("");
                }}
              >
                Correct Result
              </Button>
            </div>
          )}
          {correctingId === r.id && (
            <div className="mt-3 rounded-lg border border-border bg-background p-3 space-y-2">
              <p className="text-sm font-medium">Corrected Result — original result is never overwritten</p>
              <Button variant="outline" className="w-full" onClick={() => document.getElementById(`correct-file-${r.id}`).click()}>
                <Upload className="w-4 h-4 mr-1" /> {correctFile ? correctFile.name : "Choose corrected results PDF"}
              </Button>
              <input
                id={`correct-file-${r.id}`}
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={pickCorrectedFile}
              />
              <Textarea
                rows={2}
                placeholder="Reason for the corrected result *"
                value={correctReason}
                onChange={(e) => setCorrectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" disabled={correcting} onClick={() => submitCorrection(r)}>
                  {correcting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Issue Corrected Result
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCorrectingId(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}