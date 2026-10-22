import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import resolveClinicalFile from "@/lib/clinicalFileUrl";
import LabDashboardSection from "@/components/lab/portal/LabDashboardSection";
import LabRequestsSection from "@/components/lab/portal/LabRequestsSection";
import LabPendingTestsSection from "@/components/lab/portal/LabPendingTestsSection";
import LabCompletedSection from "@/components/lab/portal/LabCompletedSection";
import LabTechniciansSection from "@/components/lab/portal/LabTechniciansSection";
import LabProfileSection from "@/components/lab/portal/LabProfileSection";
import LabPatientsSection from "@/components/lab/portal/LabPatientsSection";
import LabNotificationsBar from "@/components/lab/portal/LabNotificationsBar";
import NotificationsBell from "@/components/lab/notifications/NotificationsBell";
import PartnerSubscriptionSection from "@/components/partner/PartnerSubscriptionSection";
import { Loader2 } from "lucide-react";
import { LayoutDashboard, FlaskConical, TestTube, CheckCircle2, Users, UserCog, Building2, Megaphone } from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "requests", label: "Lab Requests", icon: FlaskConical },
  { key: "pending", label: "Pending Tests", icon: TestTube },
  { key: "completed", label: "Completed Payments/Results", icon: CheckCircle2 },
  { key: "patients", label: "Patients", icon: Users },
  { key: "staff", label: "Technicians/Staff", icon: UserCog },
  { key: "partner", label: "Partner Program", icon: Megaphone },
  { key: "profile", label: "Profile", icon: Building2 },
];

export default function LabPortal() {
  const { user } = useAuth();
  const { t } = useAppLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifPatientId, setNotifPatientId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const profiles = await base44.entities.LaboratoryProfile.filter({ user_id: user.id });
        if (profiles.length === 0) {
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

  return (
    <DashboardLayout navItems={navItems} activeKey={activeTab} onNavClick={setActiveTab} roleLabel="Lab Portal" accent="lab">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t(navItems.find((n) => n.key === activeTab)?.label)}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile.lab_name} · {t("A&M Lab No.")} {profile.lab_number}
            </p>
          </div>
          <NotificationsBell
            onOpenNotification={async (n) => {
              if (n.target === "result" && n.result_file_url) {
                const url = await resolveClinicalFile("lab_request", n.lab_request_id, n.result_file_url);
                if (url) window.open(url, "_blank");
                return;
              }
              setActiveTab("patients");
              setNotifPatientId(n.patient_id);
            }}
          />
        </div>

        <LabNotificationsBar />

        {activeTab === "dashboard" && <LabDashboardSection profile={profile} onNavigate={setActiveTab} />}
        {activeTab === "requests" && <LabRequestsSection profile={profile} />}
        {activeTab === "patients" && (
          <LabPatientsSection
            profile={profile}
            selectedPatientId={notifPatientId}
            onSelectPatient={setNotifPatientId}
          />
        )}
        {activeTab === "pending" && <LabPendingTestsSection profile={profile} />}
        {activeTab === "completed" && <LabCompletedSection profile={profile} />}
        {activeTab === "staff" && <LabTechniciansSection profile={profile} />}
        {activeTab === "partner" && <PartnerSubscriptionSection partnerType="laboratory" profile={profile} />}
        {activeTab === "profile" && <LabProfileSection profile={profile} onUpdate={setProfile} />}
      </div>
    </DashboardLayout>
  );
}