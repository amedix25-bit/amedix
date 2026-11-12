import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { AMEDIX_LOGO_URL } from "@/lib/amedixBrand";

// Original glossy blue artwork with verified PNG transparency.
// Keep the entire mark visible without adding a background or recoloring it.
export { AMEDIX_LOGO_URL };

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