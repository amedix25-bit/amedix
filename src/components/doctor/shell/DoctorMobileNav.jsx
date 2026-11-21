import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAppLanguage } from "@/lib/appLanguage";
import PatientPortalSwitchAction from "@/components/portal/PatientPortalSwitchAction";

// Doctor Portal phone navigation — five fixed tabs. Overview and Communication
// open their screen straight away; Patients, Clinical and Settings open a
// slide-up submenu of the exact workflows they hold.
const PATIENTS = [
  { key: "search", label: "Find Patient" },
  { key: "emergency", label: "Emergency Access" },
  { key: "encounters", label: "Inpatient & ED" },
  { key: "notes", label: "Consult" },
];

const ORDERS = [
  { key: "labs", view: "create", label: "Create Lab Request" },
  { key: "labs", label: "Lab Requests & Results" },
  { key: "labs", view: "history", label: "Order History" },
  { key: "imaging", view: "form", label: "Create Imaging Request" },
  { key: "imaging", view: "list", label: "Imaging Requests & Reports" },
];

const SETTINGS = [
  { key: "professional-profile", label: "Professional Profile" },
  { key: "hospitals", label: "My Hospitals" },
  { key: "settings", label: "Settings" },
  { key: "logout", label: "Log out", danger: true },
];

const TAB_FOR_KEY = {
  overview: "overview",
  search: "patients",
  emergency: "patients",
  encounters: "patients",
  notes: "patients",
  labs: "clinical",
  imaging: "clinical",
  prescriptions: "clinical",
  communication: "communication",
  "professional-profile": "settings",
  hospitals: "settings",
  settings: "settings",
  help: "settings",
};

const TABS = [
  { key: "overview", label: "Home", Icon: LayoutDashboard },
  { key: "patients", label: "Patients", Icon: Users, sheet: "patients", title: "Patients" },
  { key: "clinical", label: "Clinical", Icon: Stethoscope, sheet: "clinical", title: "Clinical" },
  { key: "communication", label: "Communication", Icon: MessageSquare },
  { key: "settings", label: "Settings", Icon: Settings, sheet: "settings", title: "Settings" },
];

const SHEET_TITLES = { patients: "Patients", clinical: "Clinical", settings: "Settings" };

export default function DoctorMobileNav({ activeKey, onNavigate, onLogout, user }) {
  const { t } = useAppLanguage();
  const [sheet, setSheet] = useState(null);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const activeTab = TAB_FOR_KEY[activeKey] || null;

  const select = (item) => {
    setSheet(null);
    onNavigate(item);
  };

  const row = (item) => (
    <button
      key={item.label}
      type="button"
      onClick={() => (item.key === "logout" ? onLogout() : select(item))}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${
        item.danger ? "text-doctor-danger hover:bg-doctor-danger/5" : "text-primary hover:bg-doctor-rail"
      }`}
    >
      {item.danger ? <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{t(item.label)}</span>
      <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-40 rtl:rotate-180" aria-hidden="true" />
    </button>
  );

  return (
    <>
      <Sheet open={!!sheet} onOpenChange={(open) => !open && setSheet(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-0 bg-card px-3 pb-[calc(20px+env(safe-area-inset-bottom))] pt-2"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
          <SheetTitle className="px-3 pb-2 text-base font-bold text-primary">
            {t(SHEET_TITLES[sheet] || "")}
          </SheetTitle>
          <div className="space-y-0.5">
            {sheet === "patients" && PATIENTS.map(row)}

            {sheet === "clinical" && (
              <>
                <button
                  type="button"
                  onClick={() => setOrdersOpen((prev) => !prev)}
                  aria-expanded={ordersOpen}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-doctor-rail"
                >
                  <span className="truncate">{t("Orders & Results")}</span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 shrink-0 opacity-40 transition-transform ${ordersOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {ordersOpen && (
                  <div className="ml-3 space-y-0.5 border-l border-border pl-3">
                    {ORDERS.map((child, index) => (
                      <button
                        key={`${child.key}-${child.view || index}`}
                        type="button"
                        onClick={() => select(child)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] text-primary/75 transition-colors hover:bg-doctor-rail"
                      >
                        <span className="truncate">{t(child.label)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {row({ key: "prescriptions", label: "Prescriptions" })}
                {row({ route: "/clinical-references", label: "Resources" })}
              </>
            )}

            {sheet === "settings" && (
              <>
                {row(SETTINGS[0])}
                {row(SETTINGS[1])}
                {user && (
                  <div className="[&>button]:w-full [&>button]:justify-start [&>button]:px-3 [&>button]:py-3 [&>button]:text-sm [&>button]:text-primary">
                    <PatientPortalSwitchAction user={user} />
                  </div>
                )}
                {row(SETTINGS[2])}
                {row(SETTINGS[3])}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <nav
        className="fixed inset-x-2 bottom-[calc(10px+env(safe-area-inset-bottom))] z-40 rounded-2xl border border-primary/10 bg-card shadow-[0_14px_32px_-20px_rgba(23,50,77,0.65)] lg:hidden"
        aria-label={t("Doctor Portal")}
      >
        <div className="flex items-stretch justify-between px-1 py-1">
          {TABS.map(({ key, label, Icon, sheet: tabSheet }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => (tabSheet ? setSheet(tabSheet) : onNavigate({ key }))}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold leading-[1.15] transition-colors ${
                  isActive ? "text-doctor-blue" : "text-primary/60"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="flex min-h-[24px] w-full items-center justify-center break-words text-center">
                  {t(label)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}