import React, { useState } from "react";
import { Stethoscope } from "lucide-react";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import LabLogin from "@/pages/LabLogin";
import LabRegister from "@/pages/LabRegister";
import HospitalLogin from "@/pages/HospitalLogin";
import HospitalRegister from "@/pages/HospitalRegister";
import PharmacyLogin from "@/pages/PharmacyLogin";
import PharmacyRegister from "@/pages/PharmacyRegister";
import AuthLayout from "@/components/AuthLayout";
import DoctorHospitalCodeGate from "@/components/registration/DoctorHospitalCodeGate";
import RegistrationProgress from "@/components/registration/RegistrationProgress";
import { useAppLanguage } from "@/lib/appLanguage";

const LOGINS = { lab: LabLogin, hospital: HospitalLogin, pharmacy: PharmacyLogin };
const REGISTRATIONS = { lab: LabRegister, hospital: HospitalRegister, pharmacy: PharmacyRegister };
const DOCTOR_STEPS = ["Hospital Code", "Email Verification", "Professional Information", "Hospital Approval"];

export default function PortalAuthForm({ portal, mode, onModeChange }) {
  const { t } = useAppLanguage();
  const [hospital, setHospital] = useState(null);

  // A doctor may only start registration with a valid AMedix Hospital Code from
  // an approved hospital — before any email address is entered.
  if (portal === "doctor" && mode === "register" && !hospital) {
    return (
      <AuthLayout
        icon={Stethoscope}
        title={t("Join AMedix as a Doctor")}
        subtitle={t("Step 1 of 4 · Hospital Code")}
        footer={
          <>
            {t("Already registered?")}{" "}
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className="font-medium text-primary hover:underline"
            >
              {t("Log in")}
            </button>
          </>
        }
      >
        <RegistrationProgress steps={DOCTOR_STEPS} current={0} />
        <DoctorHospitalCodeGate onValidated={setHospital} />
      </AuthLayout>
    );
  }

  const Form = mode === "register" ? REGISTRATIONS[portal] || Register : LOGINS[portal] || Login;
  return <div className="max-w-md mx-auto mt-10"><Form key={`${portal}-${mode}`} portal={portal} embedded onRegister={() => onModeChange("register")} onLogin={() => onModeChange("login")} /></div>;
}