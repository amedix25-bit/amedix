import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Stethoscope, User, ArrowRight, Loader2, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import AboutAmedix from "@/components/home/AboutAmedix";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/specialties";
import PatientOnboardingForm from "@/components/patient/PatientOnboardingForm";
import VerificationMethodSelector from "@/components/verification/VerificationMethodSelector";
import DocumentVerificationCard from "@/components/verification/DocumentVerificationCard";
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

  const [creating, setCreating] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    specialization: "",
    license_number: "",
    hospital: "",
    phone: "",
  });
  // Verification Process — the backend verdict of the ONE selected identity
  // method (Birth Certificate / Personal Card / Passport) plus the medical
  // license verification.
  const [doctorVerification, setDoctorVerification] = useState({ identity: null, medical_license: null });
  const [doctorVerError, setDoctorVerError] = useState("");

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
      if (selectedRole === "doctor") setShowDoctorForm(true);
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

  const handleDoctorSelect = async () => {
    try {
      const profiles = await base44.entities.DoctorProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        navigate("/doctor");
        return;
      }
    } catch (err) {
      console.error(err);
    }
    setShowDoctorForm(true);
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    // The specialty is chosen here, once, and becomes the doctor's permanent
    // portal — it can never be switched afterwards (see specialtyLock).
    if (!doctorForm.specialization) {
      setDoctorVerError(t("Please select your specialty."));
      return;
    }
    // One verified identity method AND the medical license are required.
    if (doctorVerification.identity?.status !== "verified" || doctorVerification.medical_license?.status !== "verified") {
      setDoctorVerError(t("Verification is required before you can continue."));
      return;
    }
    setCreating(true);
    try {
      const profile = await base44.entities.DoctorProfile.create({
        user_id: user.id,
        full_name: [doctorForm.first_name, doctorForm.middle_name, doctorForm.last_name].filter(Boolean).join(" "),
        first_name: doctorForm.first_name,
        middle_name: doctorForm.middle_name,
        last_name: doctorForm.last_name,
        name_edited: true,
        specialization: doctorForm.specialization,
        specialties: [doctorForm.specialization],
        license_number: doctorForm.license_number,
        hospital: doctorForm.hospital,
        phone: doctorForm.phone,
        is_verified: false,
      });
      // Associate the verified documents with the new doctor profile.
      try {
        await base44.functions.invoke("attachVerificationToProfile", {
          record_ids: [
            doctorVerification.identity.verification_id,
            doctorVerification.medical_license.verification_id,
          ],
          profile_type: "doctor",
          doctor_id: profile.id,
        });
      } catch (verr) {
        console.error(verr);
      }
      localStorage.removeItem("amh_selected_role");
      navigate("/doctor");
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDoctorForm(false)}>
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{t("Doctor Registration")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("Enter your professional details")}</p>
              </div>
              <button onClick={() => setShowDoctorForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="doc-first-name">{t("First Name *")}</Label>
                  <Input id="doc-first-name" placeholder={t("First name")} value={doctorForm.first_name} onChange={(e) => setDoctorForm({ ...doctorForm, first_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-middle-name">{t("Middle Name")}</Label>
                  <Input id="doc-middle-name" placeholder={t("Middle name")} value={doctorForm.middle_name} onChange={(e) => setDoctorForm({ ...doctorForm, middle_name: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-last-name">{t("Last Name *")}</Label>
                <Input id="doc-last-name" placeholder={t("Last name")} value={doctorForm.last_name} onChange={(e) => setDoctorForm({ ...doctorForm, last_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t("Specialty *")}</Label>
                <Select
                  value={doctorForm.specialization || undefined}
                  onValueChange={(v) => setDoctorForm((f) => ({ ...f, specialization: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select your specialty")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("Your specialty is permanent — it determines the portal and clinical documents you work in.")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospital">{t("Hospital / Clinic")}</Label>
                <Input id="hospital" placeholder={t("Hospital or clinic name")} value={doctorForm.hospital} onChange={(e) => setDoctorForm({ ...doctorForm, hospital: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("Phone")}</Label>
                <Input id="phone" placeholder={t("Contact number")} value={doctorForm.phone} onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} />
              </div>
              <div className="pt-2">
                <h3 className="text-sm font-semibold text-primary">{t("Verification Process")} *</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  {t("Your documents are verified securely and stored with your profile.")}
                </p>
              </div>
              <VerificationMethodSelector
                profileType="doctor"
                fullName={[doctorForm.first_name, doctorForm.middle_name, doctorForm.last_name].filter(Boolean).join(" ")}
                result={doctorVerification.identity}
                onResult={(r) => setDoctorVerification((s) => ({ ...s, identity: r }))}
                t={t}
              />
              <DocumentVerificationCard
                profileType="doctor"
                documentType="medical_license"
                title={t("Medical / Professional License Document")}
                description={t("Upload a clear photo or PDF")}
                fields={[{ key: "license_number", label: t("Medical License Number"), placeholder: t("Medical license number") }]}
                values={{ license_number: doctorForm.license_number }}
                onValueChange={(key, value) => {
                  setDoctorForm((f) => ({ ...f, license_number: value }));
                  setDoctorVerification((s) => ({ ...s, medical_license: null }));
                }}
                result={doctorVerification.medical_license}
                onResult={(r) => setDoctorVerification((s) => ({ ...s, medical_license: r }))}
                t={t}
              />
              {doctorVerError && <p className="text-sm text-destructive">{doctorVerError}</p>}
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : t("Create Doctor Account")}
              </Button>
            </form>
          </div>
        </div>
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