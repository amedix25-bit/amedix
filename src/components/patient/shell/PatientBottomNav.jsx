import React, { useState } from "react";
import { Home, FolderOpen, Building2, MessageSquareMore, Settings, CalendarDays, MessageSquare, Pill, FlaskConical, ScanLine, Heart, Syringe, Stethoscope, Files, ShieldCheck, CreditCard } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { clearDoctorHospitalSession } from "@/lib/doctorHospitalSession";
import { usePatientLanguage } from "@/lib/patientLanguage";
import PatientNavSheet from "@/components/patient/shell/PatientNavSheet";

// Phone-only navigation: five fixed tabs, three of which open a slide-up submenu.
const RECORDS = [
  { key: "health", label: "Health Summary", icon: Heart },
  { key: "vaccinations", label: "Vaccinations", icon: Syringe },
  { key: "doctorvisits", label: "Visit Summaries", icon: Stethoscope },
  { key: "documents", label: "Reports & Documents", icon: Files },
];

const FACILITIES = [
  { key: "directory", label: "Hospitals & Doctors", icon: Building2 },
  { key: "labs", label: "Lab Tests & Results", icon: FlaskConical },
  { key: "imaging", label: "Imaging & Scans", icon: ScanLine },
  { key: "drugs", label: "Medications & Prescriptions", icon: Pill },
];

const COMMUNICATION = [
  { key: "appointments", label: "Appointments", icon: CalendarDays },
  { key: "messages", label: "Messages from Doctors", icon: MessageSquare },
];

const SETTINGS = [
  { key: "access", label: "Access & Privacy", icon: ShieldCheck },
  { key: "medicalcard", label: "Medical Card", icon: CreditCard },
  { key: "logout", label: "Log out" },
];

const TABS = [
  { key: "home", label: "Home", Icon: Home },
  { key: "records", label: "Medical Records", Icon: FolderOpen, title: "My Medical Record", items: RECORDS },
  { key: "facilities", label: "Facilities", Icon: Building2, title: "Facilities", items: FACILITIES },
  { key: "communication", label: "Communication", Icon: MessageSquareMore, title: "Communication", items: COMMUNICATION },
  { key: "settings", label: "Settings", Icon: Settings, title: "Settings", items: SETTINGS },
];

const TAB_FOR_PAGE = {
  overview: "home",
  health: "records",
  vaccinations: "records",
  doctorvisits: "records",
  documents: "records",
  directory: "facilities",
  labs: "facilities",
  mylabresults: "facilities",
  imaging: "facilities",
  drugs: "facilities",
  medications: "facilities",
  prescriptions: "facilities",
  appointments: "communication",
  messages: "communication",
  profile: "settings",
  access: "settings",
  medicalcard: "settings",
};

export default function PatientBottomNav({ activeKey, onNavigate }) {
  const { t } = usePatientLanguage();
  const [sheet, setSheet] = useState(null);
  const activeTab = TAB_FOR_PAGE[activeKey] || null;

  const select = (key) => {
    setSheet(null);
    if (key === "logout") {
      clearDoctorHospitalSession();
      base44.auth.logout(window.location.origin);
      return;
    }
    onNavigate?.(key);
  };

  return (
    <>
      <nav className="pp-bottom-nav" aria-label={t("Patient Portal")}>
        {TABS.map(({ key, label, Icon, items }) => (
          <button
            key={key}
            type="button"
            onClick={() => (items ? setSheet(key) : onNavigate?.("overview"))}
            aria-label={t(label)}
            title={t(label)}
            aria-current={activeTab === key ? "page" : undefined}
            className={activeTab === key ? "is-active" : ""}
          >
            <Icon aria-hidden="true" />
          </button>
        ))}
      </nav>

      {TABS.filter((tab) => tab.items).map((tab) => (
        <PatientNavSheet
          key={tab.key}
          open={sheet === tab.key}
          onOpenChange={(open) => setSheet(open ? tab.key : null)}
          title={tab.title}
          items={tab.items}
          onSelect={select}
        />
      ))}
    </>
  );
}