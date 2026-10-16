import React from "react";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

const FEATURES = [
  { icon: KeyRound, title: "Unique CIN", text: "Every patient receives a permanent, searchable identification number." },
  { icon: Lock, title: "Patient-Controlled Access", text: "Doctors can only view your record after you approve their request." },
  { icon: ShieldCheck, title: "All Records in One Place", text: "Appointments, labs, imaging, documents and medications, together." },
];

export default function PortalFeatures() {
  const { t } = useAppLanguage();
  return (
    <div className="grid sm:grid-cols-3 gap-4 mt-14 text-left rtl:text-right">
      {FEATURES.map(({ icon: Icon, title, text }) => (
        <div key={title} className="rounded-xl border border-border bg-card p-4">
          <Icon className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm font-semibold">{t(title)}</p>
          <p className="text-xs text-muted-foreground mt-1">{t(text)}</p>
        </div>
      ))}
    </div>
  );
}