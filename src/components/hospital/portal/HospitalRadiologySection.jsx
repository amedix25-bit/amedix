import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Radiation, ExternalLink } from "lucide-react";
import DepartmentRadiologistMembers from "@/components/hospital/portal/DepartmentRadiologistMembers";

// Hospital Portal — Radiology Department configuration. Enabling the
// department routes every imaging request doctors submit for this facility
// to its worklist and unlocks the Radiology Department Portal.
export default function HospitalRadiologySection({ profile, onUpdate }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const enabled = !!profile.radiology_department_enabled;

  const toggle = async (checked) => {
    setSaving(true);
    try {
      const updated = await base44.entities.HospitalProfile.update(profile.id, {
        radiology_department_enabled: checked,
      });
      if (onUpdate) onUpdate(updated || { ...profile, radiology_department_enabled: checked });
      toast({
        title: checked ? "Radiology department enabled" : "Radiology department disabled",
        description: checked
          ? "Doctors' imaging requests for this facility now route to its radiology department worklist."
          : "Imaging requests for this facility will be refused until the department is enabled again.",
      });
    } catch (err) {
      toast({
        title: "Could not save the setting",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Radiation className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">Radiology Department</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enable this to configure a radiology department for {profile.hospital_name}. Doctors'
                imaging requests are routed here — to the department, never to an individual radiologist.
                Your department staff manage the worklist, scheduling, examinations, image availability
                and study assignment from the Radiology Department Portal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <Switch checked={enabled} onCheckedChange={toggle} disabled={saving} />
          </div>
        </div>
        {enabled && (
          <>
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
              <Link to="/radiology-department">
                <Button>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Radiology Department Portal
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                Radiologists associated with {profile.hospital_name} can also open the portal to claim and report studies.
              </p>
            </div>
            <DepartmentRadiologistMembers profile={profile} />
          </>
        )}
      </div>
    </div>
  );
}