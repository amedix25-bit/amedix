import React from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, User, Stethoscope, ArrowRight, ShieldCheck, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/90 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">A&M Healthcare</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/login")}>Log In</Button>
            <Button onClick={() => navigate("/register")}>Create Account</Button>
          </div>
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

          <div className="grid sm:grid-cols-2 gap-6 mt-12">
            <button
              onClick={() => navigate("/register")}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all hover:shadow-lg hover:border-primary/30"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">I'm a Patient</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Create your account and receive a unique Clinical Identification Number (CIN) with a QR code, so your records follow you everywhere.
                </p>
                <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
                  Get started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/register")}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all hover:shadow-lg hover:border-primary/30"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Stethoscope className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">I'm a Doctor</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Register your professional account, search patients by CIN, and manage appointments, clinical notes, and test requests.
                </p>
                <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
                  Register
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Button variant="outline" size="lg" onClick={() => navigate("/login")}>Log In</Button>
            <Button size="lg" onClick={() => navigate("/register")}>Create Account</Button>
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
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        A&amp;M Healthcare · Connected Care. Better Health.
      </footer>
    </div>
  );
}