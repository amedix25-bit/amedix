import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Loader2 } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import FamilyHistoryEditor from "@/components/patient/family/FamilyHistoryEditor";
import { familyMemberKey, memberKeyOf } from "@/lib/familyHistory";

// Family history — one card per family member with that member's conditions.
// In the Doctor Portal the records arrive in `records` from the authorized
// backend payload and are read-only. The patient reads and maintains their own
// records: adding a member, editing their conditions or removing them.
export default function FamilyHistorySection({ number, patient, records, doctorView }) {
  const { t, isArabic } = usePatientLanguage();
  const [items, setItems] = useState(records || null);

  useEffect(() => {
    if (records) setItems(records);
  }, [records]);

  const load = useCallback(async () => {
    if (records || !patient?.id) return;
    try {
      const data = await base44.entities.FamilyHistory.filter({ patient_id: patient.id });
      setItems(data);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  }, [patient?.id, records]);

  useEffect(() => {
    load();
  }, [load]);

  const meta = () => ({
    patient_id: patient.id,
    patient_user_id: patient.user_id,
    patient_cin: patient.cin,
    patient_name: patient.full_name,
  });

  // EDIT replaces that member's conditions with the chosen list; ADD merges
  // into the member's existing card, so a relative is never duplicated.
  const saveMember = async (member, { editing }) => {
    const key = memberKeyOf(member);
    const current = (items || []).filter((entry) => familyMemberKey(entry) === key);
    const currentNames = new Set(current.map((entry) => String(entry.condition || "").trim().toLowerCase()));
    const wanted = new Map(member.conditions.map((c) => [c.en.trim().toLowerCase(), c]));
    const relationLabel = member.relation === "other" ? String(member.relation_label || "").trim() : "";

    const stale = editing
      ? current.filter((entry) => !wanted.has(String(entry.condition || "").trim().toLowerCase()))
      : [];
    const relabel = current.filter(
      (entry) =>
        wanted.has(String(entry.condition || "").trim().toLowerCase()) &&
        String(entry.relation_label || "") !== relationLabel
    );
    const additions = member.conditions.filter((c) => !currentNames.has(c.en.trim().toLowerCase()));

    await Promise.all([
      ...stale.map((entry) => base44.entities.FamilyHistory.delete(entry.id)),
      ...relabel.map((entry) => base44.entities.FamilyHistory.update(entry.id, { relation_label: relationLabel })),
      ...(additions.length
        ? [
            base44.entities.FamilyHistory.bulkCreate(
              additions.map((c) => ({
                ...meta(),
                relation: member.relation,
                relation_label: relationLabel,
                condition: c.en,
                condition_ar: c.ar || "",
              }))
            ),
          ]
        : []),
    ]);
    await load();
  };

  const removeMember = async (group) => {
    await Promise.all(group.entries.map((entry) => base44.entities.FamilyHistory.delete(entry.id)));
    await load();
  };

  // The doctor sees nothing when no family history was reported.
  if (doctorView && items !== null && items.length === 0) return null;

  return (
    <SectionCard number={number} title={t("Family History")}>
      {items === null ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t("Loading...")}
        </div>
      ) : (
        <FamilyHistoryEditor
          entries={items}
          isArabic={isArabic}
          readOnly={Boolean(doctorView)}
          emptyText={t("No family history recorded yet.")}
          onSaveMember={saveMember}
          onRemoveMember={removeMember}
        />
      )}
    </SectionCard>
  );
}