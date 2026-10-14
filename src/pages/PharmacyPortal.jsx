import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import PharmacyDashboardSection from "@/components/pharmacy/portal/PharmacyDashboardSection";
import PharmacyPrescriptionsSection from "@/components/pharmacy/portal/PharmacyPrescriptionsSection";
import PharmacyInventorySection from "@/components/pharmacy/portal/PharmacyInventorySection";
import PharmacyPatientLookupSection from "@/components/pharmacy/portal/PharmacyPatientLookupSection";
import PharmacyProfileSection from "@/components/pharmacy/portal/PharmacyProfileSection";
import PharmacyNotificationsBell from "@/components/pharmacy/portal/PharmacyNotificationsBell";
import { Loader2 } from "lucide-react";
import { LayoutDashboard, Pill, Package, ScanLine, Building2 } from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "patients", label: "Identify Patient", icon: ScanLine },
  { key: "profile", label: "Profile", icon: Building2 },
];

export default function PharmacyPortal() {
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
        const profiles = await base44.entities.PharmacyProfile.filter({ user_id: user.id });
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
    <DashboardLayout navItems={navItems} activeKey={activeTab} onNavClick={setActiveTab} roleLabel="Pharmacy Portal">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t(navItems.find((n) => n.key === activeTab)?.label)}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile.pharmacy_name} · {t("A&M Pharmacy No.")} {profile.pharmacy_number}
            </p>
          </div>
          <PharmacyNotificationsBell
            onOpenNotification={(n) => setActiveTab(n.target === "patients" ? "patients" : "prescriptions")}
          />
        </div>

        {activeTab === "dashboard" && (
          <PharmacyDashboardSection profile={profile} onOpenPrescriptions={() => setActiveTab("prescriptions")} />
        )}
        {activeTab === "prescriptions" && <PharmacyPrescriptionsSection profile={profile} />}
        {activeTab === "inventory" && <PharmacyInventorySection profile={profile} />}
        {activeTab === "patients" && <PharmacyPatientLookupSection />}
        {activeTab === "profile" && <PharmacyProfileSection profile={profile} onUpdate={setProfile} />}
      </div>
    </DashboardLayout>
  );
}