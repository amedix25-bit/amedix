import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { normalizeLabStatus } from "@/lib/labRequestUtils";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";
import QrScanner from "@/components/lab/technician/QrScanner";
import {
  AlertTriangle,
  Building2,
  FileText,
  Loader2,
  QrCode,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";

const REF_PATTERN = /LR-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*/;

// "Scan Laboratory Request QR" flow for technicians. The camera scan (or a
// QR-code image upload when the camera is unavailable) resolves the exact
// EXISTING request the patient authorized to this laboratory — scanning never
// creates or duplicates a request. Nothing is shown unless the technician is
// logged in and their laboratory is authorized for that request.
export default function ScanRequestQrFlow({ session, onClose }) {
  const [loading, setLoading] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [error, setError] = useState("");
  const [request, setRequest] = useState(null);

  const lookup = async (raw) => {
    const match = String(raw || "").match(REF_PATTERN);
    if (!match) {
      setError("Invalid or unavailable laboratory request.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("labScanRequestQr", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        request_ref: match[0].toUpperCase(),
      });
      setRequest(res.data.request);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or unavailable laboratory request.");
    } finally {
      setLoading(false);
    }
  };

  // Fallback when camera scanning is unavailable: decode the QR from an
  // uploaded/selected image using the browser's barcode detector.
  const handleImageUpload = async (file) => {
    if (!file) return;
    setDecoding(true);
    setError("");
    try {
      if (!("BarcodeDetector" in window)) {
        throw new Error("QR image decoding is not supported in this browser. Use the camera scan instead.");
      }
      const bitmap = await window.createImageBitmap(file);
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const codes = await detector.detect(bitmap);
      if (!codes.length || !codes[0].rawValue) {
        throw new Error("No QR code found in the selected image.");
      }
      await lookup(codes[0].rawValue);
    } catch (err) {
      setError(err.message || "Could not read the QR code image.");
    } finally {
      setDecoding(false);
    }
  };

  const reset = () => {
    setRequest(null);
    setError("");
  };

  const infoRow = (label, value) =>
    value ? (
      <p className="text-sm mt-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <br />
        {value}
      </p>
    ) : null;

  const grouped = new Map();
  (request?.tests || []).forEach((t) => {
    const key = t.category || "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(t.name);
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-primary" />
          Scan Laboratory Request QR
        </p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {request ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {request.patient_name}
                  <span className="text-muted-foreground font-normal"> · CIN {request.patient_cin}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {request.request_ref} · Requested {request.date_requested}
                </p>
              </div>
              <LabStatusBadge status={normalizeLabStatus(request.status)} />
            </div>

            {request.doctor_name && (
              <p className="text-sm mt-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {request.doctor_name}
                {request.doctor_specialization || request.doctor_hospital
                  ? ` — ${[request.doctor_specialization, request.doctor_hospital].filter(Boolean).join(", ")}`
                  : ""}
              </p>
            )}
            {(request.patient_dob || request.patient_gender || request.patient_blood_type) && (
              <p className="text-xs text-muted-foreground mt-1">
                {[request.patient_dob, request.patient_gender, request.patient_blood_type].filter(Boolean).join(" · ")}
              </p>
            )}

            {[...grouped.entries()].map(([category, names]) => (
              <div key={category} className="mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category}</p>
                <p className="text-sm">{names.join(", ")}</p>
              </div>
            ))}

            {infoRow("Clinical Indication", request.indication)}
            {infoRow("Relevant Clinical Information", request.clinical_info)}
            {infoRow("Laboratory Instructions", request.instructions)}

            <div className="flex flex-wrap gap-2 mt-3">
              {request.pdf_url && (
                <ClinicalFileButton kind="lab_request" id={request.id} fileRef={request.pdf_url} className="inline-flex items-center gap-2 rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-medium">
                  <FileText className="w-4 h-4 mr-1" /> View Lab Request PDF
                </ClinicalFileButton>
              )}
              {request.result_file_url && (
                <ClinicalFileButton kind="lab_request" id={request.id} fileRef={request.result_file_url} className="inline-flex items-center gap-2 rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-medium">
                  <FileText className="w-4 h-4 mr-1" /> {request.result_file_name || "View Result File"}
                </ClinicalFileButton>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Scan Another Request
          </Button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying and opening the laboratory request...
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <QrScanner label="Scan the Laboratory Request QR code" onScan={lookup} />
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-4 py-2 rounded-md text-sm border border-dashed border-border hover:bg-accent">
                <Upload className="w-4 h-4 mr-2" />
                Upload QR code image
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
            </label>
            {decoding && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  );
}