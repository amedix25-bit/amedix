import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import HospitalDashboardSection from "@/components/hospital/portal/HospitalDashboardSection";
import HospitalManagePatientsSection from "@/components/hospital/portal/HospitalManagePatientsSection";
import HospitalReceptionistsSection from "@/components/hospital/portal/HospitalReceptionistsSection";
import HospitalProfileSection from "@/components/hospital/portal/HospitalProfileSection";
import { Loader2 } from "lucide-react";
import { LayoutDashboard, ClipboardList, UserCog, Building2 } from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "patients", label: "Manage Patients", icon: ClipboardList },
  { key: "staff", label: "Receptionists", icon: UserCog },
  { key: "profile", label: "Profile", icon: Building2 },
];

export default function HospitalPortal() {
  const { user } = useAuth();
  const { t } = useAppLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const profiles = await base44.entities.HospitalProfile.filter({ user_id: user.id });
        if (profiles.length === 0) {
          navigate("/");
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

  return (
    <DashboardLayout navItems={navItems} activeKey={activeTab} onNavClick={setActiveTab} roleLabel="Hospital Portal">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t(navItems.find((n) => n.key === activeTab)?.label)}</h1>
          <p className="text-muted-foreground text-sm mt-1">{profile.hospital_name}</p>
        </div>

        {activeTab === "dashboard" && <HospitalDashboardSection profile={profile} />}
        {activeTab === "patients" && <HospitalManagePatientsSection profile={profile} />}
        {activeTab === "staff" && <HospitalReceptionistsSection profile={profile} />}
        {activeTab === "profile" && <HospitalProfileSection profile={profile} onUpdate={setProfile} />}
      </div>
    </DashboardLayout>
  );
}