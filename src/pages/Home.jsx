import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Stethoscope, User, ArrowRight, Loader2 } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import AboutAmedix from "@/components/home/AboutAmedix";
import { Button } from "@/components/ui/button";
import PatientOnboardingForm from "@/components/patient/PatientOnboardingForm";
import DoctorRegistrationForm from "@/components/doctor/registration/DoctorRegistrationForm";
import { resumeDoctorRegistration } from "@/lib/doctorRegistration";
import { PatientLanguageProvider } from "@/lib/patientLanguage";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";
import { clearDoctorHospitalSession } from "@/lib/doctorHospitalSession";
import { validatePortalAccess, routeAfterValidation, logoutWithRejection } from "@/lib/portalAccess";
import PortalSelection from "@/components/PortalSelection";
import AuthLayout from "@/components/AuthLayout";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useAppLanguage();
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [selection, setSelection] = useState(null);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);

  // Saved doctor registration (details + completed verification steps) restored
  // when a doctor returns to an unfinished registration.
  const [doctorRegState, setDoctorRegState] = useState("incomplete");
  const [doctorRestores, setDoctorRestores] = useState(null);

  useEffect(() => {
    if (user?.id) checkProfile();
  }, [user?.id]);

  // Legacy redirects and Google registration can still arrive at /home.
  // Existing accounts must finish portal routing, not repeat role onboarding.
  const checkProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    setProfileError("");
    try {
      const storedRole = localStorage.getItem("amh_selected_role");
      const selectedRole = ["patient", "doctor"].includes(storedRole) ? storedRole : null;
      const data = await validatePortalAccess(selectedRole);
      if (data.roles.length > 0 && (!selectedRole || data.roles.includes(selectedRole))) {
        routeAfterValidation(data, selectedRole, {
          onSelection: (value) => {
            localStorage.removeItem("amh_selected_role");
            setSelection(value);
            setLoading(false);
          },
          onReject: (role) => logoutWithRejection(role),
        });
        return;
      }
      // Only accounts that still need the selected profile see onboarding.
      localStorage.removeItem("amh_selected_role");
      if (selectedRole === "patient") setShowPatientForm(true);
      if (selectedRole === "doctor") {
        await openDoctorRegistration();
        setLoading(false);
        return;
      }
      // A doctor who started registration earlier continues from the saved step
      // instead of starting over.
      const saved = await resumeDoctorRegistration().catch(() => null);
      if (saved?.state === "incomplete" && saved.resumed) {
        setDoctorRegState("incomplete");
        setDoctorRestores(saved.restores || null);
        setShowDoctorForm(true);
      } else if (saved?.state === "rejected") {
        setDoctorRegState("rejected");
        setDoctorRestores({ rejection_reason: saved.rejection_reason || "" });
        setShowDoctorForm(true);
      }
      setLoading(false);
    } catch (err) {
      setProfileError(err.response?.data?.error || err.message || t("Unable to open your portal. Please try again."));
      setLoading(false);
    }
  };

  // Picking a role continues to the portal when a profile already exists,
  // otherwise it opens the registration/onboarding form.
  const handlePatientSelect = async () => {
    try {
      const profiles = await base44.entities.PatientProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        navigate("/patient");
        return;
      }
    } catch (err) {
      console.error(err);
    }
    setShowPatientForm(true);
  };

  // Reads the saved registration — details and any verification already
  // completed — and opens the form where the doctor stopped.
  const openDoctorRegistration = async () => {
    const saved = await resumeDoctorRegistration().catch(() => null);
    setDoctorRegState(saved?.state || "incomplete");
    setDoctorRestores(
      saved?.state === "rejected"
        ? { rejection_reason: saved.rejection_reason || "" }
        : saved?.restores || null
    );
    setShowDoctorForm(true);
  };

  const handleDoctorSelect = () => openDoctorRegistration();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p role="alert" className="text-sm text-destructive text-center">{profileError}</p>
        <Button onClick={checkProfile}>{t("Try again")}</Button>
      </div>
    );
  }

  if (selection) {
    return (
      <AuthLayout icon={User} title={t("Welcome Back")}>
        <PortalSelection fullName={selection.full_name} roles={selection.roles} />
      </AuthLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo className="w-9 h-9 rounded-xl" />
            <span className="font-bold text-lg">AMedix</span>
          </div>
          <div className="flex items-center gap-3">
            <AppLanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={() => {
              clearDoctorHospitalSession();
              base44.auth.logout(window.location.origin);
            }}>
              {t("Log out")}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("Welcome to AMedix")}</h1>
            <AboutAmedix />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={handlePatientSelect}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left rtl:text-right transition-all hover:shadow-lg hover:border-primary/30 disabled:opacity-50"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{t("I am a Patient")}</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  {t("Receive a unique Clinical Identification Number (CIN) and manage your health records in one secure place.")}
                </p>
                <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
                  {t("Get started")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            <button
              onClick={handleDoctorSelect}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left rtl:text-right transition-all hover:shadow-lg hover:border-primary/30"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Stethoscope className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{t("I am a Doctor")}</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  {t("Register your professional account, search patients by CIN, and manage clinical records and test requests.")}
                </p>
                <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
                  {t("Register")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>

        </div>
      </main>

      {showDoctorForm && (
        <DoctorRegistrationForm
          state={doctorRegState}
          restores={doctorRestores}
          onClose={() => setShowDoctorForm(false)}
          onSubmitted={() => {
            localStorage.removeItem("amh_selected_role");
            navigate("/doctor");
          }}
        />
      )}

      {showPatientForm && (
        <PatientLanguageProvider>
          <PatientOnboardingForm
            user={user}
            onComplete={() => {
              localStorage.removeItem("amh_selected_role");
              navigate("/patient");
            }}
            onClose={() => setShowPatientForm(false)}
          />
        </PatientLanguageProvider>
      )}
    </div>
  );
}