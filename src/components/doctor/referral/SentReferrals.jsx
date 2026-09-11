import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Loader2 } from "lucide-react";
import ReferralLetterCard from "./ReferralLetterCard";

// Referral letters this doctor created — their status, audit trail and PDF.
export default function SentReferrals({ doctorProfile }) {
  const [referrals, setReferrals] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.ReferralLetter.filter(
        { doctor_id: doctorProfile.id },
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
        Loading your referrals...
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>You haven't created any referral letters yet.</p>
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