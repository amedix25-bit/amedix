import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileText, Users } from "lucide-react";
import MedicalDictationButton from "@/components/doctor/dictation/MedicalDictationButton";
import DoctorAvatar from "@/components/DoctorAvatar";
import {
  makeReferralId,
  makeVerificationCode,
  generateReferralLetterPdf,
  addReferralQr,
} from "@/lib/referralLetterPdf";
import { calcAge } from "@/lib/labRequestPdf";
import { fetchCheckInStatus, LOCKED_MESSAGE } from "@/lib/checkInGate";

const URGENCIES = ["Routine", "Urgent", "Emergency"];
const URGENCY_CLASSES = {
  Routine: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Urgent: "bg-amber-50 text-amber-700 border-amber-200",
  Emergency: "bg-red-50 text-red-700 border-red-200",
};

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h4 className="font-semibold text-sm mb-4">{title}</h4>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

// Structured professional referral form. Patient and referring doctor
// information are pre-filled from their profiles; on "Generate Referral
// Letter" a PDF is created, uploaded, saved as a ReferralLetter record and
// filed under the patient's Documents → Referral Letters.
export default function ReferralLetterForm({ doctorProfile, patient, onDone, onCancel }) {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    referral_date: today,
    receiving_doctor: "",
    receiving_specialty: "",
    reason_for_referral: "",
    urgency: "Routine",
    working_diagnosis: "",
    symptoms_duration: "",
    past_medical_history: "",
    past_surgical_history: "",
    current_medications: "",
    allergies: "",
    physical_examination: "",
    vital_signs: "",
    lab_results: "",
    imaging_results: "",
    pathology_results: "",
    other_investigations: "",
    treatment_medications: "",
    treatment_procedures: "",
    previous_treatments: "",
    treatment_response: "",
    specific_request: "",
  });
  const [patientDocs, setPatientDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [colleagues, setColleagues] = useState([]);
  const [colleagueQuery, setColleagueQuery] = useState("");
  const [selectedColleague, setSelectedColleague] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  // Medical dictation mic for the referral letter's clinical fields.
  const dict = (key, label) => (
    <MedicalDictationButton
      value={form[key]}
      onChange={(text) => setForm({ ...form, [key]: text })}
      specialty={doctorProfile?.specialization || ""}
      contextLabel={`Referral letter — ${label}`}
    />
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke("doctorPatientMedicalData", { patient_id: patient.id });
        setPatientDocs((res.data.documents || []).filter((d) => d.file_url));
        // Auto-fill the clinical fields that match the referral letter format
        // from the patient's My Health record — only fields the doctor has
        // not already typed in. Everything stays editable.
        const d = res.data || {};
        const bits = (arr) => arr.filter(Boolean).join("\n");
        const historyText = bits([
          ...(d.conditions || []).map((c) =>
            `${c.name}${c.date ? `, diagnosed ${c.date}` : ""}${
              c.current_status === "active"
                ? " (active)"
                : c.current_status === "being_monitored"
                  ? " (under monitoring)"
                  : c.current_status === "resolved"
                    ? " (resolved)"
                    : ""
            }`
          ),
          ...(d.medical_history || [])
            .filter((e) => e.entry_type === "patient_seen" && e.date)
            .map((e) => `Seen by ${e.doctor_name || "a doctor"} on ${e.date}${e.appointment_reason ? ` — ${e.appointment_reason}` : ""}`),
        ]);
        setForm((f) => ({
          ...f,
          past_medical_history: f.past_medical_history || historyText,
          past_surgical_history:
            f.past_surgical_history ||
            bits((d.surgical || []).map((s) => `${s.surgery_type}${s.surgery_date ? ` (${s.surgery_date})` : ""}${s.reason ? ` — ${s.reason}` : ""}`)),
          current_medications:
            f.current_medications ||
            bits(
              (d.medications || [])
                .filter((m) => m.is_active !== false)
                .map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ""}${m.frequency ? `, ${m.frequency}` : ""}`)
            ),
          allergies:
            f.allergies ||
            ((d.allergies || []).length
              ? bits((d.allergies || []).map((a) => `${a.allergen}${a.reaction ? ` — ${a.reaction}` : ""}${a.severity ? ` (${a.severity})` : ""}`))
              : (d.patient?.allergy_record_status || "") === "no_known_allergies"
                ? "No known allergies (patient-reported)"
                : ""),
        }));
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [patient.id]);

  // Accepted colleagues of this doctor — lets the referring doctor select the
  // receiving doctor without entering their information manually.
  useEffect(() => {
    const loadColleagues = async () => {
      try {
        const [sent, received] = await Promise.all([
          base44.entities.DoctorConnection.filter({ requester_doctor_id: doctorProfile.id, status: "accepted" }),
          base44.entities.DoctorConnection.filter({ recipient_doctor_id: doctorProfile.id, status: "accepted" }),
        ]);
        const ids = [...sent.map((c) => c.recipient_doctor_id), ...received.map((c) => c.requester_doctor_id)];
        if (ids.length === 0) return;
        const all = await base44.entities.DoctorProfile.list();
        setColleagues(all.filter((d) => ids.includes(d.id) && d.is_verified === true));
      } catch (err) {
        console.error(err);
      }
    };
    loadColleagues();
  }, [doctorProfile.id]);

  const colleagueMatches = colleagueQuery.trim()
    ? colleagues
        .filter((c) =>
          [c.full_name, c.specialization, c.hospital].some((v) =>
            v && v.toLowerCase().includes(colleagueQuery.trim().toLowerCase())
          )
        )
        .slice(0, 5)
    : [];

  const selectColleague = (c) => {
    setSelectedColleague(c);
    setColleagueQuery("");
    setForm({ ...form, receiving_doctor: c.full_name, receiving_specialty: c.specialization || "" });
  };

  const toggleDoc = (id) =>
    setSelectedDocIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));

  const handleGenerate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.receiving_doctor.trim() || !form.receiving_specialty.trim()) {
      setFormError("Enter the receiving doctor and their specialty or department.");
      return;
    }
    if (!form.reason_for_referral.trim() || !form.working_diagnosis.trim()) {
      setFormError("Reason for referral and working diagnosis are required.");
      return;
    }
    // Check-in security gate — a referral can only be added for a patient who
    // is actively checked in at the doctor's hospital (backend verdict).
    const gate = await fetchCheckInStatus(patient.id);
    if (!gate.checked_in) {
      setFormError(LOCKED_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date();
      const referral_number = makeReferralId();
      const verification_code = makeVerificationCode();
      const attachments = patientDocs
        .filter((d) => selectedDocIds.includes(d.id))
        .map((d) => ({ file_url: d.file_url, file_name: d.file_name || d.title, title: d.title }));
      // Colleague selected for this referral — their verified hospital and
      // contact travel with the letter when the name still matches.
      const sel = selectedColleague && form.receiving_doctor === selectedColleague.full_name ? selectedColleague : null;

      const payload = {
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        patient_dob: patient.date_of_birth || "",
        patient_age: calcAge(patient.date_of_birth),
        patient_sex: patient.gender || "",
        patient_contact: patient.phone || "",
        doctor_id: doctorProfile.id,
        doctor_user_id: doctorProfile.user_id,
        doctor_name: doctorProfile.full_name,
        doctor_specialization: doctorProfile.specialization || "",
        doctor_hospital: doctorProfile.hospital || "",
        doctor_contact: doctorProfile.phone || "",
        doctor_license: doctorProfile.license_number || "",
        referral_number,
        verification_code,
        referral_date: form.referral_date,
        referral_datetime: now.toISOString(),
        receiving_doctor: form.receiving_doctor,
        receiving_specialty: form.receiving_specialty,
        receiving_doctor_id: sel?.id || "",
        receiving_doctor_user_id: sel?.user_id || "",
        receiving_hospital: sel?.hospital || "",
        receiving_contact: sel?.phone || "",
        reason_for_referral: form.reason_for_referral,
        urgency: form.urgency,
        working_diagnosis: form.working_diagnosis,
        ...form,
        attachments,
      };

      const doc = generateReferralLetterPdf(payload);
      await addReferralQr(doc, referral_number);
      const pdfFile = new File(
        [doc.output("blob")],
        `Referral_${patient.cin}_${referral_number}.pdf`,
        { type: "application/pdf" }
      );
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: pdfFile });

      // A referral addressed to a colleague is sent right away; otherwise
      // it stays a draft until the doctor sends it.
      const audit_trail = [
        {
          action: "created",
          by_name: doctorProfile.full_name,
          by_role: "doctor",
          datetime: now.toISOString(),
        },
      ];
      if (sel) {
        audit_trail.push({
          action: "sent",
          by_name: doctorProfile.full_name,
          by_role: "doctor",
          datetime: now.toISOString(),
        });
      }
      await base44.entities.ReferralLetter.create({
        ...payload,
        pdf_url: file_url,
        status: sel ? "sent" : "draft",
        audit_trail,
      });

      // Notify the receiving colleague about the referral
      if (sel?.user_id) {
        try {
          await base44.entities.DoctorNotification.create({
            doctor_user_id: sel.user_id,
            doctor_id: sel.id,
            type: "referral_received",
            title: `New referral from ${doctorProfile.full_name}`,
            message: `${referral_number} — ${patient.full_name}${form.reason_for_referral ? `: ${form.reason_for_referral}` : ""}`,
            patient_id: patient.id,
            patient_name: patient.full_name,
            patient_cin: patient.cin,
            request_ref: referral_number,
            related_id: referral_number,
            target: "referrals",
            datetime: new Date().toISOString(),
          });
        } catch (err) {
          console.error(err);
        }
      }

      // File the referral under the patient's Documents → Referral Letters
      await base44.entities.MedicalDocument.create({
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        doctor_name: doctorProfile.full_name,
        title: `Referral Letter — ${referral_number}`,
        type: "referral",
        category: "referral",
        file_url,
        file_name: pdfFile.name,
        date: today,
      });

      toast({
        title: sel ? "Referral letter sent" : "Referral letter generated",
        description: sel
          ? `${referral_number} was sent to ${sel.full_name} — they were notified.`
          : `${referral_number} was saved under the patient's Documents → Referral Letters.`,
      });
      onDone();
    } catch (err) {
      console.error(err);
      setFormError("Could not generate the referral letter. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleGenerate} className="space-y-4">
      {formError && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{formError}</div>
      )}

      {/* Prefilled: referring doctor & patient */}
      <Section title="Referring Doctor Information">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Full Name: </span><span className="font-medium">{doctorProfile.full_name}</span></div>
          <div><span className="text-muted-foreground">Specialty: </span><span className="font-medium">{doctorProfile.specialization || "—"}</span></div>
          <div><span className="text-muted-foreground">Clinic / Hospital: </span><span className="font-medium">{doctorProfile.hospital || "—"}</span></div>
          <div><span className="text-muted-foreground">Contact: </span><span className="font-medium">{doctorProfile.phone || "—"}</span></div>
          <div><span className="text-muted-foreground">Doctor ID / Reg. No: </span><span className="font-medium">{doctorProfile.license_number || "—"}</span></div>
        </div>
      </Section>

      <Section title="Patient Information">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Full Name: </span><span className="font-medium">{patient.full_name}</span></div>
          <div><span className="text-muted-foreground">CIN: </span><span className="font-medium">{patient.cin}</span></div>
          <div><span className="text-muted-foreground">Date of Birth: </span><span className="font-medium">{patient.date_of_birth || "—"}</span></div>
          <div><span className="text-muted-foreground">Age: </span><span className="font-medium">{calcAge(patient.date_of_birth) || "—"}</span></div>
          <div><span className="text-muted-foreground">Sex: </span><span className="font-medium">{patient.gender || "—"}</span></div>
          <div><span className="text-muted-foreground">Contact: </span><span className="font-medium">{patient.phone || "—"}</span></div>
        </div>
      </Section>

      <Section title="Referral Information">
        {colleagues.length > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Choose from My Colleagues
              </p>
              {selectedColleague && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setSelectedColleague(null)}
                >
                  Change
                </button>
              )}
            </div>
            {selectedColleague ? (
              <div className="flex items-center gap-3">
                <DoctorAvatar photoUrl={selectedColleague.photo_url} name={selectedColleague.full_name} className="w-9 h-9 text-xs" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{selectedColleague.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedColleague.specialization || "—"}
                    {selectedColleague.hospital ? ` — ${selectedColleague.hospital}` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search your colleagues..."
                  value={colleagueQuery}
                  onChange={(e) => setColleagueQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                />
                {colleagueQuery.trim() && (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {colleagueMatches.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No colleagues match your search.</p>
                    ) : (
                      colleagueMatches.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => selectColleague(c)}
                          className="w-full flex items-center gap-3 rounded-lg border border-border p-2 hover:bg-accent/50 text-left"
                        >
                          <DoctorAvatar photoUrl={c.photo_url} name={c.full_name} className="w-8 h-8 text-xs" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {c.specialization || "—"}
                              {c.hospital ? ` — ${c.hospital}` : ""}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Referral Date" required>
            <Input type="date" value={form.referral_date} onChange={set("referral_date")} required />
          </Field>
          <Field label="Receiving Doctor" required>
            <Input placeholder="Name of the receiving doctor" value={form.receiving_doctor} onChange={set("receiving_doctor")} required />
          </Field>
        </div>
        <Field label="Specialty / Department" required>
          <Input placeholder="e.g. Cardiology — Dr. / Department" value={form.receiving_specialty} onChange={set("receiving_specialty")} required />
        </Field>
        <Field label="Reason for Referral" required>
          <Textarea rows={2} placeholder="Why the patient is being referred" value={form.reason_for_referral} onChange={set("reason_for_referral")} required />
          {dict("reason_for_referral", "Reason for Referral")}
        </Field>
        <div className="space-y-1.5">
          <Label className="text-xs">Urgency Level *</Label>
          <div className="flex gap-2">
            {URGENCIES.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setForm({ ...form, urgency: u })}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.urgency === u ? URGENCY_CLASSES[u] : "bg-card text-muted-foreground border-border hover:bg-accent/60"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <Field label="Primary / Working Diagnosis" required>
          <Input placeholder="Working diagnosis at the time of referral" value={form.working_diagnosis} onChange={set("working_diagnosis")} required />
          {dict("working_diagnosis", "Working Diagnosis")}
        </Field>
      </Section>

      <Section title="Clinical Information">
        <p className="text-xs text-muted-foreground">
          Past history, medications and allergies are pre-filled from the patient's My Health record where available — edit as needed.
        </p>
        <Field label="Relevant Symptoms & Duration">
          <Textarea rows={2} value={form.symptoms_duration} onChange={set("symptoms_duration")} />
          {dict("symptoms_duration", "Relevant Symptoms & Duration")}
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Past Medical History">
            <Textarea rows={2} value={form.past_medical_history} onChange={set("past_medical_history")} />
            {dict("past_medical_history", "Past Medical History")}
          </Field>
          <Field label="Past Surgical History">
            <Textarea rows={2} value={form.past_surgical_history} onChange={set("past_surgical_history")} />
            {dict("past_surgical_history", "Past Surgical History")}
          </Field>
          <Field label="Current Medications">
            <Textarea rows={2} value={form.current_medications} onChange={set("current_medications")} />
            {dict("current_medications", "Current Medications")}
          </Field>
          <Field label="Allergies">
            <Textarea rows={2} value={form.allergies} onChange={set("allergies")} />
            {dict("allergies", "Allergies")}
          </Field>
        </div>
        <Field label="Relevant Physical Examination Findings">
          <Textarea rows={2} value={form.physical_examination} onChange={set("physical_examination")} />
          {dict("physical_examination", "Physical Examination Findings")}
        </Field>
        <Field label="Vital Signs (when appropriate)">
          <Textarea rows={2} placeholder="e.g. BP 120/80, HR 78, Temp 37.0°C" value={form.vital_signs} onChange={set("vital_signs")} />
          {dict("vital_signs", "Vital Signs")}
        </Field>
      </Section>

      <Section title="Investigations">
        <Field label="Relevant Laboratory Results">
          <Textarea rows={2} value={form.lab_results} onChange={set("lab_results")} />
          {dict("lab_results", "Relevant Laboratory Results")}
        </Field>
        <Field label="Imaging Results">
          <Textarea rows={2} value={form.imaging_results} onChange={set("imaging_results")} />
          {dict("imaging_results", "Imaging Results")}
        </Field>
        <Field label="Pathology / Biopsy Results">
          <Textarea rows={2} value={form.pathology_results} onChange={set("pathology_results")} />
          {dict("pathology_results", "Pathology / Biopsy Results")}
        </Field>
        <Field label="Other Relevant Investigations">
          <Textarea rows={2} value={form.other_investigations} onChange={set("other_investigations")} />
          {dict("other_investigations", "Other Relevant Investigations")}
        </Field>
      </Section>

      <Section title="Treatment Already Provided">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Medications">
            <Textarea rows={2} value={form.treatment_medications} onChange={set("treatment_medications")} />
            {dict("treatment_medications", "Treatment — Medications")}
          </Field>
          <Field label="Procedures">
            <Textarea rows={2} value={form.treatment_procedures} onChange={set("treatment_procedures")} />
            {dict("treatment_procedures", "Treatment — Procedures")}
          </Field>
        </div>
        <Field label="Previous Treatments">
          <Textarea rows={2} value={form.previous_treatments} onChange={set("previous_treatments")} />
          {dict("previous_treatments", "Previous Treatments")}
        </Field>
        <Field label="Response to Treatment">
          <Textarea rows={2} value={form.treatment_response} onChange={set("treatment_response")} />
          {dict("treatment_response", "Response to Treatment")}
        </Field>
      </Section>

      <Section title="Specific Request to Receiving Doctor">
        <Field label="Evaluation, investigation, specialist opinion or management being requested">
          <Textarea rows={5} placeholder="Clearly explain what you are asking the receiving doctor to do..." value={form.specific_request} onChange={set("specific_request")} />
          {dict("specific_request", "Specific Request to Receiving Doctor")}
        </Field>
      </Section>

      <Section title="Attachments">
        {patientDocs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents are available yet in this patient's Documents section.
          </p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {patientDocs.map((d) => (
              <label
                key={d.id}
                className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                  selectedDocIds.includes(d.id) ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={selectedDocIds.includes(d.id)}
                  onChange={() => toggleDoc(d.id)}
                />
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium truncate">{d.title}</span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">{d.date}</span>
              </label>
            ))}
          </div>
        )}
      </Section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Generate Referral Letter
        </Button>
      </div>
    </form>
  );
}