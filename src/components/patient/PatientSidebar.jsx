import React, { useState } from "react";
import {
  Home as HomeIcon,
  Calendar,
  FolderOpen,
  ChevronDown,
  Stethoscope,
  FileText,
  ClipboardList,
  FlaskConical,
  ScanLine,
  Pill,
  UserCircle,
  User,
  ShieldCheck,
  LogOut,
  Languages,
  MessageSquare,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { cn } from "@/lib/utils";

// Patient portal sidebar — sectioned navigation with collapsible groups,
// language selection and log out. Every item opens one of the portal's
// existing tabs; no new destination is introduced.
export const NAV_SECTIONS = [
  { type: "item", key: "overview", label: "Home", icon: HomeIcon, block: true },
  { type: "item", key: "appointments", label: "Appointments", icon: Calendar },
  { type: "item", key: "messages", label: "Messages from Doctors", icon: MessageSquare },
  {
    type: "group",
    key: "record",
    label: "My Medical Record",
    icon: FolderOpen,
    divider: true,
    items: [
      { key: "doctorvisits", label: "Doctors' Visits & Consultations", icon: Stethoscope },
      { key: "documents", label: "Medical Documents", icon: FileText },
      { key: "health", label: "Medical History & Conditions", icon: ClipboardList },
    ],
  },
  { type: "item", key: "labs", label: "Lab Tests & Results", icon: FlaskConical, divider: true },
  { type: "item", key: "imaging", label: "X-rays & Scans", icon: ScanLine },
  { type: "item", key: "drugs", label: "Medications & Prescriptions", icon: Pill },
  {
    type: "group",
    key: "settings",
    label: "Profile & Settings",
    icon: UserCircle,
    divider: true,
    items: [
      { key: "profile", label: "Personal Information", icon: User },
      { key: "access", label: "Access & Privacy", icon: ShieldCheck },
    ],
  },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((section) => (section.type === "group" ? section.items : [section]));

export function patientNavLabel(key) {
  return ALL_ITEMS.find((item) => item.key === key)?.label || "";
}

export default function PatientSidebar({ activeKey, onNavClick, onLogout, sidebarAction, close }) {
  const { t, isArabic, setLang } = usePatientLanguage();
  const [overrides, setOverrides] = useState({});

  const isOpen = (group) => overrides[group.key] ?? group.items.some((item) => item.key === activeKey);

  const go = (key) => {
    onNavClick(key);
    if (close) close();
  };

  return (
    <div className="flex h-full flex-col bg-muted">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <BrandLogo className="h-16 w-16 shrink-0" />
        <div className="min-w-0">
          <span className="block text-2xl font-bold tracking-tight">AMedix</span>
          <p className="text-xs font-medium text-primary">{t("Patient")}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_SECTIONS.map((section) => (
          <React.Fragment key={section.key}>
            {section.divider && <div className="my-2 border-t border-border" />}

            {section.type === "item" ? (
              <NavItem item={section} active={section.key === activeKey} label={t(section.label)} onClick={() => go(section.key)} />
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setOverrides((prev) => ({ ...prev, [section.key]: !isOpen(section) }))}
                  aria-expanded={isOpen(section)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-accent rtl:flex-row-reverse rtl:text-right"
                >
                  <section.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{t(section.label)}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen(section) && "rotate-180",
                    )}
                  />
                </button>

                {isOpen(section) && (
                  <div className="mb-1 mt-1 space-y-0.5 pl-4 rtl:pl-0 rtl:pr-4">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = item.key === activeKey;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => go(item.key)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] leading-snug transition-colors rtl:flex-row-reverse rtl:text-right",
                            active
                              ? "bg-accent font-semibold text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{t(item.label)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border px-3 py-3">
        {sidebarAction}

        <div className="rounded-xl bg-secondary p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Languages className="h-3.5 w-3.5" />
            {t("Choose Your Language")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { code: "en", label: "English", selected: !isArabic },
              { code: "ar", label: "العربية", selected: isArabic },
            ].map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => setLang(option.code)}
                className={cn(
                  "rounded-lg py-2 text-sm font-semibold transition-colors",
                  option.selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-card text-foreground hover:bg-accent",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
        >
          <LogOut className="h-4 w-4" />
          {t("Log Out")}
        </button>
      </div>
    </div>
  );
}

function NavItem({ item, active, label, onClick }) {
  const Icon = item.icon;

  if (item.block) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-semibold transition-colors rtl:flex-row-reverse rtl:text-right",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "border border-border bg-card text-foreground hover:bg-accent",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors rtl:flex-row-reverse rtl:text-right",
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-accent",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}