import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Mail } from "lucide-react";
import ReferralLetterForm from "@/components/doctor/referral/ReferralLetterForm";
import ReferralLetterCard from "@/components/doctor/referral/ReferralLetterCard";

// Referral Letters for one patient: list of the patient's referrals with
// status and audit trail, plus the "New Referral Letter" form.
export default function ReferralLetterManager({ doctorProfile, patient, onBack }) {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
  }, [patient.id]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ReferralLetter.filter({ patient_id: patient.id }, "-referral_datetime");
      setReferrals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="w-4 h-4 mr-1" />
          New Referral Letter
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading referrals...
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.length === 0 && !showForm ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No referral letters yet for this patient.</p>
            </div>
          ) : (
            referrals.map((r) => (
              <ReferralLetterCard key={r.id} referral={r} doctorName={doctorProfile.full_name} onUpdated={load} />
            ))
          )}
        </div>
      )}

      {showForm && (
        <ReferralLetterForm
          doctorProfile={doctorProfile}
          patient={patient}
          onDone={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}