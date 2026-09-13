import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import DoctorOverview from "@/components/doctor/DoctorOverview";
import DoctorPatientSearch from "@/components/doctor/DoctorPatientSearch";
import DoctorAppointments from "@/components/doctor/DoctorAppointments";
import DoctorClinicalNotes from "@/components/doctor/DoctorClinicalNotes";
import DoctorLabRequests from "@/components/doctor/DoctorLabRequests";
import DoctorImagingRequests from "@/components/doctor/DoctorImagingRequests";
import DoctorNotificationsBell from "@/components/doctor/DoctorNotificationsBell";
import DoctorProfilePicture from "@/components/doctor/DoctorProfilePicture";
import DoctorNameEdit from "@/components/doctor/DoctorNameEdit";
import DoctorColleagues from "@/components/doctor/colleagues/DoctorColleagues";
import DoctorReferralLetters from "@/components/doctor/referral/DoctorReferralLetters";
import PatientPortalSwitchAction from "@/components/portal/PatientPortalSwitchAction";
import { LayoutDashboard, Search, Calendar, FileText, FlaskConical, Image, Users, Mail } from "lucide-react";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "search", label: "Find Patient", icon: Search },
  { key: "colleagues", label: "My Colleagues", icon: Users },
  { key: "referrals", label: "Referral Letters", icon: Mail },
  { key: "appointments", label: "Appointments", icon: Calendar },
  { key: "notes", label: "Clinical Notes", icon: FileText },
  { key: "labs", label: "Lab Requests", icon: FlaskConical },
  { key: "imaging", label: "Imaging", icon: Image },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { t } = useAppLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [labsDraftContext, setLabsDraftContext] = useState(null);
  const [notesReturnPatient, setNotesReturnPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patients: 0, appointments: 0, labs: 0, imaging: 0 });
  const [searchPrefill, setSearchPrefill] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const now = new Date();

  useEffect(() => { loadProfile(); }, []);

  const handleNavigateTab = (tab, context) => {
    setActiveTab(tab);
    setLabsDraftContext(tab === "labs" && context?.patient ? context : null);
    setNotesReturnPatient(tab === "notes" && context?.patient ? context.patient : null);
  };

  // Opening a shared-result notification jumps to Find Patient with the
  // patient's CIN prefilled and looked up immediately.
  const openFromNotification = (cin) => {
    setActiveTab("search");
    setSearchPrefill({ cin, ts: Date.now() });
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
      const [appointments, labs, imaging, accessReqs] = await Promise.all([
        base44.entities.Appointment.filter({ doctor_id: p.id }),
        base44.entities.LabRequest.filter({ doctor_id: p.id }),
        base44.entities.ImagingRequest.filter({ doctor_id: p.id }),
        base44.entities.AccessRequest.filter({ doctor_id: p.id, status: "approved" }),
      ]);
      setStats({ patients: accessReqs.length, appointments: appointments.length, labs: labs.length, imaging: imaging.length });
      const activity = [
        ...accessReqs.map((r) => ({ icon: "user", text: "New patient added", detail: r.patient_name || r.patient_cin, at: r.created_date })),
        ...labs.map((r) => ({ icon: "lab", text: "Lab request submitted", detail: (r.tests || []).slice(0, 3).map((t) => t.name).join(", "), at: r.created_date })),
        ...imaging.map((r) => ({ icon: "imaging", text: r.report ? "Imaging result received" : "Imaging request created", detail: `${r.examination || r.scan_type} — ${r.patient_name || ""}`, at: r.created_date })),
        ...appointments.map((r) => ({ icon: "calendar", text: "Appointment confirmed", detail: `${r.date} — ${r.time}`, at: r.created_date })),
      ].filter((a) => a.at).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5);
      setRecentActivity(activity);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <DashboardLayout navItems={navItems} activeKey={activeTab} onNavClick={handleNavigateTab} roleLabel="Doctor" sidebarAction={user ? <PatientPortalSwitchAction user={user} /> : null}>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            {profile && <DoctorProfilePicture profile={profile} onUpdated={setProfile} />}
            <div>
              <h1 className="text-2xl font-bold">{t(navItems.find((n) => n.key === activeTab)?.label)}</h1>
              <p className="text-muted-foreground text-sm mt-1">{profile?.full_name} · {profile?.specialization}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-sm font-semibold">{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
              <p className="text-xs text-muted-foreground">{now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            {user && (
              <DoctorNotificationsBell
                userId={user.id}
                onNavigate={openFromNotification}
                onOpenReferrals={() => setActiveTab("referrals")}
              />
            )}
          </div>
        </div>

        {profile && profile.name_edited !== true && (
          <div className="mb-6">
            <DoctorNameEdit profile={profile} onUpdated={setProfile} />
          </div>
        )}

        {activeTab === "overview" && (
          <DoctorOverview
            profile={profile}
            stats={stats}
            loading={loading}
            recentActivity={recentActivity}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === "search" && profile && <DoctorPatientSearch doctorProfile={profile} prefill={searchPrefill} />}
        {activeTab === "colleagues" && profile && <DoctorColleagues doctorProfile={profile} />}
        {activeTab === "referrals" && profile && <DoctorReferralLetters doctorProfile={profile} />}
        {activeTab === "appointments" && profile && <DoctorAppointments doctorProfile={profile} />}
        {activeTab === "notes" && profile && <DoctorClinicalNotes doctorProfile={profile} onNavigateTab={handleNavigateTab} returnPatient={notesReturnPatient} />}
        {activeTab === "labs" && profile && <DoctorLabRequests doctorProfile={profile} draftContext={labsDraftContext} onNavigateTab={handleNavigateTab} />}
        {activeTab === "imaging" && profile && <DoctorImagingRequests doctorProfile={profile} />}
      </div>
    </DashboardLayout>
  );
}