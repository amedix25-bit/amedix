import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import PatientOverview from "@/components/patient/PatientOverview";
import PatientAppointments from "@/components/patient/PatientAppointments";
import DoctorVisits from "@/components/patient/DoctorVisits";
import PatientLabs from "@/components/patient/PatientLabs";
import PatientLabResults from "@/components/patient/PatientLabResults";
import LabsEntry from "@/components/patient/LabsEntry";
import { Button } from "@/components/ui/button";
import PatientPrescriptions from "@/components/patient/PatientPrescriptions";
import PatientImaging from "@/components/patient/PatientImaging";
import PatientRadiologyRequests from "@/components/patient/PatientRadiologyRequests";
import PatientDocuments from "@/components/patient/PatientDocuments";
import PatientAccessControl from "@/components/patient/PatientAccessControl";
import PatientAccessLog from "@/components/patient/PatientAccessLog";
import PatientRadiologistAccessControl from "@/components/patient/PatientRadiologistAccessControl";
import PatientHealth from "@/components/patient/PatientHealth";
import PatientMedications from "@/components/patient/PatientMedications";
import PatientProfileEdit from "@/components/patient/PatientProfileEdit";
import NotificationsBar from "@/components/patient/NotificationsBar";
import { PatientLanguageProvider, usePatientLanguage } from "@/lib/patientLanguage";
import PatientLanguageSwitch from "@/components/patient/PatientLanguageSwitch";
import ProfessionalPortalSwitch from "@/components/portal/ProfessionalPortalSwitch";
import { Home as HomeIcon, HeartPulse, Calendar, FlaskConical, ClipboardList, Image as ImageIcon, FileText, Pill, Shield, User, Stethoscope, ChevronLeft } from "lucide-react";
import DrugsEntry from "@/components/patient/DrugsEntry";
import PartnerAdStrip from "@/components/partner/PartnerAdStrip";

const NAV_ITEMS = [
  { key: "overview", label: "Home", icon: HomeIcon },
  { key: "health", label: "My Health", icon: HeartPulse },
  { key: "appointments", label: "Appointments", icon: Calendar },
  { key: "doctorvisits", label: "Doctor Visits", icon: Stethoscope },
  { key: "labs", label: "Labs", icon: FlaskConical },
  { key: "imaging", label: "Imaging", icon: ImageIcon },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "drugs", label: "Drugs", icon: Pill },
  { key: "access", label: "Access & Privacy", icon: Shield },
  { key: "profile", label: "Profile", icon: User },
];

export default function PatientDashboard() {
  return (
    <PatientLanguageProvider>
      <PatientPortal />
    </PatientLanguageProvider>
  );
}

