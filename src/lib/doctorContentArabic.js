import { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Patient Portal display rule for doctor-entered content.
// Doctor-facing clinical text is stored in English (dictation is translated to
// English before it is inserted). When the patient uses the Arabic Patient
// Portal, doctor-entered free text (instructions, indications, diagnoses,
// test names, ...) is translated into clear patient-friendly Arabic for
// display only. The original records are NEVER modified — translations are
// cached server-side in MedicalTranslation (direction: doctor_to_patient).

export function useDoctorTextAr(patientId, texts) {
  const { isArabic } = usePatientLanguage();
  const listKey = JSON.stringify(texts || []);
  const list = useMemo(
    () => [...new Set((texts || []).filter((t) => typeof t === "string" && t.trim()))],
    [listKey] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [map, setMap] = useState({});

  useEffect(() => {
    if (!isArabic || list.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("translateDoctorContent", {
          patient_id: patientId || "",
          texts: list,
        });
        if (!cancelled) setMap(res.data?.translations || {});
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isArabic, patientId, listKey]);

  // Returns the Arabic translation when available, otherwise the original.
  return useCallback((text) => (isArabic && map[text]) || text, [isArabic, map]);
}