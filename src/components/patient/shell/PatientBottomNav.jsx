import React from "react";
import { Home, CreditCard, CalendarDays, FolderOpen, Menu } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Phone-only navigation: the four places a patient opens most, plus the full menu.
const ITEMS = [
  { key: "overview", label: "Home", Icon: Home },
  { key: "medicalcard", label: "Medical Card", Icon: CreditCard },
  { key: "appointments", label: "Appointments", Icon: CalendarDays },
  { key: "health", label: "Records", Icon: FolderOpen },
];

export default function PatientBottomNav({ activeKey, onNavigate, onMenu }) {
  const { t } = usePatientLanguage();
  return (
    <nav className="pp-bottom-nav" aria-label={t("Patient Portal")}>
      {ITEMS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onNavigate?.(key)}
          aria-current={activeKey === key ? "page" : undefined}
          className={activeKey === key ? "is-active" : ""}
        >
          <Icon aria-hidden="true" />
          <span>{t(label)}</span>
        </button>
      ))}
      <button type="button" onClick={onMenu}>
        <Menu aria-hidden="true" />
        <span>{t("Menu")}</span>
      </button>
    </nav>
  );
}