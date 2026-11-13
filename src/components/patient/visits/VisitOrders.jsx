import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Pill, FlaskConical, ScanLine, ChevronRight, FileText } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorTextAr } from "@/lib/doctorContentArabic";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";
import { ResolvedFileButton } from "@/components/radiology/ResolvedFile";
import PrescriptionStatusBadge from "@/components/pharmacy/PrescriptionStatusBadge";
import DispensingHistory from "@/components/pharmacy/DispensingHistory";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { Button } from "@/components/ui/button";

// Patient Portal → Doctor Visits → visit detail. Everything the doctor ordered
// during this visit — prescriptions, laboratory requests and imaging requests —
// each expandable in full, with its PDF where one exists.
export default function VisitOrders({ visit }) {
  const { t } = usePatientLanguage();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  const texts = [];
  (orders?.prescriptions || []).forEach((rx) => {
    texts.push(rx.medication_name, rx.special_instructions, rx.doctor_notes);
  });
  (orders?.labs || []).forEach((lab) => {
    texts.push(lab.indication, lab.instructions, lab.result);
  });
  (orders?.imaging || []).forEach((im) => {
    texts.push(im.clinical_indication, im.working_diagnosis, im.report);
  });
  const ar = useDoctorTextAr(visit.patient_id, texts);

  useEffect(() => {
    const load = async () => {
      setOrders(null);
      setError("");
      try {
        const opts = { sort: "-created_date", limit: 200 };
        const [rxPage, labPage, imPage] = await Promise.all([
          base44.entities.Prescription.filter({ patient_id: visit.patient_id }, opts),
          base44.entities.LabRequest.filter({ patient_id: visit.patient_id }, opts),
          base44.entities.ImagingRequest.filter({ patient_id: visit.patient_id }, opts),
        ]);
        const rows = (page) => (page?.items ? page.items : page || []);
        setOrders({
          prescriptions: rows(rxPage).filter((rx) =>
            belongsToVisit(rx, visit, rx.prescribed_datetime || rx.date_prescribed)
          ),
          labs: rows(labPage).filter((lab) =>
            belongsToVisit(lab, visit, lab.request_datetime || lab.date_requested)
          ),
          imaging: rows(imPage).filter((im) =>
            belongsToVisit(im, visit, im.request_datetime || im.date_requested)
          ),
        });
      } catch (err) {
        console.error(err);
        setError("Could not load the prescriptions and requests for this visit. Please reopen the visit to try again.");
      }
    };
    load();
  }, [visit.patient_id, visit.encounter_id]);

  if (error) return <p role="alert" className="text-sm text-destructive">{t(error)}</p>;
  if (!orders) {
    return (
      <div className="flex items-center py-4 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
        {t("Loading...")}
      </div>
    );
  }

  const toggle = (id) => setOpenId(openId === id ? null : id);

  const sections = [
    {
      key: "prescriptions",
      icon: <Pill className="w-4 h-4" />,
      title: t("Prescriptions"),
      empty: t("No prescriptions for this visit"),
      items: orders.prescriptions,
      card: (rx) => ({
        title: `${rx.medication_name}${rx.strength ? ` ${rx.strength}` : ""}`,
        subtitle: `${t("Dr.")} ${rx.doctor_name}${rx.date_prescribed ? ` · ${rx.date_prescribed}` : ""}`,
        badge: <PrescriptionStatusBadge status={rx.status} />,
        body: (
          <div className="space-y-3">
            <Row label={t("Dosage")} value={rx.dosage} />
            <Row label={t("Frequency")} value={rx.frequency} />
            <Row label={t("Route of Administration")} value={rx.route} />
            <Row label={t("Duration")} value={rx.duration} />
            <Row label={t("Quantity")} value={rx.quantity} />
            <Row label={t("Refills")} value={`${rx.refills_used || 0} / ${rx.refills_authorized || 0}`} />
            {rx.special_instructions && <Row label={t("Special Instructions")} value={ar(rx.special_instructions)} />}
            {rx.doctor_notes && <Row label={t("Doctor's Notes")} value={ar(rx.doctor_notes)} />}
            <DispensingHistory prescription={rx} />
          </div>
        ),
      }),
    },
    {
      key: "labs",
      icon: <FlaskConical className="w-4 h-4" />,
      title: t("Lab Requests"),
      empty: t("No lab requests for this visit"),
      items: orders.labs,
      card: (lab) => ({
        title: (lab.tests || []).map((x) => x.name).join(", ") || lab.request_id,
        subtitle: `${t("Dr.")} ${lab.doctor_name || ""}${lab.date_requested ? ` · ${lab.date_requested}` : ""}`,
        badge: <LabStatusBadge status={lab.status} />,
        body: (
          <div className="space-y-3">
            <Row label={t("Priority")} value={lab.priority} />
            <Row label={t("Indication")} value={ar(lab.indication)} />
            <Row label={t("Instructions:")} value={ar(lab.instructions)} />
            {lab.result && <Row label={t("Result")} value={ar(lab.result)} />}
            <div className="flex flex-wrap gap-3">
              {lab.pdf_url && (
                <ClinicalFileButton kind="lab_request" id={lab.id} fileRef={lab.pdf_url} className="text-xs text-primary underline inline-flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {t("Download request PDF")}
                </ClinicalFileButton>
              )}
              {lab.result_file_url && (
                <ClinicalFileButton kind="lab_request" id={lab.id} fileRef={lab.result_file_url} className="text-xs text-emerald-600 underline inline-flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {t("View result file")}
                </ClinicalFileButton>
              )}
            </div>
          </div>
        ),
      }),
    },
    {
      key: "imaging",
      icon: <ScanLine className="w-4 h-4" />,
      title: t("Imaging"),
      empty: t("No imaging requests for this visit"),
      items: orders.imaging,
      card: (im) => ({
        title: `${im.scan_type}${im.examination ? ` · ${im.examination}` : ""}`,
        subtitle: `${t("Dr.")} ${im.doctor_name || ""}${im.date_requested ? ` · ${im.date_requested}` : ""}`,
        badge: im.priority && im.priority !== "Routine" ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">{im.priority}</span>
        ) : null,
        body: (
          <div className="space-y-3">
            <Row label={t("Indication")} value={ar(im.clinical_indication)} />
            <Row label={t("Working Diagnosis")} value={ar(im.working_diagnosis)} />
            <Row label={t("Priority")} value={im.priority} />
            {im.contrast && <Row label={t("Contrast")} value={im.contrast} />}
            {im.report && <Row label={t("Result")} value={ar(im.report)} />}
            <PdfLinks requestId={im.id} links={[
              im.pdf_url && { label: t("Download request PDF"), url: im.pdf_url },
              im.report_file_url && { label: t("Open Report (PDF)"), url: im.report_file_url },
            ].filter(Boolean)} />
          </div>
        ),
      }),
    },
  ];

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.key}>
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            {section.icon}
            {section.title}
          </p>
          {section.items.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              {section.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {section.items.map((item) => {
                const card = section.card(item);
                const open = openId === item.id;
                return (
                  <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button type="button" onClick={() => toggle(item.id)} className="w-full text-left p-4 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{card.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {card.badge}
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform rtl:rotate-180 ${open ? "rotate-90 rtl:-rotate-90" : ""}`} />
                        </div>
                      </div>
                    </button>
                    {open && <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">{card.body}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// An order belongs to a visit when it carries that visit's reference, or — for
// orders saved before visits were recorded — when the same doctor issued it on
// the day of the visit.
function belongsToVisit(record, visit, dateValue) {
  if (visit.encounter_id && record.encounter_id === visit.encounter_id) return true;
  if (record.encounter_id) return false;
  if (visit.doctor_name && record.doctor_name !== visit.doctor_name) return false;
  if (!dateValue || !visit.encounter_datetime) return false;
  return new Date(dateValue).toDateString() === new Date(visit.encounter_datetime).toDateString();
}

function Row({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// Imaging request/report files are stored privately: each link is resolved to a
// short-lived signed URL for an authorized reader instead of opened directly.
function PdfLinks({ requestId, links }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <ResolvedFileButton
          key={link.url}
          requestId={requestId}
          fileRef={link.url}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background shadow-sm hover:bg-accent h-8 px-3 text-xs font-medium"
        >
          <FileText className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
          {link.label}
        </ResolvedFileButton>
      ))}
    </div>
  );
}