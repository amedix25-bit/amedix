import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export const AMEDIX_LOGO_URL =
  "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/e8983db1b_Screenshot2026-09-11at54704PM.png";

// The AMedix logo — the brand mark shown wherever the app displays its name.
export default function BrandLogo({ className }) {
  return (
    <Image
      src={AMEDIX_LOGO_URL}
      alt="AMedix logo"
      fittingType="fit"
      className={cn("rounded-xl", className)}
    />
  );
}