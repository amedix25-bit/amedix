import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Stethoscope, Plus } from "lucide-react";
import ExaminationHistory from "./ExaminationHistory";
import ExaminationBuilderDialog from "./ExaminationBuilderDialog";
import ExaminationViewDialog from "./ExaminationViewDialog";

// Clinical Examinations section of the patient's clinical record — new
// examinations, history, read-only review and versioned amendments.
export default function ExaminationsTab({ patient, doctorProfile }) {
  const { user } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editOf, setEditOf] = useState(null);
  const [viewing, setViewing] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Clinical Examinations</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Structured examinations by type — every saved record is dated, versioned and permanently reviewable.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditOf(null);
            setBuilderOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" /> Examination
        </Button>
      </div>

      <ExaminationHistory
        patient={patient}
        reloadKey={reloadKey}
        onView={setViewing}
        onAmend={(r) => {
          setEditOf(r);
          setBuilderOpen(true);
        }}
      />

      {builderOpen && (
        <ExaminationBuilderDialog
          open={builderOpen}
          onOpenChange={(o) => {
            setBuilderOpen(o);
            if (!o) setEditOf(null);
          }}
          patient={patient}
          doctorProfile={doctorProfile}
          user={user}
          editOf={editOf}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}

      <ExaminationViewDialog
        record={viewing}
        open={Boolean(viewing)}
        onOpenChange={(o) => {
          if (!o) setViewing(null);
        }}
        onAmend={(r) => {
          setViewing(null);
          setEditOf(r);
          setBuilderOpen(true);
        }}
      />
    </div>
  );
}