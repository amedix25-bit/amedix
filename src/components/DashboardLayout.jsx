import React, { useState } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { clearDoctorHospitalSession } from "@/lib/doctorHospitalSession";
import { getPortalAccent } from "@/lib/portalAccent";

// Which portal the notification settings page should return to, per sidebar accent.
const SETTINGS_PORTAL = {
  patient: "patient",
  doctor: "doctor",
  lab: "laboratory",
  radiology: "radiology",
  pharmacy: "pharmacy",
  hospital: "hospital",
  insurance: "patient",
};

export default function DashboardLayout({ navItems, navGroups, activeKey, onNavClick, roleLabel, logoutLabel, logo: Logo = BrandLogo, sidebarAction, accent = "patient", sidebarTheme = "light", renderSidebar, sidebarWidth = "w-64", mainClassName = "", mobileHeader, mobileNav, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navy = sidebarTheme === "navy";

  const handleLogout = () => {
    clearDoctorHospitalSession();
    base44.auth.logout(window.location.origin);
  };

  // A portal may supply its own sidebar; it is used on desktop and in the
  // mobile drawer alike, so both always show the same navigation.
  const renderSidebarContent = (close) => {
    if (renderSidebar) return renderSidebar({ close, onLogout: handleLogout });
    return (
      <SidebarContent
        navItems={navItems}
        navGroups={navGroups}
        activeKey={activeKey}
        onNavClick={(key) => {
          onNavClick(key);
          if (close) close();
        }}
        roleLabel={roleLabel}
        logoutLabel={logoutLabel}
        onLogout={handleLogout}
        logo={Logo}
        sidebarAction={sidebarAction}
        accent={accent}
        theme={sidebarTheme}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`hidden lg:flex ${sidebarWidth} flex-col border-r rtl:border-l rtl:border-r-0 ${navy ? "bg-doctor-rail border-primary/10" : "bg-sidebar border-border"}`}>
        {renderSidebarContent()}
      </aside>

      {!mobileHeader && sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className={`relative ${sidebarWidth} flex flex-col ${navy ? "bg-doctor-rail" : "bg-sidebar"}`}>
            <button onClick={() => setSidebarOpen(false)} className={`absolute top-4 right-4 z-10 ${navy ? "text-primary/70" : "text-muted-foreground"}`}>
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent(() => setSidebarOpen(false))}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {mobileHeader ? (
          <div className="lg:hidden">{mobileHeader}</div>
        ) : (
          <header className={`lg:hidden flex items-center justify-between border-b px-4 py-3 ${navy ? "bg-doctor-rail border-primary/10" : "border-border"}`}>
            <button onClick={() => setSidebarOpen(true)} className={navy ? "text-primary/80" : "text-muted-foreground"}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Logo fittingType="fill" className={navy ? "w-8 h-8 rounded-full" : "w-9 h-9 rounded-full"} />
              <span className={`font-bold text-sm ${navy ? "text-primary" : ""}`}>AMedix</span>
            </div>
            <AppLanguageSwitcher />
          </header>
        )}

        <main className={`flex-1 overflow-y-auto ${navy ? "bg-doctor-surface" : ""} ${mobileNav ? "pb-24 lg:pb-0" : ""} ${mainClassName}`}>
          {children}
        </main>
      </div>
      {mobileNav}
    </div>
  );
}

function SidebarContent({ navItems, navGroups, activeKey, onNavClick, roleLabel, logoutLabel, onLogout, logo: Logo = BrandLogo, sidebarAction, accent = "patient", theme = "light" }) {
  const { t } = useAppLanguage();
  const accentCfg = getPortalAccent(accent);
  const navy = theme === "navy";

  const renderItem = (item) => {
    const Icon = item.icon;
    const isActive = item.key === activeKey;
    const activeCls = navy ? "bg-doctor-blue text-white shadow-sm" : accentCfg.activeNav;
    const idleCls = navy ? "text-primary/70 hover:bg-white hover:text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent";
    return (
      <button
        key={item.key}
        onClick={() => onNavClick(item.key)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left leading-snug transition-colors ${
          isActive ? activeCls : idleCls
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="truncate">{t(item.label)}</span>
        {item.badge > 0 ? (
          <span className={`ml-auto rtl:mr-auto rtl:ml-0 shrink-0 rounded-full border px-1.5 text-[10px] font-semibold ${navy ? "border-primary/20 bg-white text-primary" : "border-critical/30 bg-critical/10 text-critical"}`}>
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        ) : isActive ? (
          <span className="ml-auto rtl:mr-auto rtl:ml-0 w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
        ) : null}
      </button>
    );
  };
  return (
    <>
      <div className={`p-6 border-b ${navy ? "border-primary/10" : "border-sidebar-border"}`}>
        <div className="flex items-center gap-4">
          <Logo className="w-24 h-24 shrink-0" />
          <div className="min-w-0">
            <span className={`font-bold text-3xl tracking-tight leading-tight block ${navy ? "text-primary" : ""}`}>AMedix</span>
            {roleLabel && (
              <p className={`text-xs font-medium ${navy ? "text-primary/60" : accentCfg.heading}`}>
                {t(roleLabel)}
              </p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navGroups
          ? navGroups.map((group) => (
              <div key={group.title} className="pb-2">
                <p className={`px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${navy ? "text-primary/50" : "text-muted-foreground"}`}>
                  {t(group.title)}
                </p>
                <div className="space-y-1">{group.items.map(renderItem)}</div>
              </div>
            ))
          : (navItems || []).map(renderItem)}
      </nav>

      <div className={`p-4 border-t space-y-3 ${navy ? "border-primary/10" : "border-sidebar-border"}`}>
        {sidebarAction}
        <div className="flex justify-center">
          <AppLanguageSwitcher />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => {
            window.location.href = `/notification-settings?portal=${SETTINGS_PORTAL[accent] || "patient"}`;
          }}
        >
          <Bell className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t("Notification settings")}
        </Button>
        {navy ? (
          <Button
            size="sm"
            className="w-full justify-start bg-doctor-danger text-white hover:bg-doctor-danger/90"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t(logoutLabel || "Log out")}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t(logoutLabel || "Log out")}
          </Button>
        )}
      </div>
    </>
  );
}