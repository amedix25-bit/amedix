import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { DOCTOR_TABS } from "@/lib/notificationDestinations";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import DoctorOverview from "@/components/doctor/DoctorOverview";
import DoctorPatientSearch from "@/components/doctor/DoctorPatientSearch";
import DoctorClinicalNotes from "@/components/doctor/DoctorClinicalNotes";
import DoctorLabRequests from "@/components/doctor/DoctorLabRequests";
import DoctorPrescriptions from "@/components/doctor/DoctorPrescriptions";
import DoctorImagingRequests from "@/components/doctor/DoctorImagingRequests";
import DoctorNameEdit from "@/components/doctor/DoctorNameEdit";
import DoctorTopBar from "@/components/doctor/shell/DoctorTopBar";
import DoctorSidebar from "@/components/doctor/shell/DoctorSidebar";
import DoctorCommunication from "@/components/doctor/communication/DoctorCommunication";
import DoctorHospitalsSection from "@/components/doctor/hospital/DoctorHospitalsSection";
import DoctorSpecialtySelect from "@/components/doctor/DoctorSpecialtySelect";
import { ensureRadiologistProfile, isRadiologySpecialty } from "@/lib/radiologyAccess";
import { isSurgicalSpecialty } from "@/lib/specialties";
import SurgicalRecords from "@/components/doctor/surgical/SurgicalRecords";
import DoctorHospitalGate from "@/components/doctor/hospital/DoctorHospitalGate";
import { getDoctorHospitalSession, setDoctorHospitalSession } from "@/lib/doctorHospitalSession";
import PatientPortalSwitchAction from "@/components/portal/PatientPortalSwitchAction";
import { LayoutDashboard, Search, Building2, Pill, MessageSquare, Link2, Scale, BedDouble, BookOpen, Settings, HelpCircle, IdCard, ShieldAlert } from "lucide-react";
import EmergencyAccessSection from "@/components/doctor/emergency/EmergencyAccessSection";
import EncountersSection from "@/components/doctor/encounters/EncountersSection";
import DoctorSettingsSection from "@/components/doctor/settings/DoctorSettingsSection";
import DoctorHelpSection from "@/components/doctor/help/DoctorHelpSection";
import ProfessionalProfileSection from "@/components/doctor/profile/ProfessionalProfileSection";
import useMessagingNotifications from "@/hooks/useMessagingNotifications";

// The Doctor Portal navigation — every entry opens a screen that already
// exists in the portal; grouped sections expand to the exact workflow the
// doctor needs rather than repeating a link.
const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "search", label: "Find Patient", icon: Search },
  { key: "emergency", label: "Emergency Access", icon: ShieldAlert },
  { key: "notes", label: "Consult", icon: Link2 },
  {
    key: "orders",
    label: "Orders & Results",
    icon: Scale,
    items: [
      { key: "labs", label: "Create Lab Request", view: "create" },
      { key: "labs", label: "Lab Requests & Results" },
      { key: "labs", label: "Order History", view: "history" },
      { key: "imaging", label: "Create Imaging Request", view: "form" },
      { key: "imaging", label: "Imaging Requests & Reports", view: "list" },
    ],
  },
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
  { key: "communication", label: "Communication", icon: MessageSquare },
  { key: "encounters", label: "Inpatient & ED", icon: BedDouble },
  { key: "professional-profile", label: "Professional Profile", icon: IdCard },
  { key: "hospitals", label: "My Hospitals", icon: Building2 },
  {
    key: "resources",
    label: "Resources",
    icon: BookOpen,
    items: [
      { label: "Clinical Guidelines", route: "/clinical-references" },
    ],
  },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "help", label: "Help & Support", icon: HelpCircle },
];

