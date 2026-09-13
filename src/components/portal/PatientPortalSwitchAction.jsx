import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAppLanguage } from "@/lib/appLanguage";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, UserPlus } from "lucide-react";
import CreatePatientAccountDialog from "@/components/portal/CreatePatientAccountDialog";

// Sidebar action for the Doctor / Radiologist portals. When the account also
// has a patient role, it switches to the Patient Portal; otherwise it offers
// to create the linked patient profile.
export default function PatientPortalSwitchAction({ user }) {
  const { t } = useAppLanguage();
  const [hasPatient, setHasPatient] = useState(null); // null = loading
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profiles = await base44.entities.PatientProfile.filter({ user_id: user.id });
        if (!cancelled) setHasPatient(profiles.length > 0);
      } catch (err) {
        console.error(err);
        if (!cancelled) setHasPatient(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (hasPatient === null) return null;

  const buttonClass = "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent";

  return (
    <>
      {hasPatient ? (
        <Button variant="ghost" size="sm" className={buttonClass} onClick={() => { window.location.href = "/patient"; }}>
          <ArrowLeftRight className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t("Switch Portal")}
        </Button>
      ) : (
        <Button variant="ghost" size="sm" className={buttonClass} onClick={() => setDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t("Create Patient Account")}
        </Button>
      )}
      <CreatePatientAccountDialog open={dialogOpen} user={user} onClose={() => setDialogOpen(false)} />
    </>
  );
}