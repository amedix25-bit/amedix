import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppLanguage } from "@/lib/appLanguage";

// The institutional credential fields shared by laboratory and pharmacy
// registration: registration number, licence, responsible person, authorised
// administrator and the licence document AMedix administration verifies.
export default function InstitutionRegistrationFields({
  values,
  onChange,
  licenseFile,
  onLicenseFile,
  responsibleLabel = "Responsible Person",
  responsiblePlaceholder = "Full name of the responsible person",
}) {
  const { t } = useAppLanguage();
  const field = (key, label, placeholder, extra = {}) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={values[key] || ""}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={placeholder}
        {...extra}
      />
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field("registration_number", t("Registration Number *"), t("Commercial / business registration no."))}
        {field("license_number", t("Licence Number *"), t("Laboratory / pharmacy licence no."))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field("responsible_person_name", `${responsibleLabel} *`, responsiblePlaceholder)}
        {field("responsible_person_license", t("Responsible Person Licence"), t("Professional licence number"))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field("administrator_name", t("Authorised Administrator *"), t("Full name of the account administrator"))}
        {field("administrator_phone", t("Administrator Phone"), t("+218 91 234 5678"), { type: "tel" })}
      </div>
      <div className="space-y-2">
        <Label>{t("Licence Document *")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("Upload the institution's licence so AMedix administration can verify it. Stored privately and opened only by the reviewing administrator.")}
        </p>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => document.getElementById(`${responsibleLabel}-license-file`)?.click()}>
            <FileText className="mr-2 h-4 w-4" />
            {licenseFile ? t("Change Document") : t("Upload Document")}
          </Button>
          <span className="truncate text-sm text-muted-foreground">
            {licenseFile ? licenseFile.name : t("PDF or image, up to 10 MB")}
          </span>
          <input
            id={`${responsibleLabel}-license-file`}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => onLicenseFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>
    </>
  );
}