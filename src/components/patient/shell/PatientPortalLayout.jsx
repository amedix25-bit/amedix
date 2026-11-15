import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import "@/components/patient/shell/patientPortal.css";

export default function PatientPortalLayout({ renderSidebar, children }) {
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width:1023px)").matches);
  const { t } = usePatientLanguage();

  useEffect(() => {
    const query = window.matchMedia("(max-width:1023px)");
    const sync = (event) => {
      setNarrow(event.matches);
      if (!event.matches) setOpen(false);
    };
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <div className="pp-page">
      <div className="pp-frame">
        <aside className="pp-desktop-sidebar">{renderSidebar({})}</aside>
        <main className="pp-main">
          {narrow && <div className="pp-mobile-header">
            <button type="button" className="pp-menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={t("Patient Portal")}><Menu /></button>
            <span className="pp-mobile-brand"><strong>AMedix</strong><span>{t("Patient Portal")}</span></span>
          </div>}
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