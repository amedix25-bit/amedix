import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAppLanguage } from "@/lib/appLanguage";
import { Image } from "@/components/ui/image";
import { ChevronDown, Building2, Check, Loader2 } from "lucide-react";

// Hospital switcher (Overview). The small ▼ next to the current hospital's
// name opens a dropdown of the doctor's authorized hospitals — each option
// shows the hospital's official logo and name. Selecting one switches the
// active hospital for the session: the backend re-verifies the doctor's
// ACTIVE association with the selected hospital before the switch is
// allowed, so a doctor can never switch to a hospital they are not
// authorized at.
export default function HospitalSwitcher({ current, onSwitched }) {
  const { t } = useAppLanguage();
  const [open, setOpen] = useState(false);
  const [hospitals, setHospitals] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const loadList = async () => {
    if (hospitals) return;
    try {
      const res = await base44.functions.invoke("doctorHospitalSession", { list: true });
      setHospitals(res.data.hospitals || []);
    } catch (err) {
      console.error(err);
      setHospitals([]);
    }
  };

  const select = async (h) => {
    if (busyId) return;
    if (current && h.hospital_id === current.hospital_id) {
      setOpen(false);
      return;
    }
    setBusyId(h.hospital_id);
    setError("");
    try {
      // The backend verifies the doctor still holds an active authorized
      // association with the selected hospital before switching the session.
      const res = await base44.functions.invoke("doctorHospitalSession", {
        hospital_name: h.hospital_name,
      });
      onSwitched(res.data);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || "Could not switch hospital.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) loadList();
        }}
        className="flex items-center gap-1 font-semibold text-sm mt-0.5 text-left hover:text-primary transition-colors"
        title={t("Switch hospital")}
      >
        <span className="max-w-[180px] truncate">{current?.hospital_name || "—"}</span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-64 max-w-[80vw] rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1.5">
          <p className="px-2 py-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            {t("Your authorized hospitals")}
          </p>
          {!hospitals && (
            <p className="px-2 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("Loading...")}
            </p>
          )}
          {hospitals && hospitals.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              {t("No authorized hospitals yet. Join a hospital from My Hospitals with its AMedix Hospital Code.")}
            </p>
          )}
          {hospitals?.map((h) => (
            <button
              key={h.hospital_id}
              type="button"
              onClick={() => select(h)}
              disabled={!!busyId}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-60"
            >
              <span className="w-9 h-9 rounded-lg overflow-hidden border border-border bg-background flex items-center justify-center shrink-0">
                {h.hospital_photo_url ? (
                  <Image
                    src={h.hospital_photo_url}
                    alt={`${h.hospital_name} logo`}
                    fittingType="fill"
                    className="w-full h-full"
                  />
                ) : (
                  <Building2 className="w-4 h-4 text-primary/40" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate">{h.hospital_name}</span>
                {h.hospital_location && (
                  <span className="block text-[11px] text-muted-foreground truncate">{h.hospital_location}</span>
                )}
              </span>
              {busyId === h.hospital_id ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : current && h.hospital_id === current.hospital_id ? (
                <Check className="w-4 h-4 text-primary shrink-0" />
              ) : null}
            </button>
          ))}
          {error && <p className="px-2 py-1 text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}