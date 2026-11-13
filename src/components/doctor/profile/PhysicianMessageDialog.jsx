import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Send } from "lucide-react";
import { displayDoctor } from "@/lib/messaging";
import { useToast } from "@/components/ui/use-toast";

// Messaging a connected physician from their professional profile. The server
// verifies that both accounts are colleagues and fully verified before sending.
export default function PhysicianMessageDialog({ open, onOpenChange, doctor }) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ variant: "destructive", title: "Subject and message are required" });
      return;
    }
    setSending(true);
    try {
      await base44.functions.invoke("messagingApi", {
        action: "send",
        channel: "doctor",
        peer_user_id: doctor.user_id,
        subject,
        body,
      });
      toast({ title: "Message sent", description: `Your message reached ${displayDoctor(doctor.full_name)}.` });
      setSubject("");
      setBody("");
      onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Message not sent", description: e?.response?.data?.error });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {doctor ? displayDoctor(doctor.full_name) : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message"
            rows={5}
          />
          <div className="flex justify-end">
            <Button onClick={send} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}