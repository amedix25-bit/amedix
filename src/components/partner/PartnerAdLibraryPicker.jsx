import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Check, Loader2, Megaphone } from "lucide-react";

// The administrator-managed advertisement library as seen inside a partner
// portal. Partners browse the ACTIVE advertisements for their section — image,
// title, description, offer and services — and choose the one they want to use.
// The list refreshes on window focus and on a light interval, so changes made
// by the administrator appear without a rebuild.
export default function PartnerAdLibraryPicker({ partnerType, mode = "choose", selectedId, onSelect, onUse, disabled }) {
  const [templates, setTemplates] = useState(null); // null = loading

  const load = useCallback(async () => {
    try {
      const res = await base44.entities.PartnerAdTemplate.filter(
        { partner_type: partnerType, is_active: true },
        { sort: "-created_date", limit: 50 }
      );
      setTemplates(res.items || res);
    } catch (err) {
      console.error(err);
      setTemplates([]);
    }
  }, [partnerType]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    window.addEventListener("focus", load);
    const timer = setInterval(load, 30000);
    return () => {
      window.removeEventListener("focus", load);
      clearInterval(timer);
    };
  }, [load]);

  if (templates === null) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading advertisements...
      </div>
    );
  }

  // An empty library changes nothing for the partner — their own editor remains.
  if (templates.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div>
        <p className="font-semibold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          {mode === "use" ? "Advertisement library — choose the one you want to use" : "Choose an advertisement from the AMedix library"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {mode === "use"
            ? "Using a library advertisement sets it as your advertisement — then submit it for administrator review from the editor below."
            : "Optional: pick one of the administrator's advertisements to use when you subscribe. You can edit it afterwards."}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border overflow-hidden flex flex-col ${
              mode === "choose" && selectedId === t.id ? "border-primary ring-1 ring-primary" : "border-border"
            }`}
          >
            {t.image_url && <Image src={t.image_url} fittingType="fill" className="w-full h-32" alt={t.title} />}
            <div className="p-4 space-y-2 flex-1">
              <p className="font-semibold text-sm">{t.title}</p>
              {t.offer && <p className="text-xs text-amber-600 font-medium">{t.offer}</p>}
              {t.description && <p className="text-xs text-muted-foreground line-clamp-3">{t.description}</p>}
              {(t.services || []).length > 0 && (
                <ul className="space-y-0.5">
                  {t.services.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-4 pb-4">
              {mode === "choose" ? (
                <Button
                  size="sm"
                  variant={selectedId === t.id ? "default" : "outline"}
                  onClick={() => onSelect(t)}
                  className="w-full"
                >
                  {selectedId === t.id ? <><Check className="w-4 h-4" /> Selected</> : "Choose"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled={disabled} onClick={() => onUse(t)} className="w-full">
                  Use this advertisement
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}