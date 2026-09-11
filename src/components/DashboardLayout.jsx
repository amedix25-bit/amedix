import React, { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function DashboardLayout({ navItems, activeKey, onNavClick, roleLabel, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    base44.auth.logout(window.location.origin);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-sidebar">
        <SidebarContent navItems={navItems} activeKey={activeKey} onNavClick={onNavClick} roleLabel={roleLabel} onLogout={handleLogout} />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-sidebar">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-muted-foreground z-10">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent navItems={navItems} activeKey={activeKey} onNavClick={(key) => { onNavClick(key); setSidebarOpen(false); }} roleLabel={roleLabel} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between border-b border-border px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <BrandLogo className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-sm">AMedix</span>
          </div>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navItems, activeKey, onNavClick, roleLabel, onLogout }) {
  return (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <BrandLogo className="w-9 h-9 rounded-xl" />
          <div>
            <span className="font-bold text-sm">AMedix</span>
            {roleLabel && <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>}
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </div>
    </>
  );
}