import React from "react";
import { ChevronDown, UserRound, User, ShieldCheck, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { clearDoctorHospitalSession } from "@/lib/doctorHospitalSession";
import { usePatientLanguage } from "@/lib/patientLanguage";
import ProfessionalPortalSwitch from "@/components/portal/ProfessionalPortalSwitch";

export default function PatientProfileMenu({ name, onOpenProfile, onNavigate }) {
  const { t } = usePatientLanguage();
  const { user } = useAuth();
  const logout = () => { clearDoctorHospitalSession(); base44.auth.logout(window.location.origin); };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="pp-profile-select" aria-label={t("Profile & Settings")}><UserRound /><span>{name || t("Profile")}</span><ChevronDown /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onOpenProfile}><User className="mr-2 h-4 w-4" />{t("Personal Information")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onNavigate?.("access")}><ShieldCheck className="mr-2 h-4 w-4" />{t("Access & Privacy")}</DropdownMenuItem>
        {user && <ProfessionalPortalSwitch user={user} />}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}><LogOut className="mr-2 h-4 w-4" />{t("Log Out")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}