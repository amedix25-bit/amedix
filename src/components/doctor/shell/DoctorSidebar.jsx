import React, { useEffect, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";

// The Doctor Portal sidebar — light blue navigation rail with the AMedix lockup,
// the doctor's sections (some grouped into expandable menus), then Settings, Help
// & Support and the red Log Out action. Used on desktop and inside the mobile
// drawer alike, so both always show exactly the same navigation.
const isGroup = (item) => Array.isArray(item.items) && item.items.length > 0;
const groupContains = (item, key) => isGroup(item) && item.items.some((c) => c.key === key);

export default function DoctorSidebar({ navItems = [], activeKey, activeView, onNavClick, onLogout, close, sidebarAction, subtitle = "Doctor Portal" }) {
  const { t } = useAppLanguage();
  // Groups open automatically when they hold the page the doctor is on.
  const [openGroups, setOpenGroups] = useState(() => navItems.filter((i) => groupContains(i, activeKey)).map((i) => i.key));

  useEffect(() => {
    setOpenGroups((prev) => {
      const active = navItems.filter((i) => groupContains(i, activeKey)).map((i) => i.key);
      return active.every((k) => prev.includes(k)) ? prev : [...new Set([...prev, ...active])];
    });
  }, [activeKey, navItems]);

  const toggleGroup = (key) => setOpenGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleClick = (item) => {
    onNavClick(item);
    if (close) close();
  };

  const badge = (item) =>
    item.badge > 0 ? (
      <span className="ml-auto rtl:mr-auto rtl:ml-0 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-doctor-blue px-1.5 text-[11px] font-semibold text-white">
        {item.badge > 99 ? "99+" : item.badge}
      </span>
    ) : null;

  const renderLeaf = (item) => {
    const Icon = item.icon;
    const isActive = item.key === activeKey;
    return (
      <button
        key={item.key}
        onClick={() => handleClick(item)}
        aria-current={isActive ? "page" : undefined}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
          isActive ? "bg-doctor-blue text-white shadow-sm" : "text-primary/75 hover:bg-white hover:text-primary"
        }`}
      >
        {Icon ? <Icon className="h-[18px] w-[18px] shrink-0" /> : null}
        <span className="truncate">{t(item.label)}</span>
        {badge(item)}
      </button>
    );
  };

  const renderGroup = (item) => {
    const Icon = item.icon;
    const isOpen = openGroups.includes(item.key);
    const hasActive = groupContains(item, activeKey);
    return (
      <div key={item.key}>
        <button
          onClick={() => toggleGroup(item.key)}
          aria-expanded={isOpen}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            hasActive ? "bg-white text-primary shadow-sm" : "text-primary/75 hover:bg-white hover:text-primary"
          }`}
        >
          {Icon ? <Icon className="h-[18px] w-[18px] shrink-0" /> : null}
          <span className="truncate">{t(item.label)}</span>
          <ChevronDown className={`ml-auto rtl:mr-auto rtl:ml-0 h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        <div className={`grid overflow-hidden transition-all duration-200 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="min-h-0">
            <div className="mt-1 space-y-0.5 pl-9 pr-1 rtl:pl-1 rtl:pr-9">
              {item.items.map((child, index) => {
                const childActive = child.key === activeKey && (child.view || null) === (activeView || null);
                return (
                  <button
                    key={`${child.key}-${child.view || child.route || index}`}
                    onClick={() => handleClick(child)}
                    aria-current={childActive ? "page" : undefined}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                      childActive ? "bg-doctor-blue font-semibold text-white" : "text-primary/60 hover:bg-white hover:text-primary"
                    }`}
                  >
                    <span className="truncate">{t(child.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-doctor-rail">
      <div className="px-5 pb-5 pt-6">
        <BrandLogo className="h-24 w-24 shrink-0" />
        <p className="mt-3 truncate text-3xl font-bold leading-none tracking-tight text-primary">AMedix</p>
        <p className="mt-2 truncate text-sm font-semibold leading-none text-primary/70">{t(subtitle)}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => (isGroup(item) ? renderGroup(item) : renderLeaf(item)))}
      </nav>

      <div className="space-y-3 border-t border-primary/10 px-3 py-4">
        {sidebarAction}
        <div className="flex justify-center">
          <AppLanguageSwitcher />
        </div>
        <button
          onClick={onLogout}
          className="mx-auto flex w-full max-w-[190px] items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-doctor-danger-deep to-doctor-danger px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <LogOut className="h-4 w-4" />
          {t("Log out")}
        </button>
      </div>
    </div>
  );
}