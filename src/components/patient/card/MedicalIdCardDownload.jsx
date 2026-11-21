import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { downloadMedicalCardPdf } from "@/lib/medicalCardPdf";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Download the official AMedix medical card as a PDF straight from the card on
// the patient's home screen. The card record is fetched when the patient asks
// for it, so nothing is issued merely by opening the page.
export default function MedicalIdCardDownload() {
  const { t, lang } = usePatientLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const download = async () => {
    setError("");
    setBusy(true);
    try {
      const response = await base44.functions.invoke("medicalCard", { action: "get" });
      const data = response.data || {};
      if (data.error || !data.card) throw new Error(data.error || "card_unavailable");
      await downloadMedicalCardPdf({
        card: data.card,
        verifyUrl: data.card.verify_url,
        lang: lang === "ar" ? "ar" : "en",
      });
    } catch (err) {
      setError(t("The card could not be downloaded. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition hover:bg-accent/60 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        {t("Download card (PDF)")}
      </button>
      {error && (
        <p className="flex items-start gap-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}