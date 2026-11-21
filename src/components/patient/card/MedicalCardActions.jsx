import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { Apple as AppleIcon } from "lucide-react";
import { downloadMedicalCardPdf } from "@/lib/medicalCardPdf";

function base64ToBlob(base64, type) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function MedicalCardActions({ card, verifyUrl, walletConfigured, lang = "en", t = (key) => key }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [pdfLang, setPdfLang] = useState(lang === "ar" ? "ar" : "en");

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const addToWallet = async () => {
    setError("");
    setBusy("wallet");
    try {
      const response = await base44.functions.invoke("medicalCardPass", {});
      const data = response.data || {};
      if (data.error || !data.pass_base64) {
        setError(
          data.error === "wallet_not_configured"
            ? t("Apple Wallet is not set up for AMedix yet. Download the PDF card meanwhile — it works on iPhone too.")
            : t("The Wallet card could not be created. Please try the PDF.")
        );
        return;
      }
      saveBlob(base64ToBlob(data.pass_base64, "application/vnd.apple.pkpass"), data.filename);
    } catch (err) {
      setError(t("The Wallet card could not be created. Please try the PDF."));
    } finally {
      setBusy("");
    }
  };

  const downloadPdf = async () => {
    setError("");
    setBusy("pdf");
    try {
      await downloadMedicalCardPdf({ card, verifyUrl, lang: pdfLang });
    } catch (err) {
      setError(t("The PDF could not be created. Please try again."));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-3">
      {walletConfigured && (
        <button
          type="button"
          onClick={addToWallet}
          disabled={busy === "wallet"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-white transition hover:bg-black/90 disabled:opacity-60"
        >
          {busy === "wallet" ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <AppleIcon className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">{t("Add to Apple Wallet")}</span>
        </button>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={pdfLang}
          onChange={(event) => setPdfLang(event.target.value)}
          aria-label={t("Card language")}
          className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground sm:w-36"
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
        <Button onClick={downloadPdf} disabled={busy === "pdf"} className="h-11 flex-1 gap-2">
          {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          {t("Download Medical Card (PDF)")}
        </Button>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {isIOS
          ? t("On iPhone you can add the card to Apple Wallet or download the PDF. On Android and desktop, the PDF works everywhere and can be saved, printed or shared.")
          : t("The PDF works on Android, iPhone and desktop — save it to your phone, print it or share it. Apple Wallet is available on iPhone.")}
      </p>
    </div>
  );
}