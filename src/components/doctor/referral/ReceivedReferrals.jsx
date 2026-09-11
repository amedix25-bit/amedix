import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Inbox, Loader2 } from "lucide-react";
import ReferralLetterCard from "./ReferralLetterCard";

// Referral letters colleagues sent to this doctor — the doctor is the
// receiving doctor of each letter. Open the PDF, and mark the episode
// completed once the patient has been seen.
export default function ReceivedReferrals({ doctorProfile }) {
  const [referrals, setReferrals] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.ReferralLetter.filter(
        { receiving_doctor_id: doctorProfile.id },
        "-referral_datetime"
      );
      setReferrals(data);
    } catch (err) {
      console.error(err);
    }
  }, [doctorProfile.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (referrals === null) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading received referrals...
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No referrals received yet.</p>
        <p className="text-xs mt-1">Referral letters your colleagues send you will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {referrals.map((r) => (
        <ReferralLetterCard key={r.id} referral={r} doctorName={doctorProfile.full_name} onUpdated={load} />
      ))}
    </div>
  );
}