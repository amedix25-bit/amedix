import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import DepartmentDashboard from "@/components/radiology/department/DepartmentDashboard";
import DepartmentWorklist from "@/components/radiology/department/DepartmentWorklist";
import DepartmentAnalytics from "@/components/radiology/department/DepartmentAnalytics";
import { Loader2, LayoutDashboard, ClipboardList, BarChart3, ShieldAlert } from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Department Dashboard", icon: LayoutDashboard },
  { key: "worklist", label: "Department Worklist", icon: ClipboardList },
  { key: "analytics", label: "Department Analytics", icon: BarChart3 },
];

// Radiology Department Portal — operational management of the facility's
// imaging workflow: incoming requests, scheduling, examination progress,
// image availability, study assignment and reporting oversight. Clinical
// interpretation itself stays in the Radiologist Portal.
export default function RadiologyDepartmentPortal() {
  const { user } = useAuth();
  const { t } = useAppLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [access, setAccess] = useState(null); // { mode, hospitalProfile, radiologistProfile }
  const [loading, setLoading] = useState(true);
  const [worklistFilter, setWorklistFilter] = useState(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [hospitalProfiles, radiologistProfiles] = await Promise.all([
          base44.entities.HospitalProfile.filter({ user_id: user.id }),
          base44.entities.RadiologistProfile.filter({ user_id: user.id }),
        ]);
        const hospital = hospitalProfiles[0] || null;
        const radiologist = radiologistProfiles[0] || null;
        if (hospital && hospital.radiology_department_enabled) {
          setAccess({ mode: "department", hospitalProfile: hospital, radiologistProfile: null });
        } else if (radiologist && String(radiologist.hospital || "").trim()) {
          setAccess({ mode: "radiologist", hospitalProfile: null, radiologistProfile: radiologist });
          setActiveTab("worklist");
        } else {
          setAccess(null);
        }
      } catch (err) {
        console.error(err);
        setAccess(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const openWorklist = (filter) => {
    setWorklistFilter(filter);
    setActiveTab("worklist");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!access) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center max-w-md">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-semibold">Radiology Department Portal</p>
          <p className="text-sm text-muted-foreground mt-2">
            Only the administrator of a facility with a configured Radiology Department — or a radiologist
            associated with that facility — can open this portal. Facility administrators enable their
            radiology department from the Hospital Portal.
          </p>
        </div>
      </div>
    );
  }

  const isDept = access.mode === "department";

  return (
    <DashboardLayout
      navItems={isDept ? navItems : navItems.filter((n) => n.key !== "analytics")}
      activeKey={activeTab}
      onNavClick={setActiveTab}
      roleLabel="Radiology Department" accent="radiology"
    >
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t(navItems.find((n) => n.key === activeTab)?.label)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isDept ? access.hospitalProfile.hospital_name : access.radiologistProfile.hospital}
            {access.mode === "radiologist" && " — radiologist view (claim and report assigned studies)"}
          </p>
        </div>

        {activeTab === "dashboard" && isDept && (
          <DepartmentDashboard onOpenWorklist={openWorklist} />
        )}
        {activeTab === "worklist" && (
          <DepartmentWorklist
            key={worklistFilter ? JSON.stringify(worklistFilter) : "all"}
            mode={access.mode}
            initialFilter={worklistFilter}
          />
        )}
        {activeTab === "analytics" && isDept && <DepartmentAnalytics />}
      </div>
    </DashboardLayout>
  );
}