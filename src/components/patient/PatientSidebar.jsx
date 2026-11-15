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
  MessageSquare,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { cn } from "@/lib/utils";

// Patient portal sidebar — glass navigation rail with the collapsible record
// and settings groups. Every item opens one of the portal's existing tabs; no
// new destination is introduced.
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

function NavItem({ item, active, label, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mb-1 flex w-full items-center gap-3 rounded-xl text-left transition-colors rtl:flex-row-reverse rtl:text-right",
        item.block ? "px-4 py-3 text-[15px] font-semibold" : "px-3 py-2.5 text-sm font-medium",
        active
          ? "bg-patient-ink text-white shadow-[0_10px_24px_-14px_hsl(210_65%_20%_/_0.9)]"
          : "text-patient-ink hover:bg-patient-accent/8",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-patient-muted")} />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function PatientSidebar({ activeKey, onNavClick, onLogout, sidebarAction, close }) {
  const { t, isArabic, setLang } = usePatientLanguage();
  const [overrides, setOverrides] = useState({});

  const isOpen = (group) => overrides[group.key] ?? group.items.some((item) => item.key === activeKey);

  const go = (key) => {
    onNavClick(key);
    if (close) close();
  };

  const renderGroup = (group) => {
    const Icon = group.icon;
    const open = isOpen(group);
    return (
      <div>
        <button
          type="button"
          onClick={() => setOverrides((prev) => ({ ...prev, [group.key]: !open }))}
          aria-expanded={open}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-patient-ink transition-colors hover:bg-patient-accent/8 rtl:flex-row-reverse rtl:text-right"
        >
          <Icon className="h-5 w-5 shrink-0 text-patient-muted" />
          <span className="flex-1 truncate">{t(group.label)}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-patient-muted transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="mb-1 mt-1 space-y-0.5 pl-4 rtl:pl-0 rtl:pr-4">
            {group.items.map((item) => {
              const ItemIcon = item.icon;
              const active = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => go(item.key)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] leading-snug transition-colors rtl:flex-row-reverse rtl:text-right",
                    active
                      ? "bg-patient-accent/12 font-semibold text-patient-accent"
                      : "text-patient-muted hover:bg-patient-accent/8 hover:text-patient-ink",
                  )}
                >
                  <ItemIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(item.label)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-card/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-white/60 px-4 py-4">
        <BrandLogo className="h-14 w-14 shrink-0" />
        <div className="min-w-0">
          <span className="block text-xl font-bold tracking-tight text-patient-ink">AMedix</span>
          <p className="text-xs font-medium text-patient-muted">{t("Patient Portal")}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.key}>
            {section.divider && <div className="my-2 border-t border-border/50" />}
            {section.type === "item" ? (
              <NavItem
                item={section}
                active={section.key === activeKey}
                label={t(section.label)}
                onClick={() => go(section.key)}
              />
            ) : (
              renderGroup(section)
            )}
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/60 px-3 py-3">
        {sidebarAction}

        <div className="rounded-2xl bg-patient-canvas/80 p-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { code: "en", label: "English", selected: !isArabic },
              { code: "ar", label: "العربية", selected: isArabic },
            ].map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => setLang(option.code)}
                className={cn(
                  "rounded-xl px-2 py-2 text-xs font-semibold transition-colors",
                  option.selected
                    ? "bg-patient-accent text-white shadow-sm"
                    : "text-patient-muted hover:bg-card hover:text-patient-ink",
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-patient-red/25 bg-patient-red/8 px-4 py-2.5 text-sm font-semibold text-patient-red transition-colors hover:bg-patient-red/12"
        >
          <LogOut className="h-4 w-4" />
          {t("Log Out")}
        </button>
      </div>
    </div>
  );
}