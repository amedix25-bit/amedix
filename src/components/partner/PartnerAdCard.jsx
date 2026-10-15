import React from "react";
import { Image } from "@/components/ui/image";
import PartnerAdDetailsDialog from "@/components/partner/PartnerAdDetailsDialog";
import { Building2, Clock, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// One sponsored partner advertisement card in the Patient Portal. Premium
// partners get the large featured treatment (cover image, gold label, top
// placement) inside their own tab; standard partners get a compact card in the
// regular partner-listing area. Contact and directions actions appear only
// when the partner's approved content provides the data. Nothing here claims
// medication stock or laboratory tests unless the partner recorded it and it
// was approved — advertising only, never clinical content.
export default function PartnerAdCard({ ad, premium = false }) {
  const { t } = usePatientLanguage();
  const phone = ad.ad_contact_phone || ad.partner_phone;
  const waNumber = (ad.partner_whatsapp || phone || "").replace(/\D/g, "");
  const mapsUrl = ad.partner_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ad.partner_address)}`
    : null;

  const PremiumTag = () => (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5">
      <Sparkles className="w-3 h-3" /> {t("Premium Partner")}
    </span>
  );

  return (
    <div className={`rounded-xl border bg-card overflow-hidden flex flex-col ${premium ? "border-amber-300/60 shadow-sm" : "border-border"}`}>
      {premium && ad.ad_cover_url && (
        <div className="relative h-36 bg-secondary">
          <Image src={ad.ad_cover_url} fittingType="fill" className="w-full h-36" alt={ad.partner_name} />
          <span className="absolute top-2 left-2"><PremiumTag /></span>
          <span className="absolute top-2 right-2 rounded-full bg-black/45 text-white text-[10px] font-semibold px-2 py-0.5">
            {t("Sponsored")}
          </span>
        </div>
      )}
      <div className="p-4 flex flex-col grow">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-border bg-secondary flex items-center justify-center">
            {ad.partner_logo_url ? (
              <Image src={ad.partner_logo_url} fittingType="fit" className="w-11 h-11" alt={ad.partner_name} />
            ) : (
              <Building2 className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 grow">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold truncate flex items-center gap-1.5">
                {ad.partner_name}
                {premium && !ad.ad_cover_url && <PremiumTag />}
              </p>
              {!premium && (
                <span className="shrink-0 rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold px-2 py-0.5">
                  {t("Sponsored")}
                </span>
              )}
            </div>
            {ad.partner_number && <p className="text-[11px] text-muted-foreground">{ad.partner_number}</p>}
            {ad.ad_title && <p className="text-xs font-medium mt-1 line-clamp-1">{ad.ad_title}</p>}
          </div>
        </div>

        {ad.ad_description && (
          <p className={`text-sm text-muted-foreground mt-2 ${premium ? "" : "line-clamp-2"}`}>{ad.ad_description}</p>
        )}

        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {ad.partner_address && (
            <p className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span className="line-clamp-2">{ad.partner_address}</span></p>
          )}
          {ad.ad_hours && (
            <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" /> {ad.ad_hours}</p>
          )}
        </div>

        {(ad.ad_services || []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ad.ad_services.map((s, i) => (
              <span key={i} className="text-[11px] rounded-full bg-secondary text-secondary-foreground px-2 py-0.5">{s}</span>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 flex-wrap">
          {phone && (
            <a
              href={`tel:${phone}`}
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
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <MapPin className="w-3.5 h-3.5" /> {t("Get Directions")}
            </a>
          )}
          <span className="ms-auto">
            <PartnerAdDetailsDialog ad={ad} premium={premium} />
          </span>
        </div>
      </div>
    </div>
  );
}