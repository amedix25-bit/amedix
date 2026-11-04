import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import RadiologistSpecialtySelect from "@/components/radiologist/RadiologistSpecialtySelect";
import RadiologistFacilitySwitcher from "@/components/radiologist/RadiologistFacilitySwitcher";
import { isRadiologySpecialty } from "@/lib/radiologyAccess";
import RadiologistFindPatient from "@/components/radiologist/RadiologistFindPatient";
import RadiologistNotifications from "@/components/radiologist/RadiologistNotifications";
import RadiologistNotificationsBell from "@/components/radiologist/RadiologistNotificationsBell";
import RadiologistOverview from "@/components/radiologist/RadiologistOverview";
import RadiologistStudyBoard from "@/components/radiologist/RadiologistStudyBoard";
import RadiologyWorklist from "@/components/radiologist/RadiologyWorklist";
import ImagingViewerTab from "@/components/radiologist/viewer/ImagingViewerTab";
import RadiologistColleagues from "@/components/radiologist/colleagues/RadiologistColleagues";
import PatientPortalSwitchAction from "@/components/portal/PatientPortalSwitchAction";
import { Search, Bell, ClipboardList, LayoutDashboard, Users, Monitor } from "lucide-react";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "worklist", label: "Imaging Worklist", icon: ClipboardList },
  { key: "viewer", label: "Imaging Viewer", icon: Monitor },
  { key: "find", label: "Find Patient", icon: Search },
  { key: "colleagues", label: "My Colleagues", icon: Users },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export default function RadiologistDashboard() {
  const { user } = useAuth();
  const { t } = useAppLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingMode, setPendingMode] = useState(null);
  const [worklistView, setWorklistView] = useState(null);
  const [facilityFilter, setFacilityFilter] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profiles = await base44.entities.RadiologistProfile.filter({ user_id: user.id });
      // Only accounts registered as radiologists can use this portal.
      if (profiles.length === 0) {
        navigate("/home");
        return;
      }
      const prof = profiles[0];
      // A leftover non-radiology specialty (saved while testing the Doctor
      // Portal) resets to the default radiology specialty here.
      if (prof.specialization && !isRadiologySpecialty(prof.specialization)) {
        const fixed = "Diagnostic Radiology";
        base44.entities.RadiologistProfile.update(prof.id, { specialization: fixed }).catch(() => {});
        prof.specialization = fixed;
      }
      setProfile(prof);
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

  const openFromBoard = (view, completedToday = false) => {
    setWorklistView({ view, completedToday });
    setActiveTab("worklist");
  };

  return (
    <DashboardLayout navItems={navItems} activeKey={activeTab} onNavClick={setActiveTab} roleLabel="Radiologist" accent="radiology" sidebarAction={user ? <PatientPortalSwitchAction user={user} /> : null}>
      <div className={`p-4 lg:p-6 mx-auto ${["worklist", "viewer"].includes(activeTab) ? "max-w-[1700px]" : "max-w-5xl"}`}>
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t(navItems.find((n) => n.key === activeTab)?.label)}</h1>
            <p className="text-muted-foreground text-sm mt-1 flex flex-wrap items-center gap-x-2">
              {profile?.full_name}
              {profile ? <RadiologistSpecialtySelect profile={profile} onSelected={setProfile} /> : null}
            </p>
            {profile ? (
              <RadiologistFacilitySwitcher profile={profile} value={facilityFilter} onChange={setFacilityFilter} />
            ) : null}
          </div>
          {user && (
            <RadiologistNotificationsBell
              userId={user.id}
              onOpenAll={() => setActiveTab("notifications")}
              onNavigate={openFromNotification}
            />
          )}
        </div>

        {activeTab === "overview" && profile && (
          <div className="space-y-6">
            <RadiologistStudyBoard onOpenView={openFromBoard} />
            <RadiologistOverview profile={profile} onProfileUpdate={setProfile} />
          </div>
        )}
        {activeTab === "worklist" && profile && (
          <RadiologyWorklist radiologistProfile={profile} user={user} initialView={worklistView} initialFacility={facilityFilter} />
        )}
        {activeTab === "viewer" && profile && user && (
          <ImagingViewerTab
            user={user}
            radiologistProfile={profile}
            onOpenReporting={() => { setWorklistView(null); setActiveTab("worklist"); }}
          />
        )}
        {activeTab === "colleagues" && profile && (
          <RadiologistColleagues radiologistProfile={profile} />
        )}
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