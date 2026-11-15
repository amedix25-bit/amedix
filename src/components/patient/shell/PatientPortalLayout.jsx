import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import PatientReferenceArt from "@/components/patient/overview/PatientReferenceArt";
import "@/components/patient/shell/patientPortal.css";

export default function PatientPortalLayout({ renderSidebar, children }) {
  const [open, setOpen] = useState(false);
  const { t } = usePatientLanguage();
  return (
    <div className="pp-page">
      <div className="pp-frame">
        <aside className="pp-desktop-sidebar">{renderSidebar({})}</aside>
        <main className="pp-main">
          <div className="pp-mobile-header">
            <button type="button" onClick={() => setOpen(true)} aria-label={t("My Medical Record")}><Menu /></button>
            <span className="pp-mobile-brand"><PatientReferenceArt kind="logo" /><strong>AMedix</strong><span>{t("Patient Portal")}</span></span>
          </div>
          {children}
        </main>
      </div>
      {open && <div className="pp-drawer" role="dialog" aria-modal="true" aria-label={t("Patient Portal")}>
        <button className="pp-drawer-backdrop" onClick={() => setOpen(false)} aria-label={t("Close")} />
        <aside><button className="pp-drawer-close" onClick={() => setOpen(false)} aria-label={t("Close")}><X /></button>{renderSidebar({ close: () => setOpen(false) })}</aside>
      </div>}
    </div>
  );
}