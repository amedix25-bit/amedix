import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, AlertTriangle, HeartPulse, Pill, Loader2 } from "lucide-react";
import { medicationStatus, todayStr } from "@/lib/medicationUtils";
import { useDoctorText } from "@/lib/doctorMedicalTranslations";

export default function DoctorPatientSummary({ patient }) {
  const doctorText = useDoctorText();
  const [allergies, setAllergies] = useState(null);
  const [conditions, setConditions] = useState(null);
  const [meds, setMeds] = useState(null);
  // ICD-11 codes resolved from the TerminologyCode catalog — shown beside each
  // known condition (standards alignment, Phase 1).
  const [conditionCodes, setConditionCodes] = useState({});

  useEffect(() => {
    setAllergies(null);
    setConditions(null);
    setMeds(null);
    setConditionCodes({});
    const load = async () => {
      try {
        const res = await base44.functions.invoke("doctorPatientMedicalData", { patient_id: patient.id });
        const d = res.data;
        setAllergies(d.allergies || []);
        const known = (d.conditions || []).filter((c) => c.category === "known_case");
        setConditions(known);
        setMeds((d.medications || []).filter((m) => medicationStatus(m, todayStr()) === "active").map((m) => m.name));
        const names = [...new Set(known.map((c) => c.name).filter(Boolean))];
        if (names.length) {
          try {
            const lookup = await base44.functions.invoke("terminologyLookup", {
              concept_type: "medical_condition",
              terms: names,
            });
            const map = {};
            (lookup.data.matched || []).forEach((m) => { map[m.term] = m.code; });
            setConditionCodes(map);
          } catch (err) {
            console.error(err);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (patient?.id) load();
  }, [patient?.id]);

  const dob = patient?.date_of_birth ? new Date(patient.date_of_birth) : null;
  const age =
    dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

  const allergyList =
    allergies === null
      ? null
      : allergies.length > 0
        ? allergies
            .map((a) => doctorText("Allergy", a, "allergen", a.allergen))
            .filter(Boolean)
            .join(", ")
        : doctorText("PatientProfile", patient, "allergies", patient.allergies) || "None recorded";

  const phoneNumbers =
    patient.phone_numbers?.length
      ? patient.phone_numbers
      : patient.phone
        ? [{ label: "Primary", number: patient.phone }]
        : [];
  const emergencyContacts =
    patient.emergency_contacts?.length
      ? patient.emergency_contacts
      : patient.emergency_contact_name
        ? [{
            name: patient.emergency_contact_name,
            relationship: patient.emergency_contact_relationship,
            phone: patient.emergency_contact_phone,
          }]
        : [];

  const items = [
    {
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
      label: "Allergies",
      value: allergyList,
    },
    {
      icon: <HeartPulse className="w-4 h-4 text-primary shrink-0 mt-0.5" />,
      label: "Known Conditions",
      value:
        conditions === null
          ? null
          : conditions.length > 0
            ? conditions
                .map((c) => {
                  const label = doctorText("MedicalCondition", c, "name", c.name);
                  const code = conditionCodes[c.name];
                  return label ? (code ? `${label} (ICD-11: ${code})` : label) : "";
                })
                .filter(Boolean)
                .join(", ")
            : "None recorded",
    },
    {
      icon: <Pill className="w-4 h-4 text-primary shrink-0 mt-0.5" />,
      label: "Current Medications",
      value: meds === null ? null : meds.length > 0 ? meds.join(", ") : "None",
    },
    {
      icon: <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />,
      label: "Emergency Contacts",
      value:
        emergencyContacts.length > 0
          ? emergencyContacts
              .map((c) => `${c.name}${c.relationship ? ` (${c.relationship})` : ""}${c.phone ? ` — ${c.phone}` : ""}`)
              .join("; ")
          : "None recorded",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <User className="w-6 h-6" />
        </div>
        <div>
          <p className="font-semibold text-lg leading-tight">{patient.full_name}</p>
          <p className="text-sm text-muted-foreground">CIN: {patient.cin}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Date of Birth</p>
          <p className="font-medium">
            {patient.date_of_birth || "—"}
            {age !== null ? ` (${age}y)` : ""}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Sex</p>
          <p className="font-medium capitalize">{patient.gender || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Blood Type</p>
          <p className="font-medium">{patient.blood_type || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Nationality</p>
          <p className="font-medium">{patient.nationality || "—"}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground text-xs">Occupation</p>
          <p className="font-medium">{(patient.occupations || []).join(", ") || "—"}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground text-xs">Phone</p>
          <p className="font-medium">
            {phoneNumbers.length > 0
              ? phoneNumbers.map((p) => `${p.label}: ${p.number}`).join(" · ")
              : "—"}
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 text-sm">
            {item.icon}
            <p>
              <span className="text-muted-foreground">{item.label}: </span>
              {item.value === null ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin inline text-muted-foreground" />
              ) : (
                <span className="font-medium">{item.value}</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}