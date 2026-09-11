import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export const AMEDIX_LOGO_URL =
  "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/af81ec076_Gemini_Generated_Image_rodp5orodp5orodp.jpg";

// The AMedix logo — the brand mark shown wherever the app displays its name.
// fittingType="fill" zooms/crops the logo into the given shape (e.g. a circle).
export default function BrandLogo({ className, fittingType = "fit" }) {
  return (
    <Image
      src={AMEDIX_LOGO_URL}
      alt="AMedix logo"
      fittingType={fittingType}
      className={cn("rounded-xl", className)}
    />
  );
}