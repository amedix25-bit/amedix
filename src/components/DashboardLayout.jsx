import React, { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { clearDoctorHospitalSession } from "@/lib/doctorHospitalSession";
import { getPortalAccent } from "@/lib/portalAccent";

export default function DashboardLayout({ navItems, activeKey, onNavClick, roleLabel, logoutLabel, logo: Logo = BrandLogo, sidebarAction, accent = "patient", children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearDoctorHospitalSession();
    base44.auth.logout(window.location.origin);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex w-64 flex-col border-r rtl:border-l rtl:border-r-0 border-border bg-sidebar">
        <SidebarContent navItems={navItems} activeKey={activeKey} onNavClick={onNavClick} roleLabel={roleLabel} logoutLabel={logoutLabel} onLogout={handleLogout} logo={Logo} sidebarAction={sidebarAction} accent={accent} />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-sidebar">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-muted-foreground z-10">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent navItems={navItems} activeKey={activeKey} onNavClick={(key) => { onNavClick(key); setSidebarOpen(false); }} roleLabel={roleLabel} logoutLabel={logoutLabel} onLogout={handleLogout} logo={Logo} sidebarAction={sidebarAction} accent={accent} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between border-b border-border px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Logo fittingType="fill" className="w-9 h-9 rounded-full" />
            <span className="font-bold text-sm">AMedix</span>
          </div>
          <AppLanguageSwitcher />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navItems, activeKey, onNavClick, roleLabel, logoutLabel, onLogout, logo: Logo = BrandLogo, sidebarAction, accent = "patient" }) {
  const { t } = useAppLanguage();
  const accentCfg = getPortalAccent(accent);
  return (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-4">
          <Logo fittingType="fill" className="w-20 h-20 rounded-full shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-2xl tracking-tight leading-tight block">AMedix</span>
            {roleLabel && (
              <p className={`text-xs font-medium ${accentCfg.heading}`}>
                {t(roleLabel)}
              </p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => onNavClick(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left leading-snug transition-colors ${
                isActive
                  ? accentCfg.activeNav
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{t(item.label)}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        {sidebarAction}
        <div className="flex justify-center">
          <AppLanguageSwitcher />
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t(logoutLabel || "Log out")}
        </Button>
      </div>
    </>
  );
}