import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, FlaskConical, Pill, Stethoscope } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";

// Professional entry points. Each one opens the existing login and
// registration flow of its portal — nothing here creates accounts or grants
// access; verification decisions stay with AMedix administration.
const PROFESSIONAL_OPTIONS = [
  {
    key: "doctor",
    icon: Stethoscope,
    title: "Doctor",
    description: "Clinical portal for verified doctors.",
    to: "/landing?portal=doctor",
  },
  {
    key: "hospital",
    icon: Building2,
    title: "Hospital",
    description: "Institutional portal for hospitals and clinics.",
    to: "/hospital",
  },
  {
    key: "lab",
    icon: FlaskConical,
    title: "Laboratory",
    description: "Laboratory portal for test requests and results.",
    to: "/lab",
  },
  {
    key: "pharmacy",
    icon: Pill,
    title: "Pharmacy",
    description: "Pharmacy portal for prescriptions and medication stock.",
    to: "/pharmacy",
  },
];

export default function ProfessionalAccess() {
  const { t } = useAppLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-9 w-9 rounded-xl" />
            <span className="text-lg font-normal [font-family:'Bungee',_system-ui]">AMedix</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/landing"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t("Back to Home")}
            </Link>
            <AppLanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-14">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("Healthcare Professional Access")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t("Select your professional portal to log in or register your account.")}
          </p>

          <div className="mt-10 grid gap-5 text-center sm:grid-cols-2">
            {PROFESSIONAL_OPTIONS.map(({ key, icon: Icon, title, description, to }) => (
              <Link
                key={key}
                to={to}
                className="flex flex-col items-center rounded-2xl border border-border bg-card p-7 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </span>
                <h2 className="mt-4 text-lg font-bold">{t(title)}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{t(description)}</p>
                <span className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
                  {t("Login or Register")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </span>
              </Link>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-xl text-xs text-muted-foreground">
            {t("Professional accounts are verified by AMedix administration before clinical or institutional access is granted. Hospitals receive an authorization code on approval.")}
          </p>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {t("AMedix · Connected Care. Better Health.")}
      </footer>
    </div>
  );
}