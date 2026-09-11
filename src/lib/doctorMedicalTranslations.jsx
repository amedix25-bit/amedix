import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Doctor Portal display rule for patient-entered Arabic information.
// When a doctor opens a patient (My Patients → patient), this provider asks
// the backend for the English display versions of any patient-entered
// Arabic medical text. The patient's original data is never modified —
// translations are generated and cached separately, and the Patient Portal
// keeps displaying the original Arabic exactly as entered.

const DoctorTranslationsContext = createContext(null);

const HAS_ARABIC = /[\u0600-\u06FF]/;

export function DoctorTranslationsProvider({ patientId, children }) {
  const [state, setState] = useState({ ready: false, map: {} });

  useEffect(() => {
    let cancelled = false;
    if (!patientId) {
      setState({ ready: true, map: {} });
      return undefined;
    }
    setState({ ready: false, map: {} });
    (async () => {
      try {
        const res = await base44.functions.invoke("translatePatientMedicalInfo", {
          patient_id: patientId,
        });
        if (!cancelled) setState({ ready: true, map: res.data?.translations || {} });
      } catch (err) {
        console.error(err);
        if (!cancelled) setState({ ready: true, map: {} });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return (
    <DoctorTranslationsContext.Provider value={state}>
      {children}
    </DoctorTranslationsContext.Provider>
  );
}

// Returns the Doctor Portal display value for a patient-entered field:
// - English (or empty) values are returned unchanged.
// - Arabic values are replaced by the cached English medical translation.
// - While translations are still loading, returns null so components can
//   show a "Translating…" placeholder instead of the Arabic original.
// - If no translation exists, falls back to the original so information is
//   never lost.
// Outside the Doctor Portal (no provider) the original value is returned.
export function useDoctorText() {
  const ctx = useContext(DoctorTranslationsContext);
  return useCallback(
    (entity, record, field, original) => {
      if (typeof original !== "string" || !HAS_ARABIC.test(original)) return original;
      if (!ctx) return original; // No provider — not a Doctor Portal view
      if (!ctx.ready) return null; // Doctor view, translations still loading
      return ctx.map[`${entity}|${record?.id}|${field}`] || original;
    },
    [ctx]
  );
}

export function TranslatingPlaceholder() {
  return <span className="text-muted-foreground text-xs italic">Translating…</span>;
}