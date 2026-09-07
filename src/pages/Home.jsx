import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { HeartPulse, Stethoscope, User, ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
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
      const [patientProfiles, doctorProfiles] = await Promise.all([
        base44.entities.PatientProfile.filter({ user_id: user.id }),
        base44.entities.DoctorProfile.filter({ user_id: user.id }),
      ]);
      if (doctorProfiles.length > 0) {
        navigate("/doctor");
        return;
      }
      if (patientProfiles.length > 0) {
        navigate("/patient");
        return;
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const generateCIN = () => {
    const ts = Date.now().toString(36).toUpperCase().slice(-6);
    const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
    return `CIN-${ts}${rand}`;
  };

  const handlePatientSelect = async () => {
    setCreating(true);
    try {
      const cin = generateCIN();
      await base44.entities.PatientProfile.create({
        user_id: user.id,
        cin,
        full_name: user.full_name || user.email,
      });
      navigate("/patient");
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
        full_name: user.full_name || user.email,
        specialization: doctorForm.specialization,
        license_number: doctorForm.license_number,
        hospital: doctorForm.hospital,
        phone: doctorForm.phone,
        is_verified: false,
      });
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
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">A&M Healthcare</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => base44.auth.logout(window.location.origin)}>
            Log out
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome to A&M Healthcare</h1>
            <p className="text-muted-foreground mt-3 text-lg">Connected Care. Better Health.</p>
            <p className="text-muted-foreground mt-1">Choose your account type to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={handlePatientSelect}
              disabled={creating}
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
              onClick={() => setShowDoctorForm(true)}
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
    </div>
  );
}