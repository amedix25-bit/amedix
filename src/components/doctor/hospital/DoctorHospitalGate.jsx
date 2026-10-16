import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SpecialtyDepartmentSelect from "@/components/doctor/hospital/SpecialtyDepartmentSelect";
import { useAppLanguage } from "@/lib/appLanguage";
import { Building2, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

// Hospital Code Gate — the security door to the Doctor Portal. The doctor must
// enter the AMedix Hospital Code of the hospital they are currently working at;
// the backend verifies the code AND that the doctor holds an active
// association with that hospital before the portal session is opened. Doctors
// who have not joined any hospital yet can join from here with the hospital's
// code (same verified join flow as My Hospitals).
export default function DoctorHospitalGate({ profile, user, onVerified }) {
  const { t } = useAppLanguage();
  const [code, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [assocs, setAssocs] = useState(null);

  // Hospital pick step — the doctor selects the hospital they work in before
  // entering its AMedix Hospital Code.
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Join flow (only offered when the doctor has no active association yet)
  const [joinStep, setJoinStep] = useState("code"); // code | confirm
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalLocation, setHospitalLocation] = useState("");
  const [department, setDepartment] = useState(profile?.specialization || "");

  useEffect(() => {
    const load = async () => {
      try {
        const list = await base44.entities.HospitalDoctor.filter({ doctor_user_id: user.id });
        setAssocs(list);
      } catch (err) {
        console.error(err);
        setAssocs([]);
      }
    };
    if (user?.id) load();
  }, [user?.id]);

  const active = (assocs || []).filter((a) => a.status === "active");
  const needsJoin = assocs !== null && active.length === 0;

  const verifyAndEnter = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("doctorHospitalSession", { code: code.trim() });
      onVerified(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not verify the hospital code.");
    } finally {
      setBusy(false);
    }
  };

  // --- Join flow for doctors with no hospital association yet ---
  const verifyJoinCode = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("doctorJoinHospital", { code: code.trim(), verify_only: true });
      setHospitalName(res.data.hospital_name);
      setHospitalLocation(res.data.hospital_location || "");
      setJoinStep("confirm");
    } catch (err) {
      setError(err.response?.data?.error || "Could not verify the hospital code.");
    } finally {
      setBusy(false);
    }
  };

  const confirmJoin = async () => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("doctorJoinHospital", { code: code.trim(), department: department.trim() });
      const res = await base44.functions.invoke("doctorHospitalSession", { code: code.trim() });
      onVerified(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not join the hospital.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold">{t("Verify Your Hospital")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("Dr.")} {(profile?.full_name || "").replace(/^Dr\.?\s*/i, "").trim()} — {t("select the hospital you work in, then enter its AMedix Hospital Code to open your Doctor Portal session.")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
          {needsJoin && joinStep === "code" ? (
            <>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {t("You have not joined any hospital yet. Enter the hospital's AMedix Hospital Code to join and start working.")}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("AMedix Hospital Code")}</Label>
                <Input
                  value={code}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="AMX-XXXXXXXX"
                />
              </div>
              <Button className="w-full" onClick={verifyJoinCode} disabled={busy || !code.trim()}>
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("Verify Code")}
              </Button>
            </>
          ) : needsJoin && joinStep === "confirm" ? (
            <>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{t("Hospital")}</p>
                <p className="font-semibold">{hospitalName}</p>
                {hospitalLocation && <p className="text-xs text-muted-foreground mt-0.5">{hospitalLocation}</p>}
              </div>
              <SpecialtyDepartmentSelect value={department} onChange={setDepartment} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setJoinStep("code")} disabled={busy}>
                  {t("Cancel")}
                </Button>
                <Button className="flex-1" onClick={confirmJoin} disabled={busy || !department}>
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("Join & Continue")}
                </Button>
              </div>
            </>
          ) : !selectedHospital ? (
            <>
              <p className="text-xs text-muted-foreground">{t("Select the hospital you work in")}</p>
              <div className="space-y-2">
                {active.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedHospital(a.hospital_name)}
                    className="w-full flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-left rtl:text-right hover:border-primary/40 hover:bg-accent/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{a.hospital_name}</p>
                      {a.hospital_location && <p className="text-xs text-muted-foreground truncate">{a.hospital_location}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t("Selected hospital")}</p>
                  <p className="font-semibold truncate">{selectedHospital}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedHospital(null); setCodeInput(""); setError(""); }}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  {t("Change")}
                </button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("AMedix Hospital Code")}</Label>
                <Input
                  value={code}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="AMX-XXXXXXXX"
                  onKeyDown={(e) => e.key === "Enter" && verifyAndEnter()}
                />
              </div>
              <Button className="w-full" onClick={verifyAndEnter} disabled={busy || !code.trim()}>
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                {t("Verify & Enter Portal")}
              </Button>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          {t("The AMedix Hospital Code is issued by the hospital administrator. It confirms you are officially authorized to work at that hospital.")}
        </p>
      </div>
    </div>
  );
}