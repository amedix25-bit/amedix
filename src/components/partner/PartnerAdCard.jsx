import React from "react";
import { Image } from "@/components/ui/image";
import { Building2, Clock, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";

// One partner advertisement card in the Patient Portal. Premium partners get
// the large featured treatment (cover image, gold label, top placement) inside
// their own tab; standard partners get a compact card. Nothing here affects
// clinical content ordering — this is advertising only.
export default function PartnerAdCard({ ad, premium = false }) {
  const phone = ad.ad_contact_phone || ad.partner_phone;
  const waNumber = (ad.partner_whatsapp || phone || "").replace(/\D/g, "");

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${premium ? "border-amber-300/60 shadow-sm" : "border-border"}`}>
      {premium && ad.ad_cover_url && (
        <div className="relative h-36 bg-secondary">
          <Image src={ad.ad_cover_url} fittingType="fill" className="w-full h-36" alt={ad.partner_name} />
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 shadow">
            <Sparkles className="w-3 h-3" /> Premium Partner
          </span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-border bg-secondary flex items-center justify-center">
            {ad.partner_logo_url ? (
              <Image src={ad.partner_logo_url} fittingType="fit" className="w-11 h-11" alt={ad.partner_name} />
            ) : (
              <Building2 className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate flex items-center gap-1.5">
              {ad.partner_name}
              {premium && !ad.ad_cover_url && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5">
                  <Sparkles className="w-3 h-3" /> Premium Partner
                </span>
              )}
            </p>
            {ad.partner_number && <p className="text-[11px] text-muted-foreground">{ad.partner_number}</p>}
          </div>
        </div>

        {ad.ad_description && (
          <p className={`text-sm text-muted-foreground mt-2 ${premium ? "" : "line-clamp-2"}`}>{ad.ad_description}</p>
        )}

        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {ad.partner_address && (
            <p className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span className="line-clamp-2">{ad.partner_address}</span></p>
          )}
          {phone && (
            <p className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <a href={`tel:${phone}`} className="hover:text-foreground hover:underline">{phone}</a>
              {waNumber && (
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:underline">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </p>
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
      </div>
    </div>
  );
}