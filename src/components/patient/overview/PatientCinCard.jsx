import React from "react";
import { CreditCard, QrCode, CheckCircle2 } from "lucide-react";
import QrCodeCard from "@/components/QrCodeCard";
import PatientReferenceArt from "@/components/patient/overview/PatientReferenceArt";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientCinCard({ cin, onShowQr, onShowCard }) {
  const { t } = usePatientLanguage();
  return <section className="pp-panel pp-cin" aria-label={t("My CIN")}>
    <svg className="pp-cin-waves" viewBox="0 0 364 129" preserveAspectRatio="none" aria-hidden="true">
      <path className="pp-wave-light" d="M0 73C83 79 109 137 220 113C280 100 317 115 364 95V129H0Z" />
      <path className="pp-wave-blue" d="M0 106C57 108 97 154 190 133C281 111 317 132 364 114V129H0Z" />
      <path className="pp-wave-light" d="M0 10C47 7 84 38 120 25C188 2 251 21 364 5V0H0Z" />
    </svg>
    <PatientReferenceArt kind="cinWave" className="pp-cin-edge" />
    <div className="pp-cin-copy">
      <span className="pp-verified"><CheckCircle2 />{t("Verified Patient")}</span>
      <p className="pp-cin-label">{t("My CIN")}</p>
      <p className="pp-cin-number" dir="ltr">{cin || "—"}</p>
      <p className="pp-cin-description">{t("Your permanent Clinical Identification Number — unique to you.")}</p>
      <div className="pp-cin-buttons">
        <button type="button" onClick={onShowQr}><QrCode />{t("Show QR Code")}</button>
        <button type="button" onClick={onShowCard}><CreditCard />{t("View Card")}</button>
      </div>
    </div>
    <button type="button" className="pp-cin-qr" onClick={onShowQr} aria-label={t("Show QR Code")}><QrCodeCard cin={cin} size={112} /></button>
  </section>;
}