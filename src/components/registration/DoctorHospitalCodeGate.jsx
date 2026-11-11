import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image } from "@/components/ui/image";
import { Building2, CheckCircle2, KeyRound, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

export const DOCTOR_HOSPITAL_CODE_KEY = "amh_doctor_hospital_code";

// First screen of doctor registration: "Join AMedix as a Doctor".
// The doctor may only continue with a code issued by an approved, active
// hospital. The code is verified on the server, and the verified hospital's
// name, logo and location are shown before the doctor continues to email
// verification.
export default function DoctorHospitalCodeGate({ onValidated }) {
  const { t } = useAppLanguage();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hospital, setHospital] = useState(null);

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("validateHospitalCode", { code: code.trim() });
      setHospital(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("This hospital code could not be verified."));
    } finally {
      setLoading(false);
    }
  };

  const proceed = () => {
    const value = { ...hospital, code: code.trim() };
    try {
      localStorage.setItem(DOCTOR_HOSPITAL_CODE_KEY, JSON.stringify(value));
    } catch (err) {
      /* storage only carries the code to the next step */
    }
    onValidated(value);
  };

  if (hospital) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center rounded-2xl border border-success/30 bg-success/5 p-5 text-center">
          {hospital.hospital_photo_url ? (
            <Image
              src={hospital.hospital_photo_url}
              alt={`${hospital.hospital_name} logo`}
              fittingType="fit"
              className="h-20 w-20 rounded-full border border-border bg-card object-contain"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-card">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          )}
          <h3 className="mt-3 text-lg font-bold">{hospital.hospital_name}</h3>
          {hospital.hospital_location && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {hospital.hospital_location}
            </p>
          )}
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("Verified AMedix hospital")}
          </span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {t("Your affiliation request will be sent to this hospital for approval after you submit your professional information.")}
        </p>
        <Button className="h-12 w-full font-medium" onClick={proceed}>
          {t("Continue to Email Verification")}
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            setHospital(null);
            setCode("");
          }}
        >
          {t("Use a different hospital code")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-accent p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">
          {t("A doctor can only join AMedix through an approved hospital. Enter the AMedix Hospital Code provided by your hospital administrator — it is verified before an account can be created.")}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="hospital-code">{t("AMedix Hospital Code *")}</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="hospital-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="AMX-XXXXXXXX"
            className="pl-10 font-mono uppercase tracking-wider"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            required
          />
        </div>
      </div>
      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <Button type="submit" className="h-12 w-full font-medium" disabled={loading || code.trim().length < 6}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("Verifying hospital code...")}
          </>
        ) : (
          t("Verify Hospital Code")
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {t("Ask your hospital administrator for their AMedix Hospital Code. Without it, doctor registration cannot continue.")}
      </p>
    </form>
  );
}