import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import PatientOverview from "@/components/patient/PatientOverview";
import PatientAppointments from "@/components/patient/PatientAppointments";
import PatientLabs from "@/components/patient/PatientLabs";
import PatientLabResults from "@/components/patient/PatientLabResults";
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
import { Home as HomeIcon, HeartPulse, Calendar, FlaskConical, ClipboardList, Image as ImageIcon, FileText, Pill, Shield, User } from "lucide-react";

const navItems = [
  { key: "overview", label: "Home", icon: HomeIcon },
  { key: "health", label: "My Health", icon: HeartPulse },
  { key: "appointments", label: "Appointments", icon: Calendar },
  { key: "labs", label: "Laboratory", icon: FlaskConical },
  { key: "mylabresults", label: "My Lab Results", icon: ClipboardList },
  { key: "imaging", label: "Imaging", icon: ImageIcon },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "medications", label: "Medications", icon: Pill },
  { key: "access", label: "Access & Privacy", icon: Shield },
  { key: "profile", label: "Profile", icon: User },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
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
        navigate("/");
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
    <DashboardLayout navItems={navItems} activeKey={activeTab} onNavClick={setActiveTab} roleLabel="Patient">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              {activeTab === "overview"
                ? `Welcome, ${profile?.full_name?.split(" ")[0] || ""}`
                : navItems.find((n) => n.key === activeTab)?.label}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{profile?.full_name} · {profile?.cin}</p>
          </div>
          {profile && <NotificationsBar patientId={profile.id} onNavigate={setActiveTab} />}
        </div>

        {activeTab === "overview" && <PatientOverview profile={profile} stats={stats} loading={loading} />}
        {activeTab === "health" && <PatientHealth profile={profile} onGoToProfile={() => setActiveTab("profile")} />}
        {activeTab === "medications" && <PatientMedications patient={profile} />}
        {activeTab === "profile" && <PatientProfileEdit profile={profile} onSaved={loadProfile} />}
        {activeTab === "appointments" && <PatientAppointments patientId={profile?.id} />}
        {activeTab === "labs" && <PatientLabs patientId={profile?.id} />}
        {activeTab === "mylabresults" && <PatientLabResults patient={profile} />}
        {activeTab === "imaging" && <PatientImaging patientId={profile?.id} />}
        {activeTab === "documents" && <PatientDocuments patientId={profile?.id} />}
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
  );
}