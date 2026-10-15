import React from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import PartnerAdDetailsDialog from "@/components/partner/PartnerAdDetailsDialog";
import { Building2, Clock, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Fire-and-forget analytics event. The backend deduplicates (at most one
// impression / detail view / contact click / direction click per viewer per
// day) and stores no patient identity.
const trackAdEvent = (adId, eventType) => {
  base44.functions.invoke("adAnalyticsEvent", { ad_id: adId, event_type: eventType })
    .catch(() => {});
};

// One sponsored partner advertisement card in the Patient Portal: a wide row
// with the cover image (or the partner logo) on the left, the approved title,
// a "location · hours · services" line, the approved description and the
// SPONSORED label. Contact and directions actions appear only when the
// partner's approved content provides the data. Nothing here claims medication
// stock or laboratory tests unless the partner recorded it and it was approved
// — advertising only, never clinical content.
export default function PartnerAdCard({ ad, premium = false }) {
  const { t } = usePatientLanguage();
  const phone = ad.ad_contact_phone || ad.partner_phone;
  const waNumber = (ad.partner_whatsapp || phone || "").replace(/\D/g, "");
  const mapsUrl = ad.partner_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ad.partner_address)}`
    : null;

  // Impression: counted once per advertisement per viewer per day (the
  // backend deduplicates).
  React.useEffect(() => {
    trackAdEvent(ad.ad_id, "impression");
  }, [ad.ad_id]);

  const PremiumTag = () => (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5">
      <Sparkles className="w-3 h-3" /> {t("Premium Partner")}
    </span>
  );

  const metaLine = [
    ad.partner_address,
    ad.ad_hours,
    (ad.ad_services || []).join(", "),
  ].filter(Boolean).join(" · ");

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${premium ? "border-amber-300/60 shadow-sm" : "border-border"}`}>
      <div className="p-4 flex gap-4">
        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-secondary border border-border flex items-center justify-center">
          {ad.ad_cover_url ? (
            <Image src={ad.ad_cover_url} fittingType="fill" className="w-24 h-24" alt={ad.partner_name} />
          ) : ad.partner_logo_url ? (
            <Image src={ad.partner_logo_url} fittingType="fit" className="w-16 h-16" alt={ad.partner_name} />
          ) : (
            <Building2 className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 grow">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold flex items-center gap-1.5 min-w-0">
              <span className="truncate">{ad.ad_title || ad.partner_name}</span>
              {premium && <PremiumTag />}
            </p>
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Sponsored")}
            </span>
          </div>
          {metaLine && <p className="text-xs text-muted-foreground mt-0.5 truncate">{metaLine}</p>}
          {ad.ad_description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{ad.ad_description}</p>
          )}
        </div>
      </div>

      {(phone || waNumber || mapsUrl) && (
        <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={() => trackAdEvent(ad.ad_id, "contact_click")}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <Phone className="w-3.5 h-3.5" /> {t("Contact")}
            </a>
          )}
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackAdEvent(ad.ad_id, "contact_click")}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs font-medium hover:bg-accent text-emerald-700"
            >
              <MessageCircle className="w-3.5 h-3.5" /> {t("WhatsApp")}
            </a>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackAdEvent(ad.ad_id, "direction_click")}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <MapPin className="w-3.5 h-3.5" /> {t("Get Directions")}
            </a>
          )}
          <span className="ms-auto">
            <PartnerAdDetailsDialog ad={ad} premium={premium} />
          </span>
        </div>
      )}
    </div>
  );
}