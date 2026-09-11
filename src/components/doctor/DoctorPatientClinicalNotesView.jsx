import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ClinicalNoteCard from "@/components/doctor/notes/ClinicalNoteCard";
import DiagnosisCard from "@/components/doctor/notes/DiagnosisCard";
import ReferralLetterCard from "@/components/doctor/referral/ReferralLetterCard";
import { Loader2 } from "lucide-react";

function TabButton({ active, count, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:bg-accent/60 hover:text-foreground"
      }`}
    >
      {children} ({count})
    </button>
  );
}

const entryTime = (e) =>
  new Date(e.encounter_datetime || e.created_datetime || e.date || e.created_date || 0).getTime();

// Patient Clinical Notes (Previous History). Clinical notes and diagnoses are
// split by the authoring physician's unique DoctorID: entries authored by the
// currently logged-in doctor appear under "My Clinical Notes", everything else
// under "Other Physicians' Clinical Notes". Both lists are newest first.
export default function DoctorPatientClinicalNotesView({ patientId, doctorId, embedded }) {
  const [items, setItems] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [imagingMap, setImagingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mine");

  useEffect(() => {
    const load = async () => {
      if (!patientId) return;
      try {
        const [notes, diagnoses, imaging, referralData] = await Promise.all([
          base44.entities.ClinicalNote.filter({ patient_id: patientId }, "-date"),
          base44.entities.Diagnosis.filter({ patient_id: patientId }, "-created_datetime"),
          base44.entities.ImagingRequest.filter({ patient_id: patientId }),
          base44.entities.ReferralLetter.filter({ patient_id: patientId }, "-referral_datetime"),
        ]);
        setReferrals(referralData);
        setItems([
          ...notes.map((n) => ({ ...n, __type: "note" })),
          ...diagnoses.map((d) => ({ ...d, __type: "diagnosis" })),
        ]);
        const map = {};
        imaging.forEach((img) => {
          map[img.id] = img;
        });
        setImagingMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  const reloadReferrals = async () => {
    try {
      const referralData = await base44.entities.ReferralLetter.filter({ patient_id: patientId }, "-referral_datetime");
      setReferrals(referralData);
    } catch (err) {
      console.error(err);
    }
  };

  const mine = (items || [])
    .filter((e) => doctorId && e.doctor_id === doctorId)
    .sort((a, b) => entryTime(b) - entryTime(a));
  const others = (items || [])
    .filter((e) => !doctorId || e.doctor_id !== doctorId)
    .sort((a, b) => entryTime(b) - entryTime(a));

  const renderEntry = (e) =>
    e.__type === "diagnosis" ? (
      <DiagnosisCard key={e.id} diagnosis={e} />
    ) : (
      <ClinicalNoteCard key={e.id} note={e} imagingMap={imagingMap} />
    );

  return (
    <div className={embedded ? "" : "mt-6 pt-6 border-t border-border"}>
      {!embedded && <h4 className="font-semibold text-sm mb-3">Clinical Notes</h4>}
      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <TabButton active={activeTab === "mine"} count={mine.length} onClick={() => setActiveTab("mine")}>
              My Notes
            </TabButton>
            <TabButton active={activeTab === "others"} count={others.length} onClick={() => setActiveTab("others")}>
              Other Physicians
            </TabButton>
            <TabButton active={activeTab === "referrals"} count={referrals.length} onClick={() => setActiveTab("referrals")}>
              Referral Letters
            </TabButton>
          </div>

          {activeTab === "referrals" ? (
            referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referral letters for this patient.</p>
            ) : (
              <div className="space-y-3">
                {referrals.map((r) => (
                  <ReferralLetterCard key={r.id} referral={r} doctorName={r.doctor_name} onUpdated={reloadReferrals} />
                ))}
              </div>
            )
          ) : activeTab === "mine" ? (
            mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clinical notes or diagnoses created by you for this patient.
              </p>
            ) : (
              <div className="space-y-3">{mine.map(renderEntry)}</div>
            )
          ) : others.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No clinical notes or diagnoses from other physicians for this patient.
            </p>
          ) : (
            <div className="space-y-3">{others.map(renderEntry)}</div>
          )}
        </div>
      )}
    </div>
  );
}