import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// Circular doctor avatar: the doctor's uploaded profile picture when
// available, initials otherwise. Used wherever a doctor is shown.
export default function DoctorAvatar({ photoUrl, name, className }) {
  const initials = (name || "")
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (photoUrl) {
    return (
      <div className={cn("rounded-full overflow-hidden shrink-0 bg-muted", className)}>
        <Image src={photoUrl} alt={name} fittingType="fill" className="w-full h-full" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full shrink-0 bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-semibold select-none",
        className
      )}
    >
      {initials || "Dr"}
    </div>
  );
}