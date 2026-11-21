import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PatientPortalLayout from "@/components/patient/shell/PatientPortalLayout";
import PatientVaccinations from "@/components/patient/PatientVaccinations";
import PatientOverview from "@/components/patient/PatientOverview";
import PatientAppointments from "@/components/patient/PatientAppointments";
import PatientDoctorMessages from "@/components/patient/PatientDoctorMessages";
import PatientDirectory from "@/components/patient/directory/PatientDirectory";
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
import PatientTopBar from "@/components/patient/shell/PatientTopBar";
import { PatientLanguageProvider, usePatientLanguage } from "@/lib/patientLanguage";
import PatientSidebar, { patientNavLabel } from "@/components/patient/PatientSidebar";
import { ChevronLeft } from "lucide-react";
import DrugsEntry from "@/components/patient/DrugsEntry";
import PartnerAdStrip from "@/components/partner/PartnerAdStrip";
import UnavailableSection from "@/components/common/UnavailableSection";
import { PATIENT_TABS } from "@/lib/notificationDestinations";
import PatientMedicalCard from "@/components/patient/PatientMedicalCard";
import MedicationAlarmCenter from "@/components/patient/medications/MedicationAlarmCenter";

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
  // A push notification opens an exact place in the portal: ?tab= is the tab,
  // ?focus= is the record it concerns. Only a tab this portal really renders is
  // accepted — anything else falls back to the overview.
  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  const [activeTab, setActiveTabRaw] = useState(
    PATIENT_TABS.includes(requestedTab) ? requestedTab : "overview"
  );
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [labsView, setLabsView] = useState("choose"); // "choose" | "requests" | "results"
  const [drugsView, setDrugsView] = useState(requestedTab === "drugs" ? "medications" : "choose"); // "choose" | "medications" | "prescriptions" | "advertisement"
  const setActiveTab = (tab) => {
    window.scrollTo({ top: 0, behavior: "auto" });
    // The portal content area scrolls on its own, so reset it too — otherwise a
    // newly opened tab appears part-way down the page.
    document.querySelector(".pp-main")?.scrollTo({ top: 0, behavior: "auto" });
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
    // Medication-reminder notifications carried a "reminders" target that was
    // never a tab; they belong with the medications.
    if (tab === "reminders") {
      setDrugsView("medications");
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
      const [appointments, labs, imaging, documents, medications] = await Promise.all([
        base44.entities.Appointment.count({ patient_id: p.id }),
        base44.entities.LabRequest.count({ patient_id: p.id }),
        base44.entities.ImagingRequest.count({ patient_id: p.id }),
        base44.entities.MedicalDocument.count({ patient_id: p.id }),
        base44.entities.Medication.count({ patient_id: p.id }),
      ]);
      setStats({ appointments, labs, imaging, documents, medications });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PatientPortalLayout
        activeKey={activeTab}
        onNavigate={setActiveTab}
        renderSidebar={({ close }) => (
          <PatientSidebar activeKey={activeTab} onNavClick={setActiveTab} close={close} />
        )}
      >
        <div>
          <PatientTopBar
            profile={profile}
            patientId={profile?.id}
            title={activeTab === "overview" ? null : t(patientNavLabel(activeTab))}
            onOpenProfile={() => setActiveTab("profile")}
            onNavigate={setActiveTab}
            notificationOpen={notificationOpen}
            onNotificationOpenChange={setNotificationOpen}
          />

          {profile && <MedicationAlarmCenter patient={profile} />}

          {(activeTab === "drugs" || activeTab === "labs") && (
            <div className="mb-4">
              <PartnerAdStrip key={activeTab} section={activeTab === "drugs" ? "pharmacy" : "laboratory"} />
            </div>
          )}
          {activeTab === "overview" && (
            <PatientOverview
              profile={profile}
              stats={stats}
              loading={loading}
              onGoToProfile={() => setActiveTab("profile")}
              onNavigate={setActiveTab}
              onViewActivity={() => setNotificationOpen(true)}
            />
          )}
          {["health", "conditions", "allergies", "surgeries"].includes(activeTab) && (
            <PatientHealth profile={profile} onGoToProfile={() => setActiveTab("profile")} onRefreshData={loadProfile} focusSection={activeTab === "health" ? null : activeTab} />
          )}
          {activeTab === "vaccinations" && <PatientVaccinations profile={profile} onOpenDocuments={() => setActiveTab("documents")} />}
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
          {activeTab === "messages" && profile && <PatientDoctorMessages profile={profile} />}
          {activeTab === "directory" && <PatientDirectory />}
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
          {activeTab === "medicalcard" && <PatientMedicalCard profile={profile} />}
          {activeTab === "access" && (
            <div className="space-y-10">
              <PatientAccessControl patientId={profile?.id} />
              {profile && <PatientRadiologistAccessControl profile={profile} />}
              {profile && <PatientRadiologyRequests profile={profile} />}
              {profile && <PatientAccessLog patientId={profile.id} />}
            </div>
          )}
          {!PATIENT_TABS.includes(activeTab) && (
            <UnavailableSection
              title={t("This section is not available")}
              message={t(
                "The item this link points to may have been removed, or it is no longer available to your account."
              )}
              actionLabel={t("Go to Home")}
              onAction={() => setActiveTab("overview")}
            />
          )}
        </div>
      </PatientPortalLayout>
    </>
  );
}