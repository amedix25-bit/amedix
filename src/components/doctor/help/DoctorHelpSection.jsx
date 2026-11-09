import React from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, MessageSquareMore, LifeBuoy } from "lucide-react";

// Doctor Portal → Help & Support. Explains the escalation routes that already
// exist in AMedix: the hospital administration through Messages, and the
// emergency notice that clinical messaging is never an emergency channel.
const FAQS = [
  {
    q: "A patient does not appear in Find Patient",
    a: "Patient records are only visible after the patient has authorized you. Ask the patient to approve your access request from their AMedix Patient Portal, then search again by CIN.",
  },
  {
    q: "A lab or imaging request is not reaching the department",
    a: "Requests route to the laboratory or radiology department configured for your verified hospital. Check that your active hospital is the one the department belongs to in My Hospitals, then re-submit the order.",
  },
  {
    q: "I cannot send a prescription",
    a: "Prescribing requires an active consultation note and a patient record you are authorized to access. Medication safety checks must be reviewed before the prescription is issued.",
  },
  {
    q: "My hospital is not listed",
    a: "Hospital affiliation is granted by the hospital administrator with a valid AMedix Hospital Code. Open My Hospitals to request an affiliation, then wait for the hospital to approve it.",
  },
  {
    q: "A clinical note needs correction after signing",
    a: "Signed notes are never overwritten. Open the note and add an amendment — the original signature, author and timestamp stay intact in the record.",
  },
];

export default function DoctorHelpSection({ onNavigate }) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-critical/30 bg-critical/5 p-5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-critical" />
          <div>
            <h2 className="font-heading text-sm font-semibold text-critical">This platform is not for emergencies</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              AMedix does not dispatch emergency care. For a patient in an emergency, use your hospital&rsquo;s emergency
              procedure and local emergency services. Do not rely on portal messaging to reach anyone urgently.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-start gap-2">
          <MessageSquareMore className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <h2 className="font-heading text-sm font-semibold">Contact your hospital</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Administration, HR, scheduling, finance, IT and medical administration are reached through hospital
              messaging on your approved AMedix account.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => onNavigate({ key: "messages" })}>
          Open hospital messages
        </Button>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-1 flex items-start gap-2">
          <LifeBuoy className="mt-0.5 h-4 w-4 text-primary" />
          <h2 className="font-heading text-sm font-semibold">Frequently asked questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((item, index) => (
            <AccordionItem key={item.q} value={`faq-${index}`}>
              <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}