import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { generateClinicalDocumentPdfUrl } from "@/lib/clinicalDocumentPdf";
import { Loader2, FileSignature, History, FileText, PenLine } from "lucide-react";

// One clinical document family with full version control: shows the automatic
// patient/encounter header, the clinical content, the digital signature block
// and the PDF link. The authoring doctor can sign a draft (which generates
// and stores the PDF) and start an amendment — a new version; signed
// originals remain permanently accessible.
export default function DocumentCard({ doc, versions, doctorProfile, onAmend, onRefresh }) {
  const [viewing, setViewing] = useState(doc);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const canManage = doctorProfile && viewing.doctor_user_id === doctorProfile.user_id;
  const family = versions && versions.length > 0 ? versions : [doc];

  const sign = async () => {
    setSigning(true);
    setError("");
    try {
      const signedPreview = {
        ...viewing,
        status: "signed",
        signed_by_name: doctorProfile.full_name,
        signed_datetime: new Date().toISOString(),
      };
      const pdfUrl = await generateClinicalDocumentPdfUrl(signedPreview);
      await base44.functions.invoke("signClinicalDocument", {
        document_record_id: viewing.id,
        pdf_url: pdfUrl,
      });
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || "Could not sign the document. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <p className="font-semibold truncate">{viewing.document_type_label || viewing.document_type}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Created by {viewing.created_by_name || viewing.doctor_name}
            {viewing.created_datetime ? ` · ${format(new Date(viewing.created_datetime), "MMM d, yyyy · h:mm a")}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${viewing.status === "signed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {viewing.status === "signed" ? "Signed" : "Draft"}
          </span>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
            Version {viewing.version} · {viewing.amendment_status === "amendment" ? "Amendment" : "Original"}
          </span>
        </div>
      </div>

      {/* Automatic header data attached to every completed document */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <p>Patient: <span className="text-foreground font-medium">{viewing.patient_name}</span></p>
        <p>CIN: <span className="text-foreground font-medium">{viewing.patient_cin}</span></p>
        <p>Date of birth: <span className="text-foreground font-medium">{viewing.patient_dob || "-"}</span></p>
        <p>Encounter ID: <span className="text-foreground font-medium">{viewing.encounter_id}</span></p>
        <p>Hospital/Clinic: <span className="text-foreground font-medium">{viewing.hospital || "-"}</span></p>
        <p>Department: <span className="text-foreground font-medium">{viewing.department || "-"}</span></p>
        <p>Doctor: <span className="text-foreground font-medium">Dr. {viewing.doctor_name}</span></p>
        <p>Specialty: <span className="text-foreground font-medium">{viewing.doctor_specialty || "-"}</span></p>
        <p>AMedix Document ID: <span className="text-foreground font-medium">{viewing.document_id}</span></p>
      </div>

      {/* Content */}
      <p className="text-sm whitespace-pre-wrap">{viewing.content}</p>

      {/* Digital signature block */}
      {viewing.status === "signed" && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
            <FileSignature className="w-4 h-4" />
            Electronically signed by Dr. {viewing.signed_by_name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {viewing.signed_datetime ? format(new Date(viewing.signed_datetime), "MMMM d, yyyy 'at' h:mm a") : ""} ·
            AMedix Document ID: {viewing.document_id} · Version {viewing.version} ·
            {viewing.amendment_status === "amendment" ? " Amendment" : " Original"}
          </p>
        </div>
      )}
      {viewing.pdf_url && (
        <a href={viewing.pdf_url} target="_blank" rel="noreferrer" className="inline-block text-sm text-primary underline">
          View PDF
        </a>
      )}

      {/* Version history — originals remain permanently accessible */}
      {family.length > 1 && (
        <div className="border-t border-border pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Version history
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {family.map((v) => (
              <button
                key={v.id}
                onClick={() => { setViewing(v); setError(""); }}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${v.id === viewing.id ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-accent/50"}`}
              >
                Version {v.version}
                {v.is_amendment ? " (Amendment)" : " (Original)"}
                {v.status === "signed" ? " · Signed" : " · Draft"}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Actions */}
      {canManage && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {viewing.status === "draft" && (
            <Button size="sm" onClick={sign} disabled={signing}>
              {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
              Sign Document
            </Button>
          )}
          {viewing.status === "signed" && (
            <Button size="sm" variant="outline" onClick={() => onAmend(viewing)}>
              <PenLine className="w-4 h-4" />
              Amend — Create Version {viewing.version + 1}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}