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
import DoctorPrescriptions from "@/components/doctor/DoctorPrescriptions";
import DoctorImagingRequests from "@/components/doctor/DoctorImagingRequests";
import DoctorNameEdit from "@/components/doctor/DoctorNameEdit";
import DoctorTopBar from "@/components/doctor/shell/DoctorTopBar";
import DoctorSidebar from "@/components/doctor/shell/DoctorSidebar";
import DoctorColleagues from "@/components/doctor/colleagues/DoctorColleagues";
import DoctorReferralLetters from "@/components/doctor/referral/DoctorReferralLetters";
import DoctorHospitalsSection from "@/components/doctor/hospital/DoctorHospitalsSection";
import DoctorSpecialtySelect from "@/components/doctor/DoctorSpecialtySelect";
import { ensureRadiologistProfile, isRadiologySpecialty } from "@/lib/radiologyAccess";
import { isSurgicalSpecialty } from "@/lib/specialties";
import SurgicalRecords from "@/components/doctor/surgical/SurgicalRecords";
import DoctorHospitalGate from "@/components/doctor/hospital/DoctorHospitalGate";
import { getDoctorHospitalSession, setDoctorHospitalSession } from "@/lib/doctorHospitalSession";
import PatientPortalSwitchAction from "@/components/portal/PatientPortalSwitchAction";
import { LayoutDashboard, Search, Calendar, FileText, FlaskConical, Image, Users, Mail, Building2, Pill, MessageSquare } from "lucide-react";
import DoctorMessages from "@/components/doctor/messaging/DoctorMessages";
import useMessagingNotifications from "@/hooks/useMessagingNotifications";

