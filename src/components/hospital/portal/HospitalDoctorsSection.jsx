import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAppLanguage } from "@/lib/appLanguage";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Stethoscope, Plus, Copy, KeyRound } from "lucide-react";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const isOnline = (ts) => !!ts && Date.now() - new Date(ts).getTime() < ONLINE_WINDOW_MS;

// Manage Doctors — every doctor officially associated with this hospital.
// Associations are created ONLY through the AMedix Hospital Code flow, so a
// doctor listed here is verified and authenticated. The hospital can filter
// by specialty, see who is online, and deactivate or remove a doctor's
// hospital access (never the doctor's overall AMedix account).
export default function HospitalDoctorsSection({ profile }) {
  const { toast } = useToast();
  const { t } = useAppLanguage();
  const [assocs, setAssocs] = useState(null);
  const [doctors, setDoctors] = useState({});
  const [specialty, setSpecialty] = useState("all");
  const [code, setCode] = useState(profile.hospital_code || "");
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.HospitalDoctor.filter({ hospital_id: profile.id });
      const visible = list.filter((a) => a.status !== "removed");
      const all = await base44.entities.DoctorProfile.list("-updated_date", 500);
      const byId = {};
      all.forEach((d) => {
        byId[d.id] = d;
      });
      setAssocs(visible);
      setDoctors(byId);
    } catch (err) {
      console.error(err);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const specialties = useMemo(() => {
    const set = new Set();
    (assocs || []).forEach((a) => {
      if (a.specialization) set.add(a.specialization);
    });
    return [...set].sort();
  }, [assocs]);

  const visible = (assocs || []).filter((a) => specialty === "all" || a.specialization === specialty);

  const fail = (err) =>
    toast({
      title: "Something went wrong",
      description: err.response?.data?.error || err.message,
      variant: "destructive",
    });

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateHospitalCode", {});
      setCode(res.data.hospital_code);
      toast({ title: "AMedix Hospital Code created" });
    } catch (err) {
      fail(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Code copied", description: "Share it with the doctor you want to add." });
    } catch (err) {
      /* clipboard unavailable — the code is visible on screen anyway */
    }
  };

  const updateAssociation = async (a, action) => {
    setBusyId(a.id);
    try {
      await base44.functions.invoke("hospitalUpdateDoctorAssociation", { association_id: a.id, action });
      const titles = {
        remove: "Doctor removed from hospital",
        deactivate: "Doctor deactivated",
        reactivate: "Doctor reactivated",
      };
      toast({
        title: titles[action],
        description:
          action === "remove"
            ? "They immediately lose access to this hospital's patients and information."
            : undefined,
      });
      setConfirmRemoveId(null);
      load();
    } catch (err) {
      fail(err);
    } finally {
      setBusyId(null);
    }
  };

  // A doctor who joined with this hospital's code is PENDING until the hospital
  // approves the affiliation. Decided server-side by hospitalDoctorAffiliation.
  const decideAffiliation = async (a, decision) => {
    setBusyId(a.id);
    try {
      await base44.functions.invoke("hospitalDoctorAffiliation", {
        association_id: a.id,
        action: decision,
        note: decision === "reject" ? "Affiliation not approved by the hospital." : "",
      });
      toast({
        title: decision === "approve" ? t("Affiliation approved") : t("Affiliation rejected"),
        description:
          decision === "approve"
            ? `${a.doctor_name} can now work at your hospital.`
            : `${a.doctor_name} was not added to your hospital.`,
      });
      load();
    } catch (err) {
      fail(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder={t("Select Specialty")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Specialties")}</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4 mr-1.5" /> {t("Add New Doctor")}
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{t("AMedix Hospital Code")}</h3>
          </div>
          {code ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <code className="text-xl font-bold tracking-widest rounded-lg bg-muted px-4 py-2">{code}</code>
                <Button size="sm" variant="outline" onClick={copyCode}>
                  <Copy className="w-4 h-4 mr-1.5" /> {t("Copy Code")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Give this code to the doctor you want to add. In their Doctor Portal they open My Hospitals, enter the
                code, confirm your hospital and their department — they then appear in this list. A doctor can never
                join by typing the hospital name.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Generate your hospital's unique AMedix Hospital Code and give it to the doctors you want to add.
              </p>
              <Button onClick={generateCode} disabled={generating}>
                {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("Generate Code")}
              </Button>
            </>
          )}
        </div>
      )}

      {assocs === null ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {assocs.length === 0
              ? "No doctors associated with your hospital yet. Generate your AMedix Hospital Code and give it to the doctors you want to add."
              : "No doctors in this specialty."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => {
            const d = doctors[a.doctor_id];
            const name = d?.full_name || a.doctor_name;
            const photo = d?.photo_url || a.doctor_photo_url;
            const online = isOnline(d?.last_active_datetime);
            return (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    {photo ? (
                      <Image src={photo} alt={name} fittingType="fill" className="w-12 h-12 rounded-full shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Stethoscope className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{name}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                          {online ? t("Online") : t("Offline")}
                        </span>
                        {a.status === "deactivated" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            Deactivated
                          </span>
                        )}
                        {a.status === "pending" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {t("Pending your approval")}
                          </span>
                        )}
                        {a.status === "rejected" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            {t("Rejected")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.specialization}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.status === "pending" ? (
                      <>
                        <Button size="sm" onClick={() => decideAffiliation(a, "approve")} disabled={busyId === a.id}>
                          {busyId === a.id && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                          {t("Approve Affiliation")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => decideAffiliation(a, "reject")}
                          disabled={busyId === a.id}
                        >
                          {t("Reject")}
                        </Button>
                      </>
                    ) : a.status === "active" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAssociation(a, "deactivate")}
                        disabled={busyId === a.id}
                      >
                        {t("Deactivate Doctor")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAssociation(a, "reactivate")}
                        disabled={busyId === a.id}
                      >
                        {t("Reactivate Doctor")}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmRemoveId(a.id)}>
                      {t("Remove Doctor")}
                    </Button>
                  </div>
                </div>
                {confirmRemoveId === a.id && (
                  <div className="flex items-center gap-2 border-t border-border mt-3 pt-3">
                    <p className="text-xs text-muted-foreground flex-1">
                      Remove this doctor's access to your hospital? Their overall AMedix account is kept — they lose
                      access to this hospital's patients and information immediately.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setConfirmRemoveId(null)}>
                      {t("Cancel")}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateAssociation(a, "remove")}>
                      {t("Confirm Remove")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}