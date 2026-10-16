import React from "react";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import LabLogin from "@/pages/LabLogin";
import LabRegister from "@/pages/LabRegister";
import HospitalLogin from "@/pages/HospitalLogin";
import HospitalRegister from "@/pages/HospitalRegister";
import PharmacyLogin from "@/pages/PharmacyLogin";
import PharmacyRegister from "@/pages/PharmacyRegister";

const LOGINS = { lab: LabLogin, hospital: HospitalLogin, pharmacy: PharmacyLogin };
const REGISTRATIONS = { lab: LabRegister, hospital: HospitalRegister, pharmacy: PharmacyRegister };

export default function PortalAuthForm({ portal, mode }) {
  const Form = mode === "register" ? REGISTRATIONS[portal] || Register : LOGINS[portal] || Login;
  return <div className="max-w-md mx-auto mt-10"><Form key={`${portal}-${mode}`} portal={portal} embedded /></div>;
}