function PatientPortal() {
  const { user } = useAuth();
  const { t } = usePatientLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTabRaw] = useState("overview");
  const [labsView, setLabsView] = useState("choose"); // "choose" | "requests" | "results"
  const [drugsView, setDrugsView] = useState("choose"); // "choose" | "medications" | "prescriptions" | "advertisement"
  const setActiveTab = (tab) => {
    // Notifications may still point at the old "My Lab Results" tab.
    if (tab === "mylabresults") {
      setLabsView("results");
      setActiveTabRaw("labs");
      return;
    }
    // Notifications may still point at the old Medications / Prescriptions tabs.
    if (tab === "medications" || tab === "prescriptions") {
      setDrugsView(tab);
      setActiveTabRaw("drugs");
      return;
    }
    if (tab === "labs") setLabsView("choose");
    if (tab === "drugs") setDrugsView("choose");
    setActiveTabRaw(tab);
  };
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ appointments: 0, labs: 0, imaging: 0, documents: 0, medications: 0 });

  const navItems = NAV_ITEMS.map((item) => ({ ...item, label: t(item.label) }));

  useEffect(() => {
    loadProfile();
  }, []);

  const ensureMedicationInfoNotification = async (profile) => {
    try {
      const existing = await base44.entities.PatientNotification.filter({
        patient_id: profile.id,
        type: "medication_update",
      });
      if (existing.length > 0) return;
      await base44.entities.PatientNotification.create({
        patient_id: profile.id,
        patient_user_id: profile.user_id,
        type: "medication_update",
        title: "Update Your Medication Information",
        message: "Please add your current medication information to keep your medical record up to date.",
        target: "medications",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadProfile = async () => {
    try {
      const profiles = await base44.entities.PatientProfile.filter({ user_id: user.id });
      if (profiles.length === 0) {
        navigate("/home");
        return;
      }
      const p = profiles[0];
      setProfile(p);
      if (p && !p.medication_info_completed) ensureMedicationInfoNotification(p);
      const [apts, labs, imaging, docs, meds] = await Promise.all([
        base44.entities.Appointment.filter({ patient_id: p.id }),
        base44.entities.LabRequest.filter({ patient_id: p.id }),
        base44.entities.ImagingRequest.filter({ patient_id: p.id }),
        base44.entities.MedicalDocument.filter({ patient_id: p.id }),
        base44.entities.Medication.filter({ patient_id: p.id }),
      ]);
      setStats({
        appointments: apts.length,
        labs: labs.length,
        imaging: imaging.length,
        documents: docs.length,
        medications: meds.length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardLayout
        navItems={navItems}
        activeKey={activeTab}
        onNavClick={setActiveTab}
        roleLabel={t("Patient")}
        logoutLabel={t("Log out")}
        sidebarAction={user ? <ProfessionalPortalSwitch user={user} /> : null}
      >
        <div className="p-4 lg:p-6 max-w-5xl mx-auto">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">
                {activeTab === "overview"
                  ? `${t("Welcome,")} ${profile?.full_name?.split(" ")[0] || ""}`
                  : t(navItems.find((n) => n.key === activeTab)?.label)}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{profile?.full_name} · {profile?.cin}</p>
            </div>
            {profile && <NotificationsBar patientId={profile.id} onNavigate={setActiveTab} />}
          </div>

          {(activeTab === "drugs" || activeTab === "labs") && (
            <div className="mb-4">
              <PartnerAdStrip key={activeTab} section={activeTab === "drugs" ? "pharmacy" : "laboratory"} />
            </div>
          )}
          {activeTab === "overview" && <PatientOverview profile={profile} stats={stats} loading={loading} />}
          {activeTab === "health" && <PatientHealth profile={profile} onGoToProfile={() => setActiveTab("profile")} />}
          {activeTab === "drugs" && (
            drugsView === "choose" ? (
              <DrugsEntry onOpen={setDrugsView} />
            ) : (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setDrugsView("choose")} className="rtl:flex-row-reverse">
                  <ChevronLeft className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                  {t("Back")}
                </Button>
                {drugsView === "medications" && <PatientMedications patient={profile} />}
                {drugsView === "prescriptions" && <PatientPrescriptions />}
              </div>
            )
          )}
          {activeTab === "profile" && <PatientProfileEdit profile={profile} onSaved={loadProfile} />}
          {activeTab === "appointments" && <PatientAppointments patientId={profile?.id} />}
          {activeTab === "doctorvisits" && <DoctorVisits patientId={profile?.id} />}
          {activeTab === "labs" && (
            labsView === "choose" ? (
              <LabsEntry onOpen={setLabsView} />
            ) : (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setLabsView("choose")} className="rtl:flex-row-reverse">
                  <ChevronLeft className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                  {t("Back")}
                </Button>
                {labsView === "requests" ? <PatientLabs patientId={profile?.id} /> : <PatientLabResults patient={profile} />}
              </div>
            )
          )}
          {activeTab === "imaging" && <PatientImaging patientId={profile?.id} />}
          {activeTab === "documents" && <PatientDocuments patient={profile} />}
          {activeTab === "access" && (
            <div className="space-y-10">
              <PatientAccessControl patientId={profile?.id} />
              {profile && <PatientRadiologistAccessControl profile={profile} />}
              {profile && <PatientRadiologyRequests profile={profile} />}
              {profile && <PatientAccessLog patientId={profile.id} />}
            </div>
          )}
        </div>
      </DashboardLayout>
      <PatientLanguageSwitch />
    </>
  );
}