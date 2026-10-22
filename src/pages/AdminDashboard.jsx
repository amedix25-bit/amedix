import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminDoctorVerification from "@/components/admin/AdminDoctorVerification";
import AdminLabPanels from "@/components/admin/AdminLabPanels";
import AdminPartnerAds from "@/components/admin/partner/AdminPartnerAds";
import { LayoutDashboard, Users, ShieldCheck, FlaskConical, Megaphone } from "lucide-react";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "verification", label: "Doctor Verification", icon: ShieldCheck },
  { key: "lab_panels", label: "Lab Panels", icon: FlaskConical },
  { key: "partner_ads", label: "Partner Ads", icon: Megaphone },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useAppLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/home");
    }
  }, [user]);

  return (
    <DashboardLayout navItems={navItems} activeKey={activeTab} onNavClick={setActiveTab} roleLabel="Administrator" accent="hospital">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t(navItems.find((n) => n.key === activeTab)?.label)}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("A&M Healthcare Admin Panel")}</p>
        </div>

        {activeTab === "overview" && <AdminOverview />}
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "verification" && <AdminDoctorVerification />}
        {activeTab === "lab_panels" && <AdminLabPanels />}
        {activeTab === "partner_ads" && <AdminPartnerAds />}
      </div>
    </DashboardLayout>
  );
}