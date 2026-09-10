import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import RadiologistFindPatient from "@/components/radiologist/RadiologistFindPatient";
import RadiologistNotifications from "@/components/radiologist/RadiologistNotifications";
import RadiologistNotificationsBell from "@/components/radiologist/RadiologistNotificationsBell";
import { Search, Bell } from "lucide-react";

const navItems = [
  { key: "find", label: "Find Patient", icon: Search },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export default function RadiologistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("find");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingMode, setPendingMode] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profiles = await base44.entities.RadiologistProfile.filter({ user_id: user.id });
      // Only accounts registered as radiologists can use this portal.
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

  const openFromNotification = (target) => {
    setActiveTab("find");
    setPendingMode(target === "my_patients" ? "my" : "add");
  };

  return (
    <DashboardLayout navItems={navItems} activeKey={activeTab} onNavClick={setActiveTab} roleLabel="Radiologist">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{navItems.find((n) => n.key === activeTab)?.label}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile?.full_name} · {profile?.specialization}
            </p>
          </div>
          {user && (
            <RadiologistNotificationsBell
              userId={user.id}
              onOpenAll={() => setActiveTab("notifications")}
              onNavigate={openFromNotification}
            />
          )}
        </div>

        {activeTab === "find" && profile && user && (
          <RadiologistFindPatient radiologistProfile={profile} user={user} pendingMode={pendingMode} />
        )}
        {activeTab === "notifications" && user && (
          <RadiologistNotifications userId={user.id} onNavigate={openFromNotification} />
        )}
      </div>
    </DashboardLayout>
  );
}