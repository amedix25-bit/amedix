import React from "react";
import { Image } from "@/components/ui/image";

// Only illustration regions are displayed. Names, clinical values and the
// example QR code in the reference are never rendered by this component.
const SOURCE = "https://base44.app/api/apps/6a9ea24b809f9bb40f0d02bf/files/mp/public/6a9ea24b809f9bb40f0d02bf/8b09f4e81_amedix-patient-dashboard-reference.jpg";
const REGIONS = {
  logo: [78, 38, 36, 37],
  labs: [330, 245, 65, 64],
  imaging: [492, 248, 71, 63],
  medications: [681, 250, 64, 60],
  messages: [852, 252, 69, 58],
  heart: [498, 357, 86, 102],
  femaleIcon: [247, 374, 14, 17],
  cinWave: [233, 100, 73, 125],
};

export default function PatientReferenceArt({ kind, className = "" }) {
  const [x, y, width, height] = REGIONS[kind];
  return (
    <span className={`pp-reference-art ${className}`} aria-hidden="true" style={{ aspectRatio: `${width}/${height}` }}>
      <Image src={SOURCE} alt="" quality={100} className="absolute max-w-none" style={{ width: `${102400 / width}%`, height: `${60800 / height}%`, left: `${-100 * x / width}%`, top: `${-100 * y / height}%`, objectFit: "fill" }} />
    </span>
  );
}