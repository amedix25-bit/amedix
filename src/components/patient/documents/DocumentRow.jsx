import React from "react";
import { Trash2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { useResolvedFileUrl, ClinicalFileButton } from "@/components/common/ClinicalFile";

// One saved patient document row. The stored file reference is resolved to a
// short-lived signed URL through the access-checked backend before the
// thumbnail renders or the document opens — never a permanent public link.
export default function DocumentRow({ doc, icon: Icon, onView, onDelete }) {
  const { t } = usePatientLanguage();
  const resolved = useResolvedFileUrl("medical_document", doc.id, doc.file_url);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-2">
      {resolved ? (
        <Image
          src={resolved}
          alt={doc.title}
          className="w-12 h-12 rounded-md overflow-hidden shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.title}</p>
        <p className="text-xs text-muted-foreground">{doc.date}</p>
      </div>
      {doc.file_url && (
        <ClinicalFileButton
          kind="medical_document"
          id={doc.id}
          fileRef={doc.file_url}
          className="text-sm text-primary hover:underline shrink-0"
          onClick={() => onView?.(doc)}
        >
          {t("View")}
        </ClinicalFileButton>
      )}
      <button
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive shrink-0"
        aria-label={t("Delete document")}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}