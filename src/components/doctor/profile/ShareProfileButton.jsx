import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Shares the physician's professional profile. The link opens the profile inside
// AMedix and still obeys the owner's privacy settings when it is opened.
export default function ShareProfileButton({ doctorId, name, size = "sm", variant = "outline", className = "" }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/doctor-profile/${doctorId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const field = document.createElement("textarea");
      field.value = url;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      document.body.removeChild(field);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Profile link copied",
      description: `Any AMedix physician who opens the link sees ${name ? `${name}'s` : "this"} profile.`,
    });
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name || "Physician"} on AMedix`, text: "Professional profile on AMedix", url });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    await copy();
  };

  return (
    <Button size={size} variant={variant} className={className} onClick={share}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      Share Profile
    </Button>
  );
}