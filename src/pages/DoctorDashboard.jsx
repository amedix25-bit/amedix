import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import DoctorOverview from "@/components/doctor/DoctorOverview";
import DoctorPatientSearch from "@/components/doctor/DoctorPatientSearch";
import DoctorAppointments from "@/components/doctor/DoctorAppointments";
import DoctorClinicalNotes from "@/components/doctor/DoctorClinicalNotes";
import DoctorLabRequests from "@/components/doctor/DoctorLabRequests";
import DoctorImagingRequests from "@/components/doctor/DoctorImagingRequests";
import { LayoutDashboard, Search, Calendar, FileText, FlaskConical, Image } from "lucide-react";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "search", label: "Find Patient", icon: Search },
  { key: "appointments", label: "Appointments", icon: Calendar },
  { key: "notes", label: "Clinical Notes", icon: FileText },
  { key: "labs", label: "Lab Requests", icon: FlaskConical },
  { key: "imaging", label: "Imaging", icon: Image },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [labsDraftContext, setLabsDraftContext] = useState(null);
  const [notesReturnPatient, setNotesReturnPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patients: 0, appointments: 0, labs: 0, imaging: 0 });

  useEffect(() => { loadProfile(); }, []);

  const handleNavigateTab = (tab, context) => {
    setActiveTab(tab);
    setLabsDraftContext(tab === "labs" && context?.patient ? context : null);
    setNotesReturnPatient(tab === "notes" && context?.patient ? context.patient : null);
  };

  const loadProfile = async () => {
    try {
      const profiles = await base44.entities.DoctorProfile.filter({ user_id: user.id });
      if (profiles.length === 0) {
        // Radiologist accounts (unless an admin explicitly granted Doctor Portal
        // access) belong in the Radiologist Portal, not here.
        const radProfiles = await base44.entities.RadiologistProfile.filter({ user_id: user.id });
        navigate(radProfiles.length > 0 ? "/radiologist" : "/");
        return;
      }
      const p = profiles[0];
      setProfile(p);
      const [apts, labs, imaging, accessReqs] = await Promise.all([
        base44.entities.Appointment.filter({ doctor_id: p.id }),
        base44.entities.LabRequest.filter({ doctor_id: p.id }),
        base44.entities.ImagingRequest.filter({ doctor_id: p.id }),
        base44.entities.AccessRequest.filter({ doctor_id: p.id, status: "approved" }),
      ]);
      setStats({ patients: accessReqs.length, appointments: apts.length, labs: labs.length, imaging: imaging.length });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <DashboardLayout navItems={navItems} activeKey={activeTab} onNavClick={handleNavigateTab} roleLabel="Doctor">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{navItems.find((n) => n.key === activeTab)?.label}</h1>
          <p className="text-muted-foreground text-sm mt-1">{profile?.full_name} · {profile?.specialization}</p>
        </div>

        {activeTab === "overview" && <DoctorOverview profile={profile} stats={stats} loading={loading} />}
        {activeTab === "search" && profile && <DoctorPatientSearch doctorProfile={profile} />}
        {activeTab === "appointments" && profile && <DoctorAppointments doctorProfile={profile} />}
        {activeTab === "notes" && profile && <DoctorClinicalNotes doctorProfile={profile} onNavigateTab={handleNavigateTab} returnPatient={notesReturnPatient} />}
        {activeTab === "labs" && profile && <DoctorLabRequests doctorProfile={profile} draftContext={labsDraftContext} onNavigateTab={handleNavigateTab} />}
        {activeTab === "imaging" && profile && <DoctorImagingRequests doctorProfile={profile} />}
      </div>
    </DashboardLayout>
  );
}