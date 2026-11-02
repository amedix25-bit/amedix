import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import HospitalDashboardSection from "@/components/hospital/portal/HospitalDashboardSection";
import HospitalManagePatientsSection from "@/components/hospital/portal/HospitalManagePatientsSection";
import HospitalDoctorsSection from "@/components/hospital/portal/HospitalDoctorsSection";
import HospitalReceptionistsSection from "@/components/hospital/portal/HospitalReceptionistsSection";
import HospitalProfileSection from "@/components/hospital/portal/HospitalProfileSection";
import HospitalLabPanelsSection from "@/components/hospital/portal/HospitalLabPanelsSection";
import HospitalRadiologySection from "@/components/hospital/portal/HospitalRadiologySection";
import HospitalMessagingSection from "@/components/hospital/portal/HospitalMessagingSection";
import PartnerSubscriptionSection from "@/components/partner/PartnerSubscriptionSection";
import useMessagingNotifications from "@/hooks/useMessagingNotifications";
import { Loader2 } from "lucide-react";
import { LayoutDashboard, ClipboardList, UserCog, Building2, Stethoscope, FlaskConical, Megaphone, Radiation, MessagesSquare } from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "messages", label: "Doctor Messages", icon: MessagesSquare },
  { key: "patients", label: "Manage Patients", icon: ClipboardList },
  { key: "doctors", label: "Manage Doctors", icon: Stethoscope },
  { key: "panels", label: "Lab Panels", icon: FlaskConical },
  { key: "radiology", label: "Radiology Dept.", icon: Radiation },
  { key: "staff", label: "Receptionists", icon: UserCog },
  { key: "partnership", label: "Partnership", icon: Megaphone },
  { key: "profile", label: "Profile", icon: Building2 },
];

export default function HospitalPortal() {
  const { user } = useAuth();
  const { t } = useAppLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Unread messaging notifications, shown on the Doctor Messages navigation
  // item so an incoming message is visible from anywhere in the portal.
  const { unread: messagingUnread } = useMessagingNotifications({ enabled: !!user });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const profiles = await base44.entities.HospitalProfile.filter({ user_id: user.id });
        if (profiles.length === 0) {
          // Designated messaging staff sign in without owning a hospital
          // profile; they open only their hospital's communication center.
          const res = await base44.functions.invoke("messagingApi", { action: "context" }).catch(() => null);
          if (res?.data?.actor?.role === "hospital") {
            setProfile({ id: "", hospital_name: res.data.actor.hospital_name, is_messaging_staff: true });
            setActiveTab("messages");
            return;
          }
          navigate("/home");
          return;
        }
        setProfile(profiles[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const visibleNav = (profile.is_messaging_staff ? navItems.filter((n) => n.key === "messages") : navItems)
    .map((n) => (n.key === "messages" ? { ...n, badge: messagingUnread } : n));

  return (
    <DashboardLayout navItems={visibleNav} activeKey={activeTab} onNavClick={setActiveTab} roleLabel="Hospital Portal" accent="hospital">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t(visibleNav.find((n) => n.key === activeTab)?.label)}</h1>
          <p className="text-muted-foreground text-sm mt-1">{profile.hospital_name}</p>
        </div>

        {activeTab === "messages" && <HospitalMessagingSection profile={profile} />}
        {activeTab === "dashboard" && <HospitalDashboardSection profile={profile} />}
        {activeTab === "patients" && <HospitalManagePatientsSection profile={profile} />}
        {activeTab === "doctors" && <HospitalDoctorsSection profile={profile} />}
        {activeTab === "panels" && <HospitalLabPanelsSection profile={profile} />}
        {activeTab === "radiology" && <HospitalRadiologySection profile={profile} onUpdate={setProfile} />}
        {activeTab === "staff" && <HospitalReceptionistsSection profile={profile} />}
        {activeTab === "partnership" && (
          <PartnerSubscriptionSection partnerType="hospital" profile={profile} />
        )}
        {activeTab === "profile" && <HospitalProfileSection profile={profile} onUpdate={setProfile} />}
      </div>
    </DashboardLayout>
  );
}