// The four things the Communication screen holds — every shortcut elsewhere in
// the portal that pointed at one of them now opens Communication on that tab.
const COMMUNICATION_KEYS = ["colleagues", "messages", "appointments", "referrals"];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { t } = useAppLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  // Sub-view of the active section (e.g. labs → history), so a sidebar entry
  // opens the exact screen the doctor chose.
  const [tabView, setTabView] = useState(null);
  // Open tab of the Communication screen.
  const [communicationTab, setCommunicationTab] = useState("messages");
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

  // A push notification opens an exact place in the portal: ?tab= is the tab and
  // ?cin= prefills Find Patient. The patient record itself is still authorised
  // server-side when the doctor opens it — a link never grants access.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("tab");
    const cin = params.get("cin");
    if (cin) {
      setActiveTab("search");
      setSearchPrefill({ cin, ts: Date.now() });
      return;
    }
    if (requested && DOCTOR_TABS.includes(requested)) setActiveTab(requested);
  }, []);
  // Unread messaging notifications, shown on the Messages navigation item so an
  // incoming message is visible from anywhere in the portal.
  const { unread: messagingUnread } = useMessagingNotifications({ enabled: !!user });
  const now = new Date();
  // Specialty-driven navigation — a Surgeon's Clinical Notes section becomes
  // Surgical Records with its own record types; every other feature stays the
  // same for all doctors.
  const isSurgeon = isSurgicalSpecialty(profile?.specialization);
  const doctorNav = navItems.map((n) => {
    if (n.key === "communication") return { ...n, badge: messagingUnread };
    if (n.key === "notes" && isSurgeon) return { ...n, label: "Surgical Records" };
    return n;
  });
  const flatItems = doctorNav.flatMap((n) => (n.items ? n.items.filter((c) => c.key) : [n]));
  const activeItem =
    flatItems.find((n) => n.key === activeTab && (n.view || null) === (tabView || null)) ||
    flatItems.find((n) => n.key === activeTab);

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    if (!profile) return undefined;
    const interval = setInterval(() => {
      base44.entities.DoctorProfile.update(profile.id, { last_active_datetime: new Date().toISOString() }).catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile]);

  const openCommunication = (tab) => {
    setCommunicationTab(COMMUNICATION_KEYS.includes(tab) ? tab : "messages");
    setActiveTab("communication");
    setTabView(null);
    setLabsDraftContext(null);
    setNotesReturnPatient(null);
  };

  const handleNavigateTab = (tab, context) => {
    if (COMMUNICATION_KEYS.includes(tab)) {
      openCommunication(tab);
      return;
    }
    setActiveTab(tab);
    setTabView(context?.view || null);
    setLabsDraftContext(tab === "labs" && context?.patient ? context : null);
    setNotesReturnPatient(tab === "notes" && context?.patient ? context.patient : null);
  };

  // A sidebar entry either opens a page of its own or a section sub-view.
  const handleNav = (item) => {
    if (!item) return;
    if (item.route) {
      navigate(item.route);
      return;
    }
    handleNavigateTab(item.key, { view: item.view || null });
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

  // Notification click -> the destination the shared resolver returned. It is
  // always a tab this portal renders, so the content area cannot go blank.
  const openDoctorNotification = (destination) => {
    if (!destination?.tab) {
      setActiveTab("overview");
      return;
    }
    if (destination.tab === "search") {
      openFromNotification(destination.cin || "");
      return;
    }
    handleNavigateTab(destination.tab, { view: destination.view || null });
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
      navItems={doctorNav}
      activeKey={activeTab}
      onNavClick={handleNav}
      sidebarTheme="navy"
      renderSidebar={({ close, onLogout }) => (
        <DoctorSidebar
          navItems={doctorNav}
          activeKey={activeTab}
          activeView={tabView}
          onNavClick={handleNav}
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
        onOpenReferrals={() => openCommunication("referrals")}
        onOpenDestination={openDoctorNotification}
      />

      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {activeTab !== "overview" && (
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{t(activeItem?.label)}</h1>
              <p className="text-muted-foreground text-sm mt-1 flex flex-wrap items-center gap-x-2">
                {profile?.full_name}
                {profile ? <DoctorSpecialtySelect profile={profile} onSelected={setProfile} /> : null}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
              <p className="text-xs text-muted-foreground">{now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        )}

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
            onNavigateTab={handleNavigateTab}
            notesLabel={isSurgeon ? "Surgical Records" : "Clinical Notes"}
            greeting={greeting}
            doctorName={doctorName}
            hospitalName={hospitalSession?.hospital_name || profile?.hospital}
            now={now}
          />
        )}
        {activeTab === "search" && profile && <DoctorPatientSearch doctorProfile={profile} prefill={searchPrefill} />}
        {activeTab === "emergency" && (
          <EmergencyAccessSection
            doctorProfile={profile}
            onStartEncounter={(patient) => handleNavigateTab("notes", { patient })}
            onOpenPatientSearch={(cin) => {
              setSearchPrefill({ cin, ts: Date.now() });
              setTabView(null);
              setActiveTab("search");
            }}
          />
        )}
        {activeTab === "communication" && profile && (
          <DoctorCommunication
            profile={profile}
            hospitalSession={hospitalSession}
            tab={communicationTab}
            onTabChange={setCommunicationTab}
            unreadMessages={messagingUnread}
          />
        )}
        {activeTab === "professional-profile" && profile && (
          <ProfessionalProfileSection profile={profile} onProfileUpdated={setProfile} />
        )}
        {activeTab === "hospitals" && profile && user && (
          <DoctorHospitalsSection profile={profile} user={user} onProfileUpdated={setProfile} />
        )}
        {activeTab === "notes" && profile && (isSurgeon ? (
          <SurgicalRecords key={`notes:${tabView || ""}`} doctorProfile={profile} />
        ) : (
          <DoctorClinicalNotes
            key={`notes:${tabView || ""}`}
            doctorProfile={profile}
            onNavigateTab={handleNavigateTab}
            returnPatient={notesReturnPatient}
            initialMode={tabView === "create" || tabView === "previous" ? tabView : null}
          />
        ))}
        {activeTab === "labs" && profile && (
          <DoctorLabRequests
            key={`labs:${tabView || ""}`}
            doctorProfile={profile}
            draftContext={labsDraftContext}
            onNavigateTab={handleNavigateTab}
            initialView={tabView === "history" ? "history" : tabView === "create" ? "create" : null}
          />
        )}
        {activeTab === "imaging" && profile && (
          <DoctorImagingRequests key={`imaging:${tabView || ""}`} doctorProfile={profile} initialView={tabView} />
        )}
        {activeTab === "prescriptions" && <DoctorPrescriptions />}
        {activeTab === "encounters" && profile && <EncountersSection doctorProfile={profile} />}
        {activeTab === "settings" && (
          <DoctorSettingsSection
            profile={profile}
            onProfileUpdated={setProfile}
            user={user}
            hospitalSession={hospitalSession}
            onNavigate={handleNav}
          />
        )}
        {activeTab === "help" && <DoctorHelpSection onNavigate={handleNav} />}
      </div>
    </DashboardLayout>
  );
}