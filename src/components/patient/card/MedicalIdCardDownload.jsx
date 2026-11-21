import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { downloadMedicalCardPdf } from "@/lib/medicalCardPdf";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Download the official AMedix medical card as a PDF from the card on the
// patient's home screen. The card record is fetched when the patient asks for
// it, so nothing is issued merely by opening the page.
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
    <div className="shrink-0">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        aria-label={t("Download card (PDF)")}
        title={t("Download card (PDF)")}
        className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-info/10 text-info transition hover:bg-info/20 disabled:opacity-70"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      {error && (
        <p className="mt-1 flex w-[120px] items-start gap-1 text-[10px] leading-tight text-white/90">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}