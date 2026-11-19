import React, { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import resolveClinicalFile from "@/lib/clinicalFileUrl";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { ADDITIONAL_CATEGORIES } from "@/components/patient/documents/documentsConfig";

// The files the patient added in Reports & Documents, listed wherever the
// record is read — the patient's Health Summary and the Doctor Portal patient
// history. Every file is opened through the access-checked resolver, so the
// same permission rules apply on both sides.
const CATEGORY_LABELS = {
  insurance: "Medical Insurance Card",
  vaccination: "Vaccination Card",
  ...Object.fromEntries(ADDITIONAL_CATEGORIES.map((c) => [c.key, c.label])),
};

export default function PatientDocumentsList({
  documents = [],
  title = "",
  emptyText = "",
  limit = 5,
  className = "",
}) {
  const { t } = usePatientLanguage();
  const [opening, setOpening] = useState("");
  const rows = [...documents]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, limit);

  const open = async (doc) => {
    setOpening(doc.id);
    try {
      const url = await resolveClinicalFile("medical_document", doc.id, doc.file_url);
      if (url) window.open(url, "_blank");
    } finally {
      setOpening("");
    }
  };

  if (!rows.length && !emptyText) return null;

  return (
    <div className={className}>
      {title && <h4 className="font-semibold text-sm mb-2">{t(title)}</h4>}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(emptyText)}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((doc) => (
            <li key={doc.id} className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium break-words">{doc.title || t("Document")}</p>
                <p className="text-xs text-muted-foreground">
                  {[CATEGORY_LABELS[doc.category] ? t(CATEGORY_LABELS[doc.category]) : "", doc.date]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => open(doc)}
                disabled={opening === doc.id || !doc.file_url}
                className="text-xs text-primary underline shrink-0 inline-flex items-center gap-1 disabled:opacity-50"
              >
                {opening === doc.id && <Loader2 className="w-3 h-3 animate-spin" />}
                {t("Open")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}