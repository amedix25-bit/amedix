import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldCheck, Syringe, FolderOpen, ClipboardList } from "lucide-react";
import DocumentCaptureCard from "@/components/patient/documents/DocumentCaptureCard";
import ClinicalNotesSection from "@/components/patient/documents/ClinicalNotesSection";
import { usePatientLanguage } from "@/lib/patientLanguage";
import {
  INSURANCE_CARD,
  VACCINATION_CARD,
  ADDITIONAL_CATEGORIES,
  LEGACY_TYPE_TO_CATEGORY,
  CATEGORY_TO_TYPE,
} from "@/components/patient/documents/documentsConfig";

export default function PatientDocuments({ patient }) {
  const { t } = usePatientLanguage();
  const patientId = patient?.id;
  const [docs, setDocs] = useState([]);
  const [referralMap, setReferralMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadingButton, setUploadingButton] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (patientId) load();
    if (patient?.id) loadReferralMap();
  }, [patientId]);

  // Referral letters linked to the referral documents shown below — used to
  // mark a referral as VIEWED the first time the patient opens it.
  const loadReferralMap = async () => {
    try {
      const letters = await base44.entities.ReferralLetter.filter({ patient_id: patient.id });
      const map = {};
      letters.forEach((l) => {
        if (l.pdf_url) map[l.pdf_url] = l;
      });
      setReferralMap(map);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReferralView = (doc) => {
    const letter = referralMap[doc.file_url];
    if (letter && letter.status === "sent") {
      base44.entities.ReferralLetter.update(letter.id, {
        status: "viewed",
        audit_trail: [
          ...(letter.audit_trail || []),
          { action: "viewed", by_name: patient.full_name, by_role: "patient", datetime: new Date().toISOString() },
        ],
      })
        .then(loadReferralMap)
        .catch(console.error);
    }
  };

  const load = async () => {
    try {
      const data = await base44.entities.MedicalDocument.filter({ patient_id: patientId }, "-date");
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const docsFor = (key) =>
    docs.filter((d) => (d.category || LEGACY_TYPE_TO_CATEGORY[d.type] || "other") === key);

  const handleCapture = async (category, button, file) => {
    const buttonId = `${category.key}:${button.id}`;
    setUploadingButton(buttonId);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const multi = category.buttons.length > 1;
      await base44.entities.MedicalDocument.create({
        patient_id: patient.id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        title: multi ? `${category.label} — ${button.label}` : category.label,
        type: CATEGORY_TO_TYPE[category.key] || "other",
        category: category.key,
        file_url,
        file_name: file.name,
        date: new Date().toISOString().slice(0, 10),
      });
      await load();
    } catch (err) {
      console.error(err);
      setError(t("Could not save the picture. Please try again."));
    } finally {
      setUploadingButton(null);
    }
  };

  const handleDelete = async (doc) => {
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    try {
      await base44.entities.MedicalDocument.delete(doc.id);
    } catch (err) {
      console.error(err);
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        {t("Loading documents...")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("Insurance Documents")}</h2>
        </div>
        <DocumentCaptureCard
          category={INSURANCE_CARD}
          docs={docsFor(INSURANCE_CARD.key)}
          uploadingButton={uploadingButton}
          onCapture={handleCapture}
          onDelete={handleDelete}
        />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Syringe className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("Vaccination Records")}</h2>
        </div>
        <DocumentCaptureCard
          category={VACCINATION_CARD}
          docs={docsFor(VACCINATION_CARD.key)}
          uploadingButton={uploadingButton}
          onCapture={handleCapture}
          onDelete={handleDelete}
        />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("Clinical Notes")}</h2>
        </div>
        <ClinicalNotesSection patient={patient} />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("Additional Documents")}</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {ADDITIONAL_CATEGORIES.map((category) => (
            <DocumentCaptureCard
              key={category.key}
              category={category}
              docs={docsFor(category.key)}
              uploadingButton={uploadingButton}
              onCapture={handleCapture}
              onDelete={handleDelete}
              onView={category.key === "referral" ? handleReferralView : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  );
}