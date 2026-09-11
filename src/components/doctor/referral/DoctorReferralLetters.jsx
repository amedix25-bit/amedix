import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, Inbox, Send } from "lucide-react";
import PatientSearchSelect from "@/components/doctor/patients/PatientSearchSelect";
import ReferralLetterForm from "@/components/doctor/referral/ReferralLetterForm";
import ReceivedReferrals from "@/components/doctor/referral/ReceivedReferrals";
import SentReferrals from "@/components/doctor/referral/SentReferrals";

// Referral Letters tab of the Doctor Portal — two options:
// Send Referral (pick one of your authorized patients and generate the
// letter, optionally addressed to a colleague) and View Referrals
// (letters colleagues sent to you).
export default function DoctorReferralLetters({ doctorProfile }) {
  const [view, setView] = useState(null); // null | "send" | "received"
  const [patients, setPatients] = useState([]);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const access = await base44.entities.AccessRequest.filter({
          doctor_id: doctorProfile.id,
          status: "approved",
        });
        const ids = new Set(access.map((a) => a.patient_id));
        if (ids.size === 0) return;
        const all = await base44.entities.PatientProfile.list();
        setPatients(all.filter((p) => ids.has(p.id)));
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [doctorProfile.id]);

  if (!view) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setView("send")}
          className="rounded-xl border border-border bg-card p-6 text-left hover:border-primary/50 hover:shadow-sm transition-colors"
        >
          <Send className="w-8 h-8 text-primary mb-3" />
          <p className="font-semibold">Send Referral</p>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a referral letter for one of your patients and send it to a colleague.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setView("received")}
          className="rounded-xl border border-border bg-card p-6 text-left hover:border-primary/50 hover:shadow-sm transition-colors"
        >
          <Inbox className="w-8 h-8 text-primary mb-3" />
          <p className="font-semibold">View Referrals</p>
          <p className="text-sm text-muted-foreground mt-1">
            Referral letters your colleagues sent to you.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setView("sent")}
          className="rounded-xl border border-border bg-card p-6 text-left hover:border-primary/50 hover:shadow-sm transition-colors"
        >
          <FileText className="w-8 h-8 text-primary mb-3" />
          <p className="font-semibold">Referrals Sent by Me</p>
          <p className="text-sm text-muted-foreground mt-1">
            Referral letters you created, with their status and audit trail.
          </p>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setView(null);
          setPatient(null);
        }}
      >
        ← Back
      </Button>

      {view === "send" ? (
        patient ? (
          <ReferralLetterForm
            doctorProfile={doctorProfile}
            patient={patient}
            onDone={() => setPatient(null)}
            onCancel={() => setPatient(null)}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
            <PatientSearchSelect selected={patient} onSelect={setPatient} patients={patients} label="Patient *" />
            {patients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No authorized patients yet — request access from Find Patient first.
              </p>
            )}
          </div>
        )
      ) : view === "sent" ? (
        <SentReferrals doctorProfile={doctorProfile} />
      ) : (
        <ReceivedReferrals doctorProfile={doctorProfile} />
      )}
    </div>
  );
}