import React, { useEffect, useState } from "react";
import { Eye, Info, RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import PatientOnboardingForm from "@/components/patient/PatientOnboardingForm";
import { PatientLanguageProvider } from "@/lib/patientLanguage";
import RegistrationInformationOverview from "./RegistrationInformationOverview";

// Admin-only patient registration preview. It opens the real onboarding form in
// preview mode, so the administrator inspects the actual layout and validation
// while nothing is created: no account, profile, CIN, OTP, document, clinical
// record or audit event.
const DEMO_USER = { id: "preview", full_name: "Demo Patient", email: "demo.patient@example.com" };

export default function AdminRegistrationPreview() {
  const [view, setView] = useState("form");
  const [open, setOpen] = useState(false);
  // Changing the key remounts the form, which clears every sample answer.
  const [sessionKey, setSessionKey] = useState(0);

  const restart = () => setSessionKey((k) => k + 1);

  // The patient form can switch the document to RTL for Arabic. Put the
  // surrounding app back exactly as it was when the preview closes.
  useEffect(() => {
    const el = document.documentElement;
    const previousDir = el.getAttribute("dir");
    const previousLang = el.getAttribute("lang");
    return () => {
      if (previousDir) el.setAttribute("dir", previousDir);
      else el.removeAttribute("dir");
      if (previousLang) el.setAttribute("lang", previousLang);
      else el.removeAttribute("lang");
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <Eye className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Preview patient registration</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Walk through the complete patient registration exactly as a patient sees it — every step, field, list and
              question — and enter temporary sample answers to test the form.
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p className="text-[11px] text-amber-800">
            <span className="font-semibold">Demo / test data only.</span> Nothing entered here is saved: no patient
            account, patient profile, CIN, OTP email, identity document, clinical record or audit event is created. All
            sample answers stay in this browser tab and disappear when you reset or leave the preview.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setView("form");
              setOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
            Start registration preview
          </Button>
          <Button variant="outline" onClick={() => setView("overview")}>
            <Info className="h-4 w-4" />
            Registration information overview
          </Button>
          <Button variant="ghost" onClick={restart} disabled={!open && sessionKey === 0}>
            <RotateCcw className="h-4 w-4" />
            Reset preview
          </Button>
        </div>
      </div>

      {view === "overview" && <RegistrationInformationOverview />}

      {view === "form" && !open && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Start the preview to open the patient registration form. Use “Fill sample data” inside it to move through
            every step quickly, or enter your own test answers.
          </p>
        </div>
      )}

      {open && (
        <PatientLanguageProvider>
          <PatientOnboardingForm
            key={sessionKey}
            user={DEMO_USER}
            previewMode
            onComplete={() => setOpen(false)}
            onClose={() => setOpen(false)}
            onResetPreview={restart}
          />
        </PatientLanguageProvider>
      )}
    </div>
  );
}