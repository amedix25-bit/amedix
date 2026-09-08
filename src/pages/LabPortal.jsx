import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import LabDashboardSection from "@/components/lab/portal/LabDashboardSection";
import LabRequestsSection from "@/components/lab/portal/LabRequestsSection";
import LabPendingTestsSection from "@/components/lab/portal/LabPendingTestsSection";
import LabCompletedSection from "@/components/lab/portal/LabCompletedSection";
import LabTechniciansSection from "@/components/lab/portal/LabTechniciansSection";
import LabProfileSection from "@/components/lab/portal/LabProfileSection";
import { Loader2 } from "lucide-react";
import { LayoutDashboard, FlaskConical, TestTube, CheckCircle2, Users, Building2 } from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "requests", label: "Lab Requests", icon: FlaskConical },
  { key: "pending", label: "Pending Tests", icon: TestTube },
  { key: "completed", label: "Completed Results", icon: CheckCircle2 },
  { key: "staff", label: "Technicians/Staff", icon: Users },
  { key: "profile", label: "Profile", icon: Building2 },
];

export default function LabPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const profiles = await base44.entities.LaboratoryProfile.filter({ user_id: user.id });
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
    <DashboardLayout navItems={navItems} activeKey={activeTab} onNavClick={setActiveTab} roleLabel="Lab Portal">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{navItems.find((n) => n.key === activeTab)?.label}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {profile.lab_name} · A&M Lab No. {profile.lab_number}
          </p>
        </div>

        {activeTab === "dashboard" && <LabDashboardSection profile={profile} />}
        {activeTab === "requests" && <LabRequestsSection profile={profile} />}
        {activeTab === "pending" && <LabPendingTestsSection profile={profile} />}
        {activeTab === "completed" && <LabCompletedSection profile={profile} />}
        {activeTab === "staff" && <LabTechniciansSection profile={profile} />}
        {activeTab === "profile" && <LabProfileSection profile={profile} onUpdate={setProfile} />}
      </div>
    </DashboardLayout>
  );
}