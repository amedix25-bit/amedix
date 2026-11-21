import React from "react";
import PatientHeaderArt from "@/components/patient/shell/PatientHeaderArt";
import PatientBottomNav from "@/components/patient/shell/PatientBottomNav";
import "@/components/patient/shell/patientPortal.css";
import "@/components/patient/shell/patientPortalResponsive.css";

// One unified patient portal shell. The responsive stylesheet decides what is
// visible: the full navigation sidebar on tablets, laptops and desktops, and
// the fixed five-tab navigation bar on phones. No hamburger, no duplicate header.
export default function PatientPortalLayout({ renderSidebar, children, activeKey, onNavigate }) {
  return (
    <div className="pp-page">
      <PatientHeaderArt />
      <div className="pp-frame">
        <aside className="pp-desktop-sidebar">{renderSidebar({})}</aside>
        <main className="pp-main">
          <div className="pp-main-inner">{children}</div>
        </main>
      </div>
      <PatientBottomNav activeKey={activeKey} onNavigate={onNavigate} />
    </div>
  );
}