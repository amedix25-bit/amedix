import React, { useState } from "react";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import LabAuthorizationSection from "@/components/patient/lab/LabAuthorizationSection";
import { normalizeLabStatus } from "@/lib/labRequestUtils";
import { Building2, FileText, ShieldCheck } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useDoctorTextAr } from "@/lib/doctorContentArabic";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";
import { openLabRequestPdfFromRecord } from "@/lib/labRequestPdfFromRecord";

export default function PatientLabRequestCard({ group, patientId, onRequestUpdated }) {
  const { t, locale } = usePatientLanguage();
  const first = group[0];
  const [auth, setAuth] = useState(
    first.authorized_by_patient
      ? {
          lab_name: first.lab_name,
          lab_number: first.lab_number,
          authorization_datetime: first.authorization_datetime,
        }
      : null
  );

  const handleAuthorized = (data) => {
    setAuth(data);
    onRequestUpdated?.();
  };
  const consolidated = Array.isArray(first.tests) && first.tests.length > 0;

  const tests = consolidated
    ? first.tests
    : group.map((l) => ({ name: l.test_name, category: l.category }));
  const status = consolidated
    ? normalizeLabStatus(first.status)
    : normalizeLabStatus(group.every((l) => l.status === "completed") ? "results" : first.status);

  const result = consolidated
    ? first.result
    : group.map((l) => l.result).filter(Boolean).join("\n");
  const resultFileRec = consolidated ? first : (group.find((l) => l.result_file_url) || null);
  // The request form PDF may live on any row of a legacy (per-test) group.
  const pdfRec = consolidated ? first : (group.find((l) => l.pdf_url) || null);
  // Legacy requests saved without a form can still be rendered from their own
  // data — one form covering every test in the group.
  const pdfSource = consolidated ? first : { ...first, tests };
  const resultFile = resultFileRec ? resultFileRec.result_file_url : null;

  const byCategory = new Map();
  tests.forEach((tc) => {
    const key = tc.category || "Other";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(tc.name);
  });
  const ar = useDoctorTextAr(patientId, [...(first.indication ? [first.indication] : []), ...(first.instructions ? [first.instructions] : []), ...tests.map((tc) => tc.name)]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            {consolidated
              ? `${t("Lab Request")}${first.request_id ? ` · ${first.request_id}` : ""}`
              : `${t("Lab Request")} — ${tests.length}`}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{t("Requested by Dr.")}{first.doctor_name}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{first.date_requested}</span>
            {first.lab_name && (
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{first.lab_name}</span>
            )}
          </p>
        </div>
        <LabStatusBadge status={status === "results" ? "results" : status} />
      </div>

      <div className="mt-3 pt-3 border-t border-border space-y-2">
        {[...byCategory.entries()].map(([category, names]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t(category)}</p>
            <p className="text-sm">{names.map((n) => ar(n)).join(", ")}</p>
          </div>
        ))}
        {first.indication && (
          <p className="text-xs text-muted-foreground">{t("Indication:")} {ar(first.indication)}</p>
        )}
        {first.instructions && (
          <p className="text-xs text-muted-foreground">{t("Instructions:")} {ar(first.instructions)}</p>
        )}
      </div>

      {consolidated && status === "requested" && !auth && (
        <LabAuthorizationSection request={first} onAuthorized={handleAuthorized} />
      )}

      {auth && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> {t("Access Granted")}
          </p>
          <p className="text-sm text-emerald-800 mt-1">{t("Laboratory:")} {auth.lab_name}</p>
          <p className="text-sm text-emerald-800">{t("Lab ID:")} {auth.lab_number || "—"}</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            {t("Date Authorized:")}{" "}
            {auth.authorization_datetime ? new Date(auth.authorization_datetime).toLocaleString(locale) : "—"}
          </p>
        </div>
      )}

      {status === "results" && (result || resultFile) && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          {result && <p className="text-sm text-emerald-800 whitespace-pre-wrap">{result}</p>}
          {resultFile && (
            <ClinicalFileButton
              kind="lab_request"
              id={resultFileRec.id}
              fileRef={resultFile}
              className="text-xs text-emerald-600 underline mt-2 inline-block"
            >
              {t("View result file")}
            </ClinicalFileButton>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        {pdfRec ? (
          <ClinicalFileButton
            kind="lab_request"
            id={pdfRec.id}
            fileRef={pdfRec.pdf_url}
            className="inline-flex items-center gap-1.5 text-sm text-primary underline"
          >
            <FileText className="w-4 h-4" />
            {t("Download request PDF")}
          </ClinicalFileButton>
        ) : (
          <button
            type="button"
            onClick={() => openLabRequestPdfFromRecord(pdfSource)}
            className="inline-flex items-center gap-1.5 text-sm text-primary underline"
          >
            <FileText className="w-4 h-4" />
            {t("Download request PDF")}
          </button>
        )}
      </div>
    </div>
  );
}