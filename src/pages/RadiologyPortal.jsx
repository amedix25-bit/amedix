import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import PortalDashboard from "@/components/radiology/portal/PortalDashboard";
import StudiesWorklist from "@/components/radiology/portal/StudiesWorklist";
import ViewerModule from "@/components/radiology/portal/ViewerModule";
import ReportsModule from "@/components/radiology/portal/ReportsModule";
import PatientHistoryModule from "@/components/radiology/portal/PatientHistoryModule";
import StaffModule from "@/components/radiology/portal/StaffModule";
import PacsModule from "@/components/radiology/portal/PacsModule";
import SettingsModule from "@/components/radiology/portal/SettingsModule";
import DemoEnvironmentCard from "@/components/radiology/portal/DemoEnvironmentCard";
import DeploymentModeBanner from "@/components/radiology/portal/DeploymentModeBanner";
import {
  Loader2, LayoutDashboard, ClipboardList, ScanLine, FileText, Users, Network, Settings,
  History, ShieldAlert, Inbox, FlaskConical,
} from "lucide-react";

const NAV = [
  { key: "dashboard", label: "Radiology Dashboard", icon: LayoutDashboard },
  { key: "requests", label: "Imaging Requests", icon: Inbox },
  { key: "worklist", label: "Imaging Worklist", icon: ClipboardList },
  { key: "viewer", label: "DICOM Viewer", icon: ScanLine },
  { key: "reports", label: "Radiology Reports", icon: FileText },
  { key: "patients", label: "Patient History", icon: History },
  { key: "staff", label: "Radiology Staff", icon: Users, adminOnly: true },
  { key: "pacs", label: "PACS Integration", icon: Network, adminOnly: true },
  { key: "settings", label: "Settings & Audit", icon: Settings, adminOnly: true },
  { key: "demo", label: "Demonstration & Rollout", icon: FlaskConical },
];

// AMedix Radiology Portal — the facility radiology department's own workspace:
// dashboard, requests, worklist, study viewer, reports, patient history, staff,
// PACS integration and settings. Every read and write is authorized and scoped
// server-side to the caller's facility, so one hospital never sees another's
// studies. Interpretation itself stays in the Radiologist Portal.
export default function RadiologyPortal() {
  const { user } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [context, setContext] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await base44.functions.invoke("radiologyPortal", { action: "context" });
        setContext(res.data || null);
        setError("");
      } catch (err) {
        setContext(null);
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = NAV.filter((n) => !n.adminOnly || (context && context.actor.isAdministrator));
  const current = items.find((n) => n.key === active) || items[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center max-w-md">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-semibold">AMedix Radiology Portal</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error || "Radiology Portal access is limited to a facility's radiology administrator, its designated radiology staff and its authorized radiologists."}
          </p>
        </div>
      </div>
    );
  }

  const roleLabel =
    context.actor.role === "administrator"
      ? "Radiology Administrator"
      : context.actor.role === "technician"
        ? "Radiology Technician"
        : "Radiologist";

  return (
    <DashboardLayout
      navItems={items}
      activeKey={active}
      onNavClick={setActive}
      roleLabel={roleLabel}
      accent="radiology"
    >
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            AMedix Radiology
          </p>
          <h1 className="text-2xl font-bold mt-1">{current.label}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {context.actor.hospitalName || "Radiology facility"} · {roleLabel}
            {context.actor.displayName ? ` · ${context.actor.displayName}` : ""}
          </p>
        </div>

        <DeploymentModeBanner
          mode={context.deployment_mode}
          onOpenDemo={() => setActive("demo")}
        />

        {active === "dashboard" && (
          <PortalDashboard
            key={refreshKey}
            role={context.actor.role}
            hospitalName={context.actor.hospitalName}
            onNavigate={setActive}
          />
        )}
        {active === "requests" && (
          <StudiesWorklist mode="requests" role={context.actor.role} canReport={context.actor.canReport} />
        )}
        {active === "worklist" && (
          <StudiesWorklist mode="worklist" role={context.actor.role} canReport={context.actor.canReport} />
        )}
        {active === "viewer" && (
          <ViewerModule
            role={context.actor.role}
            mode={context.deployment_mode}
            onImported={() => setRefreshKey((k) => k + 1)}
          />
        )}
        {active === "reports" && <ReportsModule role={context.actor.role} />}
        {active === "patients" && <PatientHistoryModule />}
        {active === "staff" && <StaffModule />}
        {active === "pacs" && <PacsModule mode={context.deployment_mode} />}
        {active === "settings" && <SettingsModule />}
        {active === "demo" && (
          <DemoEnvironmentCard
            onSeeded={() => setRefreshKey((k) => k + 1)}
            onModeChange={(mode) => setContext((c) => (c ? { ...c, deployment_mode: mode } : c))}
          />
        )}
      </div>
    </DashboardLayout>
  );
}