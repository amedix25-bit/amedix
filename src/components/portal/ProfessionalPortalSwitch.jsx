import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { usePatientLanguage } from "@/lib/patientLanguage";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

// Sidebar action inside the Patient Portal: shown only to accounts that also
// hold a Doctor or Radiologist profile — switches back to their professional
// portal with all professional permissions restored. Ordinary patients never
// see it.
export default function ProfessionalPortalSwitch({ user }) {
  const { t } = usePatientLanguage();
  const [target, setTarget] = useState(null); // "/doctor" | "/radiologist" | false

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [doctors, radiologists] = await Promise.all([
          base44.entities.DoctorProfile.filter({ user_id: user.id }),
          base44.entities.RadiologistProfile.filter({ user_id: user.id }),
        ]);
        if (!cancelled) {
          setTarget(doctors.length > 0 ? "/doctor" : radiologists.length > 0 ? "/radiologist" : false);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setTarget(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!target) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
      onClick={() => { window.location.href = target; }}
    >
      <ArrowLeftRight className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
      {t("Switch Portal")}
    </Button>
  );
}