// Section order follows the Doctor Portal sidebar design: consultation work
// first, then the orders it produces, then the day's schedule and resources.
const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "search", label: "Find Patient", icon: Search },
  { key: "notes", label: "Clinical Notes", icon: FileText },
  { key: "labs", label: "Lab Requests", icon: FlaskConical },
  { key: "imaging", label: "Imaging", icon: Image },
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
  { key: "referrals", label: "Referral Letters", icon: Mail },
  { key: "appointments", label: "Appointments", icon: Calendar },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "colleagues", label: "My Colleagues", icon: Users },
  { key: "hospitals", label: "My Hospitals", icon: Building2 },
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
  const [todayAppointments, setTodayAppointments] = useState([]);
  // The verified hospital session — the doctor's active hospital for the
  // current portal session, opened via the AMedix Hospital Code gate. All
  // hospital-specific information and clinical actions apply to this hospital.
  const [hospitalSession, setHospitalSession] = useState(null);
  // Unread messaging notifications, shown on the Messages navigation item so an
  // incoming message is visible from anywhere in the portal.
  const { unread: messagingUnread } = useMessagingNotifications({ enabled: !!user });
  const now = new Date();
  // Specialty-driven navigation — a Surgeon's Clinical Notes section becomes
  // Surgical Records with its own record types; every other feature stays the
  // same for all doctors.
  const isSurgeon = isSurgicalSpecialty(profile?.specialization);
  const menuItems = navItems.map((n) => {
    if (n.key === "notes" && isSurgeon) return { ...n, label: "Surgical Records" };
    if (n.key === "messages") return { ...n, badge: messagingUnread };
    return n;
  });

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    if (!profile) return undefined;
    const interval = setInterval(() => {
      base44.entities.DoctorProfile.update(profile.id, { last_active_datetime: new Date().toISOString() }).catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile]);

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

  // Top-bar patient search — opens Find Patient, looking the CIN up straight away.
  const openPatientSearch = (cin) => {
    setActiveTab("search");
    if (cin) setSearchPrefill({ cin, ts: Date.now() });
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
      // A doctor whose specialty is Radiology (or a radiology sub-specialty
      // set while testing from the Radiologist Portal) works in the
      // Radiologist Portal — the same portal dedicated radiologists use.
      if (isRadiologySpecialty(p.specialization)) {
        await ensureRadiologistProfile(p, user);
        navigate("/radiologist");
        return;
      }
      setProfile(p);
      // A stored session is only reused while it still matches the doctor's
      // current working hospital — otherwise the code gate is shown again.
      const stored = getDoctorHospitalSession();
      if (stored && p.hospital && String(stored.hospital_name).trim().toLowerCase() === String(p.hospital).trim().toLowerCase()) {
        setHospitalSession(stored);
      }
      // Fresh online status for the hospital's Manage Doctors view — refreshed
      // again every few minutes while the Doctor Portal is open.
      base44.entities.DoctorProfile.update(p.id, { last_active_datetime: new Date().toISOString() }).catch(() => {});
      const [appointments, labs, imaging, accessReqs] = await Promise.all([
        base44.entities.Appointment.filter({ doctor_id: p.id }),
        base44.entities.LabRequest.filter({ doctor_id: p.id }),
        base44.entities.ImagingRequest.filter({ doctor_id: p.id }),
        base44.entities.AccessRequest.filter({ doctor_id: p.id, status: "approved" }),
      ]);
      setStats({ patients: accessReqs.length, appointments: appointments.length, labs: labs.length, imaging: imaging.length });
      // Today's list for the Overview — read straight from the appointments
      // already loaded above, cancelled visits excluded.
      const todayKey = new Date().toISOString().slice(0, 10);
      setTodayAppointments(
        appointments
          .filter((a) => a.date === todayKey && a.status !== "cancelled")
          .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")))
      );
      const activity = [
        ...accessReqs.map((r) => ({ icon: "user", text: "New patient added", detail: r.patient_name || r.patient_cin, at: r.created_date })),
        ...labs.map((r) => ({ icon: "lab", text: "Lab request submitted", detail: (r.tests || []).slice(0, 3).map((t) => t.name).join(", "), at: r.created_date })),
        ...imaging.map((r) => ({ icon: "imaging", text: r.report ? "Imaging result received" : "Imaging request created", detail: `${r.examination || r.scan_type} — ${r.patient_name || ""}`, at: r.created_date })),
        ...appointments.map((r) => ({ icon: "calendar", text: "Appointment confirmed", detail: `${r.date} — ${r.time}`, at: r.created_date })),
      ].filter((a) => a.at).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5);
      setRecentActivity(activity);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // Hospital Code Gate — the portal stays closed until the doctor verifies the
  // AMedix Hospital Code of the hospital they are working at. Every hospital
  // switch afterwards is re-verified by the backend.
  if (profile && !hospitalSession) {
    return (
      <DoctorHospitalGate
        profile={profile}
        user={user}
        onVerified={(session) => {
          setDoctorHospitalSession(session);
          setHospitalSession(session);
          setProfile((prev) => (prev ? { ...prev, hospital: session.hospital_name } : prev));
        }}
      />
    );
  }

  // Switching hospitals from the Overview switcher — the backend already
  // verified the active association; the session becomes the new hospital.
  const handleSwitchHospital = (session) => {
    setDoctorHospitalSession(session);
    setHospitalSession(session);
    setProfile((prev) => (prev ? { ...prev, hospital: session.hospital_name } : prev));
  };

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const doctorName = `Dr. ${(profile?.full_name || "").replace(/^Dr\.?\s*/i, "").trim() || "Doctor"}`;

  return (
    <DashboardLayout
      navItems={menuItems}
      activeKey={activeTab}
      onNavClick={handleNavigateTab}
      sidebarTheme="navy"
      renderSidebar={({ close, onLogout }) => (
        <DoctorSidebar
          navItems={menuItems}
          activeKey={activeTab}
          onNavClick={handleNavigateTab}
          onLogout={onLogout}
          close={close}
          sidebarAction={user ? <PatientPortalSwitchAction user={user} /> : null}
        />
      )}
    >
      <DoctorTopBar
        profile={profile}
        hospitalSession={hospitalSession}
        onSwitchHospital={handleSwitchHospital}
        onProfileUpdated={setProfile}
        user={user}
        unreadMessages={messagingUnread}
        onNavigate={handleNavigateTab}
        onSearchPatient={openPatientSearch}
        onOpenNotification={openFromNotification}
        onOpenReferrals={() => setActiveTab("referrals")}
      />

      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {activeTab === "overview" ? (
              <>
                <h1 className="text-2xl font-bold text-foreground">{greeting}, {doctorName}</h1>
                <p className="text-muted-foreground text-sm mt-1 flex flex-wrap items-center gap-x-2">
                  <span>{profile?.specialization || "Specialty not set"}</span>
                  <span aria-hidden="true" className="text-border">•</span>
                  <span>{hospitalSession?.hospital_name || profile?.hospital || "—"}</span>
                  {profile && !profile.specialization ? <DoctorSpecialtySelect profile={profile} onSelected={setProfile} /> : null}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{t(menuItems.find((n) => n.key === activeTab)?.label)}</h1>
                <p className="text-muted-foreground text-sm mt-1 flex flex-wrap items-center gap-x-2">
                  {profile?.full_name}
                  {profile ? <DoctorSpecialtySelect profile={profile} onSelected={setProfile} /> : null}
                </p>
              </>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold">{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
            <p className="text-xs text-muted-foreground">{now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>
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
            appointmentsToday={todayAppointments.length}
            todayAppointments={todayAppointments}
            loading={loading}
            recentActivity={recentActivity}
            onNavigateTab={setActiveTab}
            notesLabel={isSurgeon ? "Surgical Records" : "Clinical Notes"}
          />
        )}
        {activeTab === "search" && profile && <DoctorPatientSearch doctorProfile={profile} prefill={searchPrefill} />}
        {activeTab === "colleagues" && profile && <DoctorColleagues doctorProfile={profile} />}
        {activeTab === "referrals" && profile && <DoctorReferralLetters doctorProfile={profile} />}
        {activeTab === "hospitals" && profile && user && (
          <DoctorHospitalsSection profile={profile} user={user} onProfileUpdated={setProfile} />
        )}
        {activeTab === "appointments" && profile && <DoctorAppointments doctorProfile={profile} />}
        {activeTab === "notes" && profile && (isSurgeon ? (
          <SurgicalRecords doctorProfile={profile} />
        ) : (
          <DoctorClinicalNotes doctorProfile={profile} onNavigateTab={handleNavigateTab} returnPatient={notesReturnPatient} />
        ))}
        {activeTab === "labs" && profile && <DoctorLabRequests doctorProfile={profile} draftContext={labsDraftContext} onNavigateTab={handleNavigateTab} />}
        {activeTab === "imaging" && profile && <DoctorImagingRequests doctorProfile={profile} />}
        {activeTab === "prescriptions" && <DoctorPrescriptions />}
        {activeTab === "messages" && profile && (
          <DoctorMessages profile={profile} hospitalSession={hospitalSession} />
        )}
      </div>
    </DashboardLayout>
  );
}