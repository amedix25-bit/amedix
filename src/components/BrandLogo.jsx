import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export const AMEDIX_LOGO_URL =
  "https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/af81ec076_Gemini_Generated_Image_rodp5orodp5orodp.jpg";

// The AMedix logo — the brand mark shown wherever the app displays its name.
// fittingType="fill" zooms/crops the logo into the given shape (e.g. a circle).
//
// The logo asset has a white background, so we blend it into whatever surface
// it sits on: on light backgrounds mix-blend-multiply makes the white field
// disappear; on dark backgrounds we invert the image (white -> black) and use
// mix-blend-screen so the field vanishes and the metallic logo shows light.
// `onDark` forces the light treatment for dark surfaces even in light mode.
export default function BrandLogo({ className, fittingType = "fit", onDark = false }) {
  return (
    <Image
      src={AMEDIX_LOGO_URL}
      alt="AMedix logo"
      fittingType={fittingType}
      className={cn(
        "rounded-xl",
        onDark
          ? "invert hue-rotate-180 mix-blend-screen"
          : "mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen",
        className
      )}
    />
  );
}