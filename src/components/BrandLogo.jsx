import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// Original glossy blue artwork with verified PNG transparency.
// Keep the entire mark visible without adding a background or recoloring it.
export const AMEDIX_LOGO_URL =
  "https://base44.app/api/apps/6a9ea24b809f9bb40f0d02bf/files/mp/public/6a9ea24b809f9bb40f0d02bf/d5620c0e4_amedix-glossy-blue-transparent.png";

export default function BrandLogo({ className }) {
  return (
    <Image
      src={AMEDIX_LOGO_URL}
      alt="AMedix logo"
      fittingType="fit"
      className={cn("bg-transparent object-contain", className)}
    />
  );
}