import React from "react";
import { User, Stethoscope, ScanLine, FlaskConical, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppLanguage } from "@/lib/appLanguage";
import { PORTAL_DESTINATIONS, ROLE_LABELS } from "@/lib/portalAccess";
import { clearDoctorHospitalSession } from "@/lib/doctorHospitalSession";

const ROLE_ICONS = {
  patient: User,
  doctor: Stethoscope,
  radiologist: ScanLine,
  lab: FlaskConical,
  admin: ShieldCheck,
};

// "Welcome back, [Full Name] — Continue as:" — shown after a successful
// authentication when the account is authorized for more than one portal.
export default function PortalSelection({ fullName, roles }) {
  const { t } = useAppLanguage();

  const enter = (role) => {
    window.location.href = PORTAL_DESTINATIONS[role];
  };

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold">
        {t("Welcome back, {name} — Continue as:", { name: fullName || "" })}
      </h2>
      <div className="grid gap-3 mt-6">
        {roles.map((role) => {
          const Icon = ROLE_ICONS[role] || User;
          return (
            <button
              key={role}
              onClick={() => enter(role)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 font-medium transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <Icon className="w-5 h-5 text-primary" />
              {t(`Continue as ${ROLE_LABELS[role]}`)}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => {
          clearDoctorHospitalSession();
          base44.auth.logout(window.location.origin);
        }}
        className="mt-6 text-sm text-muted-foreground hover:text-foreground"
      >
        {t("Log out")}
      </button>
    </div>
  );
}