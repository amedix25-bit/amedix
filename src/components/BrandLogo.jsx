import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// The one and only AMedix logo — the original glossy metallic blue "AM" mark
// inside its DNA helix ring. It is shown exactly as supplied wherever the app
// displays its brand mark, in a rounded tile.
export const AMEDIX_LOGO_URL =
  "https://base44.app/api/apps/6a9ea24b809f9bb40f0d02bf/files/mp/public/6a9ea24b809f9bb40f0d02bf/3d9813788_amedix-logo-original.png";

export default function BrandLogo({ className, fittingType = "fit" }) {
  return (
    <Image
      src={AMEDIX_LOGO_URL}
      alt="AMedix logo"
      fittingType={fittingType}
      className={cn("rounded-xl bg-black object-cover", className)}
    />
  );
}