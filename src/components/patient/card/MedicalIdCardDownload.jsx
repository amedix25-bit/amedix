import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { downloadMedicalCardPdf } from "@/lib/medicalCardPdf";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Download the official AMedix medical card as a PDF from the card on the
// patient's home screen. The card record is fetched when the patient asks for
// it, so nothing is issued merely by opening the page.
export default function MedicalIdCardDownload({ variant = "icon" }) {
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

  // `button` renders the same one-tap download as a labelled action; `icon` is
  // the compact control that sits beside the card itself.
  const labelled = variant === "button";

  return (
    <div className={labelled ? "w-full" : "shrink-0"}>
      <button
        type="button"
        onClick={download}
        disabled={busy}
        aria-label={t("Download card (PDF)")}
        title={t("Download card (PDF)")}
        className={
          labelled
            ? "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-70"
            : "inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-primary/50 bg-white text-primary transition hover:bg-primary/5 disabled:opacity-70"
        }
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        {labelled && <span>{t("Download Medical Card (PDF)")}</span>}
      </button>
      {error && (
        <p className={`mt-1 flex items-start gap-1 text-[10px] leading-tight ${labelled ? "text-destructive" : "w-[120px] text-white/90"}`}>
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}