import React from "react";
import { Activity, LogOut } from "lucide-react";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";

// The Doctor Portal sidebar — navy navigation rail with the AMedix lockup at
// the top, one flat list of the doctor's sections and a footer holding the
// portal controls and the red Log Out action. Used on desktop and inside the
// mobile drawer alike.
export default function DoctorSidebar({ navItems = [], activeKey, onNavClick, onLogout, close, sidebarAction }) {
  const { t } = useAppLanguage();

  return (
    <div className="flex h-full flex-col bg-doctor-navy">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-doctor-blue">
          <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl font-bold leading-none tracking-tight text-white">AMedix</p>
          <p className="mt-1 truncate text-[11px] font-medium leading-none text-white/60">{t("Doctor Portal")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => {
                onNavClick(item.key);
                if (close) close();
              }}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                isActive ? "bg-doctor-blue text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{t(item.label)}</span>
              {item.badge > 0 ? (
                <span className="ml-auto rtl:mr-auto rtl:ml-0 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-doctor-blue px-1.5 text-[11px] font-semibold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 px-3 py-4">
        {sidebarAction}
        <div className="flex justify-center">
          <AppLanguageSwitcher />
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-doctor-danger-deep to-doctor-danger px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <LogOut className="h-4 w-4" />
          {t("Log out")}
        </button>
      </div>
    </div>
  );
}