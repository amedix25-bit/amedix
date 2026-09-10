import React, { useState, useEffect } from "react";
import { Users, UserPlus, ArrowRight } from "lucide-react";
import RadiologistAddPatient from "@/components/radiologist/RadiologistAddPatient";
import RadiologistMyPatients from "@/components/radiologist/RadiologistMyPatients";
import RadiologistPatientView from "@/components/radiologist/RadiologistPatientView";

// Radiologist Portal → Find Patient. Two side-by-side options:
// Add New (find by CIN or QR scan) and My Patients (authorized patients).
export default function RadiologistFindPatient({ radiologistProfile, user, pendingMode }) {
  const [mode, setMode] = useState(null); // null | "add" | "my"
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    if (pendingMode) setMode(pendingMode);
  }, [pendingMode]);

  if (selectedPatient) {
    return (
      <RadiologistPatientView
        patient={selectedPatient}
        radiologistProfile={radiologistProfile}
        user={user}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  if (mode === "add") {
    return (
      <RadiologistAddPatient
        radiologistProfile={radiologistProfile}
        user={user}
        onBack={() => setMode(null)}
        onOpenPatient={setSelectedPatient}
      />
    );
  }

  if (mode === "my") {
    return (
      <RadiologistMyPatients
        radiologistProfile={radiologistProfile}
        user={user}
        onBack={() => setMode(null)}
        onSelect={setSelectedPatient}
      />
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <button
        onClick={() => setMode("add")}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all hover:shadow-lg hover:border-primary/30"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Add New</h3>
          <p className="text-muted-foreground text-sm mt-2">
            Find a patient by their CIN or scan their QR code and request access to their record.
          </p>
          <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
            Continue
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </button>

      <button
        onClick={() => setMode("my")}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left transition-all hover:shadow-lg hover:border-primary/30"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-bold">My Patients</h3>
          <p className="text-muted-foreground text-sm mt-2">
            Patients who have authorized your access — open their radiology information and records.
          </p>
          <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
            Continue
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </button>
    </div>
  );
}