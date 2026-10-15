import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Building2, Clock, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Full details dialog for one partner advertisement, opened from the
// "View Details" action. Shows exactly the approved, administrator-reviewed
// content: nothing about stock or tests is claimed here unless the partner
// recorded it and it was approved. A detail view counts at most once per
// viewer per day.
export default function PartnerAdDetailsDialog({ ad, premium = false }) {
  const { t } = usePatientLanguage();
  const [open, setOpen] = useState(false);

  const openDialog = () => {
    setOpen(true);
    base44.functions.invoke("adAnalyticsEvent", { ad_id: ad.ad_id, event_type: "detail_view" }).catch(() => {});
  };
  const phone = ad.ad_contact_phone || ad.partner_phone;
  const waNumber = (ad.partner_whatsapp || phone || "").replace(/\D/g, "");
  const mapsUrl = ad.partner_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ad.partner_address)}`
    : null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>{t("View Details")}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-border bg-secondary flex items-center justify-center">
                {ad.partner_logo_url ? (
                  <Image src={ad.partner_logo_url} fittingType="fit" className="w-9 h-9" alt={ad.partner_name} />
                ) : (
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className="min-w-0 truncate">{ad.company_name || ad.partner_name}</span>
              {premium && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 shrink-0">
                  <Sparkles className="w-3 h-3" /> {t("Premium Partner")}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {ad.ad_title && <p className="font-medium">{ad.ad_title}</p>}
            {ad.ad_description && <p className="text-muted-foreground">{ad.ad_description}</p>}
            {ad.ad_cover_url && (
              <Image src={ad.ad_cover_url} fittingType="fill" className="w-full h-36 rounded-lg border border-border" alt={ad.partner_name} />
            )}
            {(ad.ad_services || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t("Services")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {ad.ad_services.map((s, i) => (
                    <span key={i} className="text-[11px] rounded-full bg-secondary text-secondary-foreground px-2 py-0.5">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {ad.partner_address && (
                <p className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{ad.partner_address}</span></p>
              )}
              {phone && (
                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" />{phone}</p>
              )}
              {waNumber && (
                <p className="flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">WhatsApp</a>
                </p>
              )}
              {ad.ad_hours && (
                <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /> {ad.ad_hours}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap pt-1">
              {phone && (
                <Button size="sm" asChild>
                  <a href={`tel:${phone}`}><Phone className="w-4 h-4" /> {t("Contact")}</a>
                </Button>
              )}
              {waNumber && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4" /> {t("WhatsApp")}</a>
                </Button>
              )}
              {mapsUrl && (
                <Button size="sm" variant="outline" asChild>
                  <a href={mapsUrl} target="_blank" rel="noreferrer"><MapPin className="w-4 h-4" /> {t("Get Directions")}</a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}