import React from "react";
import { ArrowRight, Stethoscope, User } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// The two public entry points: patients go straight to the patient
// login/registration flow, healthcare professionals continue to the separate
// professional access page.
const CARDS = [
  {
    key: "patient",
    icon: User,
    title: "I'm a Patient",
    description:
      "Log in to your health record, or create an account to receive your Clinical Identification Number (CIN).",
    action: "Patient Login / Register",
  },
  {
    key: "professional",
    icon: Stethoscope,
    title: "I'm a Healthcare Professional",
    description:
      "Doctor, hospital, laboratory, or pharmacy — sign in to your professional portal.",
    action: "Professional Access",
  },
];

export default function PrimaryChoice({ onSelect }) {
  const { t } = useAppLanguage();
  return (
    <div className="mx-auto mt-10 grid max-w-3xl gap-5 text-center sm:grid-cols-2">
      {CARDS.map(({ key, icon: Icon, title, description, action }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-7 w-7 text-primary" />
          </span>
          <h2 className="mt-5 text-xl font-bold">{t(title)}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t(description)}</p>
          <span className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
            {t(action)}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </span>
        </button>
      ))}
    </div>
  );
}