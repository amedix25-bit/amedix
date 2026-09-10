import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { generateRadiologyReportPdf } from "@/lib/radiologyReportPdf";

const ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "webp"];

// Radiologist Portal — finalize and submit the imaging results for an
// authorized imaging request. The radiologist controls which report sections
// are included; submission generates the finalized PDF report and attaches
// the study images, which become available to the patient under View Results.
export default function RadiologistSubmitResults({ request, user, radiologistProfile, onSubmitted }) {
  const [form, setForm] = useState({
    findings: "",
    impressions: "",
    measurements: "",
    observations: "",
    notes: "",
  });
  const [files, setFiles] = useState([]);
  const [existing, setExisting] = useState(null); // null = checking
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await base44.entities.ImagingResult.filter({
          imaging_request_id: request.id,
          radiologist_user_id: user.id,
        });
        setExisting(res.length > 0 ? res[0] : false);
      } catch (err) {
        console.error(err);
        setExisting(false);
      }
    };
    check();
  }, [request?.id, user?.id]);

  const handleFiles = (e) => {
    const list = Array.from(e.target.files || []);
    const valid = list.filter((f) => ALLOWED_IMAGE_TYPES.includes((f.name.split(".").pop() || "").toLowerCase()));
    if (valid.length < list.length) {
      setError("Only JPG, JPEG, PNG or WEBP images can be attached as study images.");
    } else {
      setError("");
    }
    setFiles(valid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.findings.trim()) {
      setError("Findings are required.");
      return;
    }
    setSaving(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const sections = [
        ["Findings", form.findings],
        ["Impressions", form.impressions],
        ["Measurements", form.measurements],
        ["Observations", form.observations],
        ["Additional Clinical Notes", form.notes],
      ].filter(([, t]) => t && t.trim());

      const doc = generateRadiologyReportPdf({
        patientName: request.patient_name,
        patientCin: request.patient_cin,
        scanType: request.scan_type,
        examination: request.examination,
        requestRef: request.request_id,
        doctorName: request.doctor_name,
        radiologistName: radiologistProfile?.full_name,
        date: dateStr,
        sections,
      });
      const pdfFile = new File(
        [doc.output("blob")],
        `ImagingReport_${request.patient_cin}_${dateStr}.pdf`,
        { type: "application/pdf" }
      );
      const { file_url: reportPdfUrl } = await base44.integrations.Core.UploadPublicFile({ file: pdfFile });

      const images = [];
      for (const f of files) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
        images.push({ file_url, file_name: f.name });
      }

      const reportNotes = sections.map(([h, t]) => `${h}:\n${t.trim()}`).join("\n\n");
      await base44.functions.invoke("radiologySubmitResults", {
        imaging_request_id: request.id,
        report_notes: reportNotes,
        report_pdf_url: reportPdfUrl,
        images,
      });

      setExisting({ submitted: true });
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error(err);
      setError("Could not submit the results.");
    } finally {
      setSaving(false);
    }
  };

  if (existing === null) {
    return (
      <div className="flex items-center text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking results...
      </div>
    );
  }

  if (existing) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-start gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-800">
          Results submitted and finalized — the patient can now view the report PDF and study images under View Results.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="font-semibold text-sm">Submit Results — finalize the report and attach the study images</p>

      <div className="space-y-2">
        <Label>Findings *</Label>
        <Textarea
          rows={4}
          placeholder="Imaging findings..."
          value={form.findings}
          onChange={(e) => setForm({ ...form, findings: e.target.value })}
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Impressions</Label>
          <Textarea
            rows={3}
            placeholder="Overall impressions..."
            value={form.impressions}
            onChange={(e) => setForm({ ...form, impressions: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Measurements</Label>
          <Textarea
            rows={3}
            placeholder="Relevant measurements..."
            value={form.measurements}
            onChange={(e) => setForm({ ...form, measurements: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Observations</Label>
        <Textarea
          rows={3}
          placeholder="Additional observations..."
          value={form.observations}
          onChange={(e) => setForm({ ...form, observations: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Additional Clinical Notes</Label>
        <Textarea
          rows={3}
          placeholder="Any other clinical notes to include in the report..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Study Images (JPG, JPEG, PNG, WEBP)</Label>
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFiles}
          className="block w-full text-sm text-muted-foreground border border-input rounded-md px-3 py-2 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:text-sm"
        />
        {files.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {files.length} image{files.length !== 1 ? "s" : ""} attached
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Finalize &amp; Submit Results
          </>
        )}
      </Button>
    </form>
  );
}