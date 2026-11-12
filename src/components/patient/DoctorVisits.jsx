import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Stethoscope, ChevronLeft, MapPin, Clock, FileText, ChevronRight, ClipboardList } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorTextAr } from "@/lib/doctorContentArabic";
import VisitOrders from "@/components/patient/visits/VisitOrders";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import resolveClinicalFile from "@/lib/clinicalFileUrl";

// Patient Portal → Doctor Visits. Lists every doctor visit (doctor, place,
// time). Clicking a visit opens its visit notes plus the clinical documents
// and notes the doctor wrote during that visit, viewable in full or as PDF.
export default function DoctorVisits({ patientId }) {
  const { t, isArabic } = usePatientLanguage();
  const [visits, setVisits] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Encounter.filter({ patient_id: patientId }, "-encounter_datetime");
        setVisits(data);
      } catch (err) {
        console.error(err);
        setVisits([]);
      }
    };
    if (patientId) load();
  }, [patientId]);

  if (selected) {
    return <DoctorVisitDetail visit={selected} onBack={() => setSelected(null)} />;
  }

  if (visits === null) {
    return (
      <div className="flex items-center py-6 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
        {t("Loading...")}
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Stethoscope className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">{t("No doctor visits yet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("Every doctor visit appears here. Click a visit to see its notes.")}</p>
      {visits.map((visit) => (
        <button
          key={visit.id}
          type="button"
          onClick={() => setSelected(visit)}
          className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{t("Dr.")} {visit.doctor_name}</p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{visit.hospital}{visit.department ? ` · ${departmentLabel(visit.department, isArabic)}` : ""}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {formatVisitTime(visit.encounter_datetime, isArabic)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-180" />
          </div>
        </button>
      ))}
    </div>
  );
}

function DoctorVisitDetail({ visit, onBack }) {
  const { t, isArabic } = usePatientLanguage();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const ar = useDoctorTextAr(visit.patient_id, (items || []).map((i) => i.content || i.diagnosis || ""));

  useEffect(() => {
    const load = async () => {
      setItems(null);
      setError("");
      try {
        const [docs, notesRes] = await Promise.all([
          base44.entities.ClinicalDocument.filter(
            { patient_id: visit.patient_id, encounter_id: visit.encounter_id, status: "signed" },
            "-created_datetime"
          ),
          // Doctors' clinical notes are never shown in full — the patient sees
          // only the diagnosis recorded on each note (server-enforced).
          base44.functions.invoke("patientNoteDiagnoses", {
            patient_id: visit.patient_id,
            encounter_id: visit.encounter_id,
          }),
        ]);
        const list = [
          ...docs.map((d) => ({ kind: "document", ...d })),
          ...(notesRes.data.notes || []).map((n) => ({ kind: "note", ...n })),
        ];
        list.sort((a, b) => new Date(b.created_datetime || b.date || 0) - new Date(a.created_datetime || a.date || 0));
        setItems(list);
      } catch (err) {
        console.error(err);
        setError("Could not load the notes for this visit. Please reopen the visit to try again.");
      }
    };
    load();
  }, [visit.patient_id, visit.encounter_id]);

  const openPdf = async (item) => {
    // Only signed clinical documents have a PDF — clinical notes are not
    // exposed to patients. The stored reference is private, so it is resolved
    // to a short-lived signed URL after the server verifies access.
    if (item.kind !== "document" || !item.pdf_url) return;
    // Opened inside the tap so mobile browsers allow the new tab.
    const tab = window.open("", "_blank");
    try {
      const url = await resolveClinicalFile("clinical_document", item.id, item.pdf_url);
      if (tab) tab.location.href = url;
      else window.open(url, "_blank", "noopener");
    } catch (err) {
      if (tab) tab.close();
      toast({
        title: t("This document could not be opened"),
        description:
          err?.response?.data?.error ||
          t("Your access could not be verified. Please try again."),
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="rtl:flex-row-reverse">
        <ChevronLeft className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Back to Visits")}
      </Button>

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="font-semibold">{t("Dr.")} {visit.doctor_name}</p>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {visit.hospital}{visit.department ? ` · ${departmentLabel(visit.department, isArabic)}` : ""}
        </p>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {formatVisitTime(visit.encounter_datetime, isArabic)}
        </p>
        {visit.chief_complaint && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">{t("Patient Visit Notes")}</p>
            <p className="text-sm mt-1">{ar(visit.chief_complaint)}</p>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          {t("Diagnosis")}
        </p>
        {error ? (
          <p role="alert" className="text-sm text-destructive">{t(error)}</p>
        ) : items === null ? (
          <div className="flex items-center py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
            {t("Loading...")}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
            {t("No diagnosis for this visit")}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ClinicalItemCard
                key={item.id}
                item={item}
                ar={ar}
                open={openId === item.id}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                onOpenPdf={() => openPdf(item)}
              />
            ))}
          </div>
        )}
      </div>

      <VisitOrders visit={visit} />
    </div>
  );
}

function ClinicalItemCard({ item, ar, open, onToggle, onOpenPdf }) {
  const { t, isArabic } = usePatientLanguage();
  const isDoc = item.kind === "document";
  const title = item.document_type_label || t("Clinical Note");
  const when = item.signed_datetime || item.created_datetime || item.date;
  const structured = isDoc && item.data ? Object.values(item.data) : [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full text-left p-4 hover:bg-muted/40 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("Dr.")} {item.doctor_name}{when ? ` · ${formatVisitTime(when, isArabic)}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isDoc && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                {t("Signed")}
              </span>
            )}
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform rtl:rotate-180 ${open ? "rotate-90 rtl:-rotate-90" : ""}`} />
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {item.content && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("Content")}</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{ar(item.content)}</p>
            </div>
          )}
          {structured.map((f, i) =>
            f && f.value ? (
              <div key={i}>
                <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{ar(f.value)}</p>
              </div>
            ) : null
          )}
          {!isDoc && item.diagnosis && (
            <NoteField label={t("Diagnosis")} value={ar(item.diagnosis)} />
          )}
          {isDoc && (
            <Button variant="outline" size="sm" onClick={onOpenPdf}>
              <FileText className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
              {t("View PDF")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function NoteField({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function formatVisitTime(dt, isArabic = false) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString(isArabic ? "ar" : "en-GB", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch (err) {
    return dt;
  }
}

// Department / specialty values are stored in English — show them in Arabic
// in the Patient Portal when the language is Arabic.
const DEPARTMENT_AR = {
  "surgeon": "جراح",
  "internal medicine": "الباطنية",
  "family medicine": "طب الأسرة",
  "general practice": "طب عام",
  "emergency medicine": "طب الطوارئ",
  "cardiology": "القلبية",
  "pediatrics": "طب الأطفال",
  "neurology": "الأعصاب",
  "orthopedics": "العظام",
  "obstetrics & gynecology": "النساء والتوليد",
  "dermatology": "الجلدية",
  "psychiatry": "الطب النفسي",
  "ent (otolaryngology)": "الأنف والأذن والحنجرة",
  "ophthalmology": "العيون",
  "urology": "المسالك البولية",
  "oncology": "الأورام",
  "anesthesiology & intensive care": "التخدير والعناية المركزة",
  "plastic surgery": "الجراحة التجميلية",
  "vascular surgery": "جراحة الأوعية الدموية",
  "endocrinology": "الغدد الصماء",
  "gastroenterology": "الجهاز الهضمي",
  "pulmonology": "الصدرية",
  "nephrology": "الكلى",
  "rheumatology": "الروماتيزم",
  "hematology": "أمراض الدم",
  "infectious diseases": "الأمراض المعدية",
  "physical medicine & rehabilitation": "الطب الطبيعي والتأهيل",
  "dentistry": "طب الأسنان",
  "nutrition & dietetics": "التغذية",
  "neurosurgery": "جراحة الأعصاب",
  "cardiothoracic surgery": "جراحة القلب والصدر",
  "pediatric surgery": "جراحة الأطفال",
  "trauma surgery": "جراحة الإصابات",
  "critical care / icu": "العناية المركزة",
  "pain medicine": "طب الألم",
  "allergy & immunology": "الحساسية والمناعة",
  "geriatrics": "طب المسنين",
  "palliative care": "الرعاية التلطيفية",
  "sports medicine": "طب الرياضة",
  "radiology": "الأشعة",
  "pathology": "علم الأمراض",
  "laboratory medicine": "طب المختبرات",
};

function departmentLabel(department, isArabic = false) {
  if (!department || !isArabic) return department || "";
  const key = department.toLowerCase().replace(/\s*clinic\s*$/, "").trim();
  return DEPARTMENT_AR[key] || department;
}