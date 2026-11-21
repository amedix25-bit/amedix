import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import BrandLogo from "@/components/BrandLogo";
import PatientHeaderArt from "@/components/patient/shell/PatientHeaderArt";
import PatientBottomNav from "@/components/patient/shell/PatientBottomNav";
import "@/components/patient/shell/patientPortal.css";
import "@/components/patient/shell/patientPortalResponsive.css";

// One unified patient portal shell. The responsive stylesheet decides what is
// visible: navigation rail on laptops/tablets, menu button + bottom navigation
// on phones. Nothing is duplicated — the same sidebar renders in both places.
export default function PatientPortalLayout({ renderSidebar, children, activeKey, onNavigate }) {
  const [open, setOpen] = useState(false);
  const { t } = usePatientLanguage();

  return (
    <div className="pp-page">
      <PatientHeaderArt />
      <div className="pp-frame">
        <aside className="pp-desktop-sidebar">{renderSidebar({})}</aside>
        <main className="pp-main">
          <div className="pp-mobile-header">
            <button
              type="button"
              className="pp-menu-button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label={t("Patient Portal")}
            >
              <Menu aria-hidden="true" />
            </button>
            <span className="pp-mobile-brand">
              <BrandLogo className="pp-mobile-logo" />
              <span className="pp-mobile-divider" aria-hidden="true" />
              <span>{t("Patient Portal")}</span>
            </span>
          </div>
          <div className="pp-main-inner">{children}</div>
        </main>
      </div>

      <PatientBottomNav activeKey={activeKey} onNavigate={onNavigate} onMenu={() => setOpen(true)} />

      {open && (
        <div className="pp-drawer" role="dialog" aria-modal="true" aria-label={t("Patient Portal")}>
          <button className="pp-drawer-backdrop" onClick={() => setOpen(false)} aria-label={t("Close")} />
          <aside>
            <button className="pp-drawer-close" onClick={() => setOpen(false)} aria-label={t("Close")}>
              <X aria-hidden="true" />
            </button>
            {renderSidebar({ close: () => setOpen(false) })}
          </aside>
        </div>
      )}
    </div>
  );
}