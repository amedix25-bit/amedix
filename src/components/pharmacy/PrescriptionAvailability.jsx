import React from "react";
import usePrescriptionAvailability from "@/components/pharmacy/usePrescriptionAvailability";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { Building2, Loader2, MapPin, RefreshCw } from "lucide-react";

// Automatic medication availability check across affiliated pharmacies.
// Runs as soon as the component mounts (and on refresh) — shows stock levels,
// pharmacy locations and the latest inventory update, closest available stock
// first. Used by doctors right after issuing a prescription and by patients
// choosing which pharmacy to authorize. With showSubstitutes, the doctor also
// sees equivalent products (same active ingredient, different brand/generic)
// held by pharmacies — flagged for professional review; they require the
// prescriber's approval before any pharmacy dispenses them.
export default function PrescriptionAvailability({ medicationName, strength, activeIngredient, onSelect, refreshKey, showSubstitutes }) {
  const { pharmacies, substitutes, loading, error, check } = usePrescriptionAvailability({
    medicationName, strength, activeIngredient, refreshKey,
  });

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-primary" />
          Availability at Pharmacies
        </p>
        <Button variant="ghost" size="sm" onClick={check} disabled={loading} className="h-7 gap-1 px-2 text-xs">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Refresh
        </Button>
      </div>
      {loading && pharmacies === null && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Checking medication availability...
        </p>
      )}
      {!loading && pharmacies && pharmacies.length === 0 && !error && (
        <p className="text-xs text-muted-foreground mt-2">
          No affiliated pharmacy currently has this medication in stock. You can refresh later — pharmacies update their inventory in real time.
        </p>
      )}
      {!loading && !error && pharmacies && pharmacies.length > 0 && (
        <div className="mt-2 space-y-2">
          {pharmacies.map((p) => (
            <div key={p.pharmacy_id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              {p.logo_url ? (
                <Image src={p.logo_url} alt={p.pharmacy_name} className="w-10 h-10 rounded-full border border-border" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.pharmacy_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {p.address || "—"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-emerald-700">{p.quantity_in_stock} in stock</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.updated_datetime ? `Updated ${new Date(p.updated_datetime).toLocaleString()}` : "AM Pharmacy"}
                </p>
              </div>
              {onSelect && (
                <Button size="sm" onClick={() => onSelect(p)} className="shrink-0">
                  Select
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      {showSubstitutes && !loading && !error && substitutes.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Same Active Ingredient — Different Product (Substitution Candidates)
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            The exact product above could not be found everywhere, but these pharmacies stock an equivalent product with the same
            active ingredient and strength. Substitution requires your approval before the pharmacy may dispense it — the
            prescription is never changed automatically.
          </p>
          <div className="mt-2 space-y-2">
            {substitutes.map((s, i) => (
              <div key={s.pharmacy_id + "-" + i} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{s.medication_name}{s.strength ? ` ${s.strength}` : ""}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {s.pharmacy_name}{s.address ? ` · ${s.address}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-amber-700">{s.quantity_in_stock} in stock</p>
                  <p className="text-[11px] text-muted-foreground">{s.active_ingredient || ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}