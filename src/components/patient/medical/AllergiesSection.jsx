import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import AddAllergyModal from "./AddAllergyModal";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { capitalize } from "@/lib/patientUtils";

const severityClass = (s) =>
  s === "severe"
    ? "px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium shrink-0"
    : s === "moderate"
      ? "px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium shrink-0"
      : "px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium shrink-0";

export default function AllergiesSection({ number, patient }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    try {
      const results = await base44.entities.Allergy.filter({ patient_id: patient.id });
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SectionCard
      number={number}
      title="Allergies"
      action={
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No allergies recorded. Add each allergen with its type, reaction, and severity.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{a.allergen}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {[a.allergy_type && capitalize(a.allergy_type), a.reaction].filter(Boolean).join(" · ")}
                </p>
              </div>
              {a.severity && <span className={severityClass(a.severity)}>{capitalize(a.severity)}</span>}
            </div>
          ))}
        </div>
      )}
      {showAdd && (
        <AddAllergyModal
          patient={patient}
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </SectionCard>
  );
}