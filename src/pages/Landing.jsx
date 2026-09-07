import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, User, Stethoscope, ArrowRight, LogIn, ArrowLeft, ShieldCheck, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLE_CONTENT = {
  patient: {
    icon: User,
    title: "I am a Patient",
    description:
      "Log in to view your records, appointments, and test results — or create an account to receive your unique Clinical Identification Number (CIN) and QR code.",
  },
  doctor: {
    icon: Stethoscope,
    title: "I am a Doctor",
    description:
      "Log in to manage your patients, appointments, and clinical records — or register your professional account to get started.",
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null); // null | "patient" | "doctor"

  const selectRole = (r) => {
    localStorage.setItem("amh_selected_role", r);
    setRole(r);
  };

  const roleContent = role ? ROLE_CONTENT[role] : null;
  const RoleIcon = roleContent?.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/90 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">A&amp;M Healthcare</span>
          </div>
          {role && (
            <button
              onClick={() => setRole(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure, patient-owned clinical records
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Welcome to A&amp;M Healthcare</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
            Your medical information, securely connected to your healthcare.
          </p>

          {!role ? (
            <>
              <p className="text-sm text-muted-foreground mt-6 font-medium">Choose how you use the platform</p>

              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                <button
                  onClick={() => selectRole("patient")}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all hover:shadow-lg hover:border-primary/30"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <User className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">I am a Patient</h3>
                    <p className="text-muted-foreground text-sm mt-2">
                      Access your clinical records with your unique CIN and control which doctors can see them.
                    </p>
                    <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
                      Continue
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => selectRole("doctor")}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all hover:shadow-lg hover:border-primary/30"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Stethoscope className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">I am a Doctor</h3>
                    <p className="text-muted-foreground text-sm mt-2">
                      Search patients by CIN, manage appointments, clinical notes, and test requests.
                    </p>
                    <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
                      Continue
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mt-14 text-left">
                <div className="rounded-xl border border-border bg-card p-4">
                  <KeyRound className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-semibold">Unique CIN</p>
                  <p className="text-xs text-muted-foreground mt-1">Every patient receives a permanent, searchable identification number.</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <Lock className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-semibold">Patient-Controlled Access</p>
                  <p className="text-xs text-muted-foreground mt-1">Doctors can only view your record after you approve their request.</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <ShieldCheck className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-semibold">All Records in One Place</p>
                  <p className="text-xs text-muted-foreground mt-1">Appointments, labs, imaging, documents and medications, together.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="max-w-md mx-auto mt-10">
              <div className="rounded-2xl border border-border bg-card p-8 text-left">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  {RoleIcon && <RoleIcon className="w-7 h-7 text-primary" />}
                </div>
                <h2 className="text-2xl font-bold">{roleContent.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">{roleContent.description}</p>

                <div className="flex flex-col gap-3 mt-6">
                  <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Log In
                  </Button>
                  <Button size="lg" onClick={() => navigate("/register")}>
                    Create Account
                  </Button>
                </div>
              </div>
              <button
                onClick={() => setRole(null)}
                className="mt-6 mx-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                I am neither — choose again
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        A&amp;M Healthcare · Connected Care. Better Health.
      </footer>
    </div>
  );
}