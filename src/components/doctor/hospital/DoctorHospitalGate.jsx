import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SpecialtyDepartmentSelect from "@/components/doctor/hospital/SpecialtyDepartmentSelect";
import { Image } from "@/components/ui/image";
import { useAppLanguage } from "@/lib/appLanguage";
import { Building2, Loader2, ShieldCheck, Search, BadgeCheck } from "lucide-react";

// Hospital Code Gate — the security door to the Doctor Portal. The doctor
// selects the hospital they work in from the AMedix hospital directory, then
// enters that hospital's AMedix Hospital Code. The backend verifies the code
// AND the doctor's active association before the portal session is opened.
// Doctors who have not joined the selected hospital yet join here with the
// hospital's code (same verified join flow as My Hospitals).
export default function DoctorHospitalGate({ profile, user, onVerified }) {
  const { t } = useAppLanguage();
  const [code, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [assocs, setAssocs] = useState(null);
  const [hospitals, setHospitals] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // { hospital_id, hospital_name, hospital_location, hospital_photo_url, joined }
  const [step, setStep] = useState("pick"); // pick | code | confirm
  const [department, setDepartment] = useState(profile?.specialization || "");

  useEffect(() => {
    const load = async () => {
      try {
        const [dir, assocList] = await Promise.all([
          base44.functions.invoke("listActiveHospitals", {}),
          base44.entities.HospitalDoctor.filter({ doctor_user_id: user.id }),
        ]);
        setHospitals(dir.data?.hospitals || []);
        setAssocs(assocList);
      } catch (err) {
        console.error(err);
        setHospitals([]);
        setAssocs([]);
      }
    };
    if (user?.id) load();
  }, [user?.id]);

  const joinedIds = new Set((assocs || []).filter((a) => a.status === "active").map((a) => a.hospital_id));
  const directory = (hospitals || [])
    .filter((h) => !search.trim() || h.hospital_name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => Number(joinedIds.has(b.hospital_id)) - Number(joinedIds.has(a.hospital_id)));

  const pickHospital = (h) => {
    setSelected({ ...h, joined: joinedIds.has(h.hospital_id) });
    setCodeInput("");
    setError("");
    setStep("code");
  };

  const backToPick = () => {
    setSelected(null);
    setCodeInput("");
    setError("");
    setStep("pick");
  };

  // Already joined — verify the code and open the session.
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

  // Not joined yet — verify the code, then confirm hospital and department.
  const verifyJoinCode = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("doctorJoinHospital", { code: code.trim(), verify_only: true });
      setStep("confirm");
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

  const loading = hospitals === null || assocs === null;

  const HospitalHeader = () => (
    <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden">
          {selected?.hospital_photo_url
            ? <Image src={selected.hospital_photo_url} alt={selected.hospital_name} fittingType="fill" className="w-full h-full" />
            : <Building2 className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t("Selected hospital")}</p>
          <p className="font-semibold truncate">{selected?.hospital_name}</p>
        </div>
      </div>
      <button type="button" onClick={backToPick} className="text-xs text-primary hover:underline shrink-0">
        {t("Change")}
      </button>
    </div>
  );

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
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : hospitals.length === 0 ? (
            // No hospital registered yet — join directly with a code.
            step === "confirm" ? (
              <>
                <HospitalHeader />
                <SpecialtyDepartmentSelect value={department} onChange={setDepartment} />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={backToPick} disabled={busy}>{t("Cancel")}</Button>
                  <Button className="flex-1" onClick={confirmJoin} disabled={busy || !department}>
                    {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t("Join & Continue")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("AMedix Hospital Code")}</Label>
                  <Input value={code} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} placeholder="AMX-XXXXXXXX" />
                </div>
                <Button className="w-full" onClick={verifyJoinCode} disabled={busy || !code.trim()}>
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("Verify Code")}
                </Button>
              </>
            )
          ) : step === "pick" ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("Search AMedix hospitals")}
                  className="pl-10"
                />
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {directory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("No hospitals match your search.")}</p>
                ) : directory.map((h) => (
                  <button
                    key={h.hospital_id}
                    type="button"
                    onClick={() => pickHospital(h)}
                    className="w-full flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-left rtl:text-right hover:border-primary/40 hover:bg-accent/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden">
                      {h.hospital_photo_url
                        ? <Image src={h.hospital_photo_url} alt={h.hospital_name} fittingType="fill" className="w-full h-full" />
                        : <Building2 className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{h.hospital_name}</p>
                      {h.hospital_location && <p className="text-xs text-muted-foreground truncate">{h.hospital_location}</p>}
                    </div>
                    {joinedIds.has(h.hospital_id) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary shrink-0">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {t("Joined")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : selected?.joined ? (
            <>
              <HospitalHeader />
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
          ) : step === "confirm" ? (
            <>
              <HospitalHeader />
              <SpecialtyDepartmentSelect value={department} onChange={setDepartment} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("code")} disabled={busy}>{t("Cancel")}</Button>
                <Button className="flex-1" onClick={confirmJoin} disabled={busy || !department}>
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("Join & Continue")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <HospitalHeader />
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
                {t("Enter this hospital's AMedix Hospital Code to join and start working.")}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("AMedix Hospital Code")}</Label>
                <Input
                  value={code}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="AMX-XXXXXXXX"
                  onKeyDown={(e) => e.key === "Enter" && verifyJoinCode()}
                />
              </div>
              <Button className="w-full" onClick={verifyJoinCode} disabled={busy || !code.trim()}>
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("Verify Code")}
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