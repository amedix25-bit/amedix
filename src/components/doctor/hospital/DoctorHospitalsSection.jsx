import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAppLanguage } from "@/lib/appLanguage";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SpecialtyDepartmentSelect from "@/components/doctor/hospital/SpecialtyDepartmentSelect";
import { Loader2, Building2, ArrowLeft } from "lucide-react";
import { Image } from "@/components/ui/image";

// My Hospitals — the doctor's verified hospital associations. A doctor joins a
// hospital ONLY with its unique AMedix Hospital Code (verified by the
// backend), can belong to several hospitals at once, and selects which one
// they are currently working at. The selected hospital drives the check-in
// security gate and every hospital-associated clinical action.
export default function DoctorHospitalsSection({ profile, user, onProfileUpdated }) {
  const { toast } = useToast();
  const { t } = useAppLanguage();
  const [assocs, setAssocs] = useState(null);
  const [step, setStep] = useState("code"); // code | confirm
  const [code, setCodeInput] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalLocation, setHospitalLocation] = useState("");
  const [department, setDepartment] = useState(profile.specialization || "");
  const [busy, setBusy] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);
  const [hospitalPhotoUrl, setHospitalPhotoUrl] = useState("");
  const [logosById, setLogosById] = useState({});

  const load = useCallback(async () => {
    try {
      const [list, dir] = await Promise.all([
        base44.entities.HospitalDoctor.filter({ doctor_user_id: user.id }),
        base44.functions.invoke("listActiveHospitals", {}),
      ]);
      setAssocs(list);
      const logos = {};
      (dir.data?.hospitals || []).forEach((h) => { logos[h.hospital_id] = h.hospital_photo_url || ""; });
      setLogosById(logos);
    } catch (err) {
      console.error(err);
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  const fail = (err) =>
    toast({
      title: "Something went wrong",
      description: err.response?.data?.error || err.message,
      variant: "destructive",
    });

  const verifyCode = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("doctorJoinHospital", { code: code.trim(), verify_only: true });
      setHospitalName(res.data.hospital_name);
      setHospitalLocation(res.data.hospital_location || "");
      setHospitalPhotoUrl(res.data.hospital_photo_url || "");
      setStep("confirm");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("doctorJoinHospital", { code: code.trim(), department: department.trim() });
      toast({
        title: "Joined hospital",
        description: `You are now officially associated with ${res.data.hospital_name}.`,
      });
      setStep("code");
      setCodeInput("");
      setHospitalName("");
      if (!profile.hospital) onProfileUpdated({ ...profile, hospital: res.data.hospital_name });
      load();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const workHere = async (a) => {
    setSwitchingId(a.id);
    try {
      await base44.entities.DoctorProfile.update(profile.id, { hospital: a.hospital_name });
      onProfileUpdated({ ...profile, hospital: a.hospital_name });
      toast({
        title: "Working hospital updated",
        description: "Patient check-ins, clinical notes and requests are now associated with this hospital.",
      });
    } catch (err) {
      fail(err);
    } finally {
      setSwitchingId(null);
    }
  };

  const active = (assocs || []).filter((a) => a.status === "active");
  const inactive = (assocs || []).filter((a) => a.status === "deactivated");
  const currentHospital = String(profile.hospital || "").trim().toLowerCase();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{t("Join Hospital")}</h3>
        </div>
        {step === "code" ? (
          <>
            <p className="text-xs text-muted-foreground">
              Enter the AMedix Hospital Code given to you by the hospital — a hospital name alone cannot be used to
              join.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="space-y-1.5 flex-1">
                <Label className="text-xs">{t("AMedix Hospital Code")}</Label>
                <Input
                  value={code}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="AMX-XXXXXXXX"
                />
              </div>
              <Button onClick={verifyCode} disabled={busy || !code.trim()}>
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("Verify Code")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                {hospitalPhotoUrl ? (
                  <Image src={hospitalPhotoUrl} alt={`${hospitalName} logo`} fittingType="fill" className="w-full h-full" />
                ) : (
                  <Building2 className="w-5 h-5 text-primary/40" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Hospital</p>
                <p className="font-semibold truncate">{hospitalName}</p>
                {hospitalLocation && <p className="text-xs text-muted-foreground mt-0.5">{hospitalLocation}</p>}
              </div>
            </div>
            <SpecialtyDepartmentSelect value={department} onChange={setDepartment} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("code")} disabled={busy}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                {t("Cancel")}
              </Button>
              <Button onClick={join} disabled={busy || !department}>
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("Confirm Join")}
              </Button>
            </div>
          </>
        )}
      </div>

      {assocs === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
        </div>
      ) : active.length === 0 && inactive.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">You have not joined any hospital yet. Enter the hospital's AMedix Hospital Code above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((a) => {
            const isCurrent = String(a.hospital_name || "").trim().toLowerCase() === currentHospital;
            return (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {logosById[a.hospital_id] ? (
                        <Image src={logosById[a.hospital_id]} alt={`${a.hospital_name} logo`} fittingType="fill" className="w-full h-full" />
                      ) : (
                        <Building2 className="w-5 h-5 text-primary/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{a.hospital_name}</p>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {t("Working Here")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("Your specialty / department at this hospital")}: {a.specialization}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Joined {a.joined_datetime ? new Date(a.joined_datetime).toLocaleDateString() : ""}
                    </p>
                    </div>
                  </div>
                  {!isCurrent && (
                    <Button size="sm" variant="outline" onClick={() => workHere(a)} disabled={switchingId === a.id}>
                      {switchingId === a.id && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                      {t("Work Here")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {inactive.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4 opacity-70">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">{a.hospital_name}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Deactivated</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                The hospital has paused this association. Contact the hospital administrator.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}