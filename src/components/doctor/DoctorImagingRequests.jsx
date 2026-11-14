import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { makeImagingRequestId, generateImagingRequestPdf } from "@/lib/imagingRequestPdf";
import { loadRequestLogo } from "@/lib/requestPdfLayout";
import { Image, Plus, Eye, ShieldAlert } from "lucide-react";
import ImagingRequestForm from "./imaging/ImagingRequestForm";
import ImagingRequestCard from "./imaging/ImagingRequestCard";
import DoctorSharedImagingResults from "./DoctorSharedImagingResults";
import { fetchCheckInStatus, LOCKED_MESSAGE } from "@/lib/checkInGate";
import { CONTRAST_APPLICABLE } from "@/lib/imagingCatalog";

export default function DoctorImagingRequests({ doctorProfile, patient, initialCin, initialView }) {
  const [items, setItems] = useState([]);
  const [sharedByRequest, setSharedByRequest] = useState({});
  const [loading, setLoading] = useState(true);
  const [isolationError, setIsolationError] = useState("");
  const [view, setView] = useState(initialView || null); // "form" | "list"

  // The patient whose profile is open, if any. Inside a patient profile every
  // request shown MUST belong to that exact patient — patient id AND CIN — so a
  // record of another patient can never appear here.
  const patientId = patient?.id || "";
  const patientCin = String(patient?.cin || initialCin || "").trim().toUpperCase();

  useEffect(() => {
    // Switching patient clears everything the previous patient showed, so no
    // earlier patient's request is ever visible while the new list loads.
    setItems([]);
    setSharedByRequest({});
    setIsolationError("");
    setLoading(true);
    let cancelled = false;

    const load = async () => {
      try {
        // Patient-scoped query when a patient is open: the doctor's whole
        // caseload is NEVER fetched inside a patient profile.
        const data = patientId
          ? await base44.entities.ImagingRequest.filter({ patient_id: patientId }, "-date_requested")
          : await base44.entities.ImagingRequest.filter({ doctor_id: doctorProfile.id }, "-date_requested");
        // Results the patient explicitly shared with this doctor, keyed by
        // the imaging request they belong to.
        const shared = await base44.entities.DoctorNotification.filter(
          { doctor_user_id: doctorProfile.user_id, type: "imaging_result_shared" },
          "-datetime"
        );
        if (cancelled) return;
        const verified = data.filter((r) => {
          if (!patientId) return true;
          if (String(r.patient_id || "") !== patientId) return false;
          const recordCin = String(r.patient_cin || "").trim().toUpperCase();
          return !recordCin || !patientCin || recordCin === patientCin;
        });
        if (patientId && verified.length !== data.length) {
          setIsolationError(
            "One or more imaging requests could not be verified as belonging to this patient and were withheld for review."
          );
        }
        const sharedScoped = patientId
          ? shared.filter((s) => String(s.patient_id || "") === patientId)
          : shared;
        setSharedByRequest(Object.fromEntries(sharedScoped.filter((s) => s.imaging_request_id).map((s) => [s.imaging_request_id, s])));
        setItems(verified);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [doctorProfile?.id, doctorProfile?.user_id, patientId, patientCin]);

  const load = async () => {
    setLoading(true);
    try {
      const data = patientId
        ? await base44.entities.ImagingRequest.filter({ patient_id: patientId }, "-date_requested")
        : await base44.entities.ImagingRequest.filter({ doctor_id: doctorProfile.id }, "-date_requested");
      const verified = data.filter((r) => {
        if (!patientId) return true;
        if (String(r.patient_id || "") !== patientId) return false;
        const recordCin = String(r.patient_cin || "").trim().toUpperCase();
        return !recordCin || !patientCin || recordCin === patientCin;
      });
      setItems(verified);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (form) => {
    const { signature } = form;
    try {
      const patients = await base44.entities.PatientProfile.filter({ cin: form.patient_cin.toUpperCase() });
      if (patients.length === 0) { alert("Patient not found"); return; }
      const p = patients[0];
      // Check-in gate — the backend verifies it again at creation time.
      const gate = await fetchCheckInStatus(p.id);
      if (!gate.checked_in) {
        alert(LOCKED_MESSAGE);
        return;
      }
      const now = new Date();
      const examination = form.examination === "Other" ? form.examination_other.trim() : form.examination;
      const showContrast = CONTRAST_APPLICABLE.includes(form.scan_type);
      const contrastSelected = showContrast && ["With contrast", "With and without contrast"].includes(form.contrast);
      const isMri = form.scan_type === "MRI";

      const payload = {
        patient_id: p.id,
        patient_user_id: p.user_id,
        doctor_id: doctorProfile.id,
        patient_cin: p.cin,
        patient_name: p.full_name,
        doctor_name: doctorProfile.full_name,
        doctor_specialization: doctorProfile.specialization,
        doctor_hospital: doctorProfile.hospital,
        request_id: makeImagingRequestId(),
        scan_type: form.scan_type,
        examination,
        body_part: examination,
        clinical_indication: form.clinical_indication.trim(),
        working_diagnosis: form.working_diagnosis.trim(),
        priority: form.priority,
        requested_date: form.requested_date || "",
        contrast: showContrast ? form.contrast : "Not applicable",
        ...(contrastSelected ? {
          contrast_allergy: form.contrast_allergy,
          previous_contrast_reaction: form.previous_contrast_reaction,
        } : {}),
        ...(isMri ? {
          mri_metal_implant: form.mri_metal_implant,
          mri_pacemaker: form.mri_pacemaker,
          mri_other_device: form.mri_other_device,
          mri_metallic_foreign_body: form.mri_metallic_foreign_body,
          mri_other_concern: form.mri_other_concern.trim(),
        } : {}),
        status: "requested",
        date_requested: now.toISOString().slice(0, 10),
        request_datetime: now.toISOString(),
        request_time: now.toTimeString().slice(0, 5),
      };

      const logo = await loadRequestLogo();
      const doc = generateImagingRequestPdf({
        ...payload,
        logo,
        patient_dob: p.date_of_birth,
        patient_gender: p.gender,
        patient_blood_type: p.blood_type,
        doctor_license: doctorProfile.license_number,
        signature: signature || null,
      });
      const pdfFile = new File([doc.output("blob")], `ImagingRequest_${p.cin}_${payload.date_requested}.pdf`, { type: "application/pdf" });
      const { file_uri: file_url } = await base44.integrations.Core.UploadPrivateFile({ file: pdfFile }); // stored privately
      await base44.functions.invoke("createImagingRequest", {
        ...payload,
        pdf_url: file_url,
        signature_record_id: signature?.signature_record_id,
        signature_version: signature?.signature_version,
        signature_source: signature?.source,
      });
      setView("list");
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleRespondClarification = async (id, text) => {
    try {
      await base44.functions.invoke("radiologyUpdateWorkflowStatus", {
        request_id: id,
        action: "respond_clarification",
        clarification: text,
      });
      load();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleUploadReport = async (id, text) => {
    try {
      await base44.entities.ImagingRequest.update(id, {
        status: "completed",
        report: text,
        date_completed: new Date().toISOString().slice(0, 10),
      });
      load();
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (id, file) => {
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.ImagingRequest.update(id, { report_file_url: file_uri });
      load();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setView((v) => (v === "list" ? null : "list"))}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Imaging Requested
        </Button>
        <Button onClick={() => setView((v) => (v === "form" ? null : "form"))}>
          <Plus className="w-4 h-4 mr-2" />
          New Imaging Request
        </Button>
      </div>

      {view === "form" && (
        <ImagingRequestForm doctorProfile={doctorProfile} initialCin={initialCin} onSubmit={handleSubmit} onCancel={() => setView(null)} />
      )}

      {isolationError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          {isolationError}
        </p>
      )}

      {view === "list" && (
        <DoctorSharedImagingResults userId={doctorProfile.user_id} patientId={patientId} />
      )}

      {view === "list" && (
        <h3 className="font-semibold text-sm pt-2 border-t border-border">Imaging Requests</h3>
      )}

      {view === "list" && (loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No imaging requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((img) => (
            <ImagingRequestCard key={img.id} img={img} sharedResult={sharedByRequest[img.id]} onUploadReport={handleUploadReport} onAttachFile={handleFileUpload} onRespondClarification={handleRespondClarification} />
          ))}
        </div>
      ))}
    </div>
  );
}