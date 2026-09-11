import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Stethoscope, ScanLine, User, ArrowRight, Loader2, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PatientOnboardingForm from "@/components/patient/PatientOnboardingForm";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showRadiologistForm, setShowRadiologistForm] = useState(false);
  const [doctorSplit, setDoctorSplit] = useState(false);
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
  const [radiologistForm, setRadiologistForm] = useState({
    specialization: "",
    license_number: "",
    hospital: "",
    phone: "",
  });

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    if (!user) return;
    try {
      if (user.role === "admin") {
        navigate("/admin");
        return;
      }
      const [patientProfiles, doctorProfiles, labProfiles, radiologistProfiles] = await Promise.all([
        base44.entities.PatientProfile.filter({ user_id: user.id }),
        base44.entities.DoctorProfile.filter({ user_id: user.id }),
        base44.entities.LaboratoryProfile.filter({ user_id: user.id }),
        base44.entities.RadiologistProfile.filter({ user_id: user.id }),
      ]);
      // Radiologist accounts go to the Radiologist Portal. A radiologist may only
      // use the regular Doctor Portal when an administrator has explicitly
      // granted doctor_portal_access on their profile.
      if (radiologistProfiles.length > 0 && radiologistProfiles[0].doctor_portal_access !== true) {
        navigate("/radiologist");
        return;
      }
      if (doctorProfiles.length > 0) {
        navigate("/doctor");
        return;
      }
      if (labProfiles.length > 0) {
        navigate("/lab-portal");
        return;
      }
      if (patientProfiles.length > 0) {
        navigate("/patient");
        return;
      }
      const selectedRole = localStorage.getItem("amh_selected_role");
      if (selectedRole === "patient") {
        setShowPatientForm(true);
      } else if (selectedRole === "doctor") {
        setShowDoctorForm(true);
      } else if (selectedRole === "radiologist") {
        setShowRadiologistForm(true);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handlePatientSelect = () => setShowPatientForm(true);

  const handleRadiologistSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await base44.entities.RadiologistProfile.create({
        user_id: user.id,
        full_name: user.full_name || user.email,
        specialization: radiologistForm.specialization,
        license_number: radiologistForm.license_number,
        hospital: radiologistForm.hospital,
        phone: radiologistForm.phone,
        status: "active",
        doctor_portal_access: false,
      });
      localStorage.removeItem("amh_selected_role");
      navigate("/radiologist");
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await base44.entities.DoctorProfile.create({
        user_id: user.id,
        full_name: [doctorForm.first_name, doctorForm.middle_name, doctorForm.last_name].filter(Boolean).join(" "),
        first_name: doctorForm.first_name,
        middle_name: doctorForm.middle_name,
        last_name: doctorForm.last_name,
        name_edited: true,
        specialization: doctorForm.specialization,
        license_number: doctorForm.license_number,
        hospital: doctorForm.hospital,
        phone: doctorForm.phone,
        is_verified: false,
      });
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo className="w-9 h-9 rounded-xl" />
            <span className="font-bold text-lg">AMedix</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => base44.auth.logout(window.location.origin)}>
            Log out
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome to AMedix</h1>
            <p className="text-muted-foreground mt-3 text-lg">Connected Care. Better Health.</p>
            <p className="text-muted-foreground mt-1">Choose your account type to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={handlePatientSelect}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all hover:shadow-lg hover:border-primary/30 disabled:opacity-50"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">I am a Patient</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Receive a unique Clinical Identification Number (CIN) and manage your health records in one secure place.
                </p>
                <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
                  Get started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            <button
              onClick={() => setDoctorSplit(true)}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all hover:shadow-lg hover:border-primary/30"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Stethoscope className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">I am a Doctor</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Register your professional account, search patients by CIN, and manage clinical records and test requests.
                </p>
                <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
                  Register
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>

          {doctorSplit && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setDoctorSplit(false)}>
              <div className="bg-card rounded-2xl shadow-xl border border-border p-8 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">I am a Doctor</h2>
                  <button onClick={() => setDoctorSplit(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setDoctorSplit(false); setShowDoctorForm(true); }}
                    className="rounded-xl border border-border p-5 text-left hover:border-primary/40 hover:bg-accent/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Stethoscope className="w-5 h-5 text-primary" />
                    </div>
                    <p className="font-semibold">I am a Doctor</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manage patients, appointments, clinical notes, and test requests.
                    </p>
                  </button>
                  <button
                    onClick={() => { setDoctorSplit(false); setShowRadiologistForm(true); }}
                    className="rounded-xl border border-border p-5 text-left hover:border-primary/40 hover:bg-accent/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <ScanLine className="w-5 h-5 text-primary" />
                    </div>
                    <p className="font-semibold">I am a Radiologist</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manage authorized patients and radiology records in the Radiologist Portal.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showDoctorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowDoctorForm(false)}>
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Doctor Registration</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your professional details</p>
              </div>
              <button onClick={() => setShowDoctorForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="doc-first-name">First Name *</Label>
                  <Input id="doc-first-name" placeholder="First name" value={doctorForm.first_name} onChange={(e) => setDoctorForm({ ...doctorForm, first_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-middle-name">Middle Name</Label>
                  <Input id="doc-middle-name" placeholder="Middle name" value={doctorForm.middle_name} onChange={(e) => setDoctorForm({ ...doctorForm, middle_name: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-last-name">Last Name *</Label>
                <Input id="doc-last-name" placeholder="Last name" value={doctorForm.last_name} onChange={(e) => setDoctorForm({ ...doctorForm, last_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Input id="specialization" placeholder="e.g. Cardiology" value={doctorForm.specialization} onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License Number *</Label>
                <Input id="license" placeholder="Medical license number" value={doctorForm.license_number} onChange={(e) => setDoctorForm({ ...doctorForm, license_number: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospital">Hospital / Clinic</Label>
                <Input id="hospital" placeholder="Hospital or clinic name" value={doctorForm.hospital} onChange={(e) => setDoctorForm({ ...doctorForm, hospital: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="Contact number" value={doctorForm.phone} onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create Doctor Account"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {showRadiologistForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowRadiologistForm(false)}>
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Radiologist Registration</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your professional details</p>
              </div>
              <button onClick={() => setShowRadiologistForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRadiologistSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rad-specialization">Specialization *</Label>
                <Input id="rad-specialization" placeholder="e.g. Diagnostic Radiology" value={radiologistForm.specialization} onChange={(e) => setRadiologistForm({ ...radiologistForm, specialization: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rad-license">License Number *</Label>
                <Input id="rad-license" placeholder="Medical license number" value={radiologistForm.license_number} onChange={(e) => setRadiologistForm({ ...radiologistForm, license_number: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rad-hospital">Hospital / Imaging Center</Label>
                <Input id="rad-hospital" placeholder="Hospital or imaging center name" value={radiologistForm.hospital} onChange={(e) => setRadiologistForm({ ...radiologistForm, hospital: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rad-phone">Phone</Label>
                <Input id="rad-phone" placeholder="Contact number" value={radiologistForm.phone} onChange={(e) => setRadiologistForm({ ...radiologistForm, phone: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create Radiologist Account"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {showPatientForm && (
        <PatientOnboardingForm
          user={user}
          onComplete={() => {
            localStorage.removeItem("amh_selected_role");
            navigate("/patient");
          }}
          onClose={() => setShowPatientForm(false)}
        />
      )}
    </div>
  );
}