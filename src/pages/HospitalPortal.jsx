import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import HospitalCommandCenter from "@/components/hospital/command/HospitalCommandCenter";
import HospitalManagePatientsSection from "@/components/hospital/portal/HospitalManagePatientsSection";
import HospitalDoctorsSection from "@/components/hospital/portal/HospitalDoctorsSection";
import HospitalReceptionistsSection from "@/components/hospital/portal/HospitalReceptionistsSection";
import HospitalProfileSection from "@/components/hospital/portal/HospitalProfileSection";
import HospitalProfileCard from "@/components/hospital/portal/HospitalProfileCard";
import HospitalLabPanelsSection from "@/components/hospital/portal/HospitalLabPanelsSection";
import HospitalRadiologySection from "@/components/hospital/portal/HospitalRadiologySection";
import HospitalMessagingSection from "@/components/hospital/portal/HospitalMessagingSection";
import HospitalEmergencySection from "@/components/hospital/portal/HospitalEmergencySection";
import HospitalAuthorizationGate from "@/components/hospital/authorization/HospitalAuthorizationGate";
import PartnerSubscriptionSection from "@/components/partner/PartnerSubscriptionSection";
import useMessagingNotifications from "@/hooks/useMessagingNotifications";
import { Loader2 } from "lucide-react";
import { LayoutDashboard, ClipboardList, UserCog, Building2, Stethoscope, FlaskConical, Megaphone, Radiation, MessagesSquare, ShieldAlert } from "lucide-react";

const COMMAND_CENTER = { key: "dashboard", label: "Command Center", icon: LayoutDashboard };
const EMERGENCY_QR = { key: "emergency", label: "Emergency QR", icon: ShieldAlert };

const navItems = [
  COMMAND_CENTER,
  { key: "messages", label: "Doctor Messages", icon: MessagesSquare },
  { key: "patients", label: "Manage Patients", icon: ClipboardList },
  { key: "doctors", label: "Manage Doctors", icon: Stethoscope },
  { key: "panels", label: "Lab Panels", icon: FlaskConical },
  { key: "radiology", label: "Radiology Dept.", icon: Radiation },
  { key: "staff", label: "Receptionists", icon: UserCog },
  { key: "partnership", label: "Partnership", icon: Megaphone },
  { key: "profile", label: "Profile", icon: Building2 },
  EMERGENCY_QR,
];

// Grouped navigation, the same workspaces organised by operational area.
const NAV_GROUPS = [
  { title: "Overview", items: [COMMAND_CENTER, navItems[1]] },
  { title: "Clinical Operations", items: [navItems[2], navItems[3], navItems[4], navItems[5], EMERGENCY_QR] },
  { title: "Administration", items: [navItems[6], navItems[7], navItems[8]] },
];

export default function HospitalPortal() {
  const { user } = useAuth();
  const { t } = useAppLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  // AMedix administrative authorization state — the server's answer decides
  // whether the workspace opens or the activation gate is shown.
  const [authorization, setAuthorization] = useState(null);
  const [loading, setLoading] = useState(true);
  // Unread messaging notifications, shown on the Doctor Messages navigation
  // item so an incoming message is visible from anywhere in the portal.
  const { unread: messagingUnread } = useMessagingNotifications({ enabled: !!user });

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const profiles = await base44.entities.HospitalProfile.filter({ user_id: user.id });
      if (profiles.length === 0) {
        // Designated messaging staff sign in without owning a hospital
        // profile; they open only their hospital's communication center.
        const res = await base44.functions.invoke("messagingApi", { action: "context" }).catch(() => null);
        if (res?.data?.actor?.role === "hospital") {
          setProfile({ id: "", hospital_name: res.data.actor.hospital_name, is_messaging_staff: true });
          setAuthorization({ is_activated: true });
          setActiveTab("messages");
          return;
        }
        navigate("/home");
        return;
      }
      setProfile(profiles[0]);
      const status = await base44.functions.invoke("hospitalAuthorization", { action: "status" });
      setAuthorization(status.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !profile || !authorization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Nothing in the workspace is reachable before AMedix administrative
  // authorization: the hospital must activate its issued authorization code
  // before any Hospital Code can exist.
  if (!authorization.is_activated) {
    return <HospitalAuthorizationGate profile={profile} initial={authorization} onActivated={load} />;
  }

  const withBadge = (list) =>
    list.map((n) => (n.key === "messages" ? { ...n, badge: messagingUnread } : n));
  const visibleNav = withBadge(profile.is_messaging_staff ? navItems.filter((n) => n.key === "messages") : navItems);
  const visibleGroups = profile.is_messaging_staff
    ? [{ title: "Overview", items: withBadge([navItems[1]]) }]
    : NAV_GROUPS.map((g) => ({ ...g, items: withBadge(g.items) }));

  return (
    <DashboardLayout
      navGroups={visibleGroups}
      activeKey={activeTab}
      onNavClick={setActiveTab}
      roleLabel="Hospital OS"
      accent="hospital"
      sidebarAction={profile.is_messaging_staff ? null : <HospitalProfileCard profile={profile} />}
    >
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        {activeTab !== "dashboard" && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{t(visibleNav.find((n) => n.key === activeTab)?.label)}</h1>
            <p className="text-muted-foreground text-sm mt-1">{profile.hospital_name}</p>
          </div>
        )}

        {activeTab === "messages" && <HospitalMessagingSection profile={profile} />}
        {activeTab === "dashboard" && (
          <HospitalCommandCenter
            profile={profile}
            userName={user?.full_name}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === "patients" && <HospitalManagePatientsSection profile={profile} />}
        {activeTab === "doctors" && <HospitalDoctorsSection profile={profile} />}
        {activeTab === "panels" && <HospitalLabPanelsSection profile={profile} />}
        {activeTab === "radiology" && <HospitalRadiologySection profile={profile} onUpdate={setProfile} />}
        {activeTab === "staff" && <HospitalReceptionistsSection profile={profile} />}
        {activeTab === "partnership" && (
          <PartnerSubscriptionSection partnerType="hospital" profile={profile} />
        )}
        {activeTab === "emergency" && <HospitalEmergencySection profile={profile} />}
        {activeTab === "profile" && <HospitalProfileSection profile={profile} onUpdate={setProfile} />}
      </div>
    </DashboardLayout>
  );
}