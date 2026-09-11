import React from "react";
import { Heart } from "lucide-react";
import { Image } from "@/components/ui/image";

// "Welcome back" banner: greeting, tagline and stethoscope illustration.
export default function WelcomeBanner({ profile }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8 overflow-hidden">
      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground">WELCOME BACK,</p>
          <h2 className="text-2xl sm:text-3xl font-bold mt-1">
            Dr. {(profile?.full_name || "").replace(/^Dr\.?\s*/i, "").trim() || "Doctor"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Here's an overview of your daily activity and patient management.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Heart className="w-4 h-4 text-primary fill-primary shrink-0" />
            <p className="font-cursive text-2xl text-primary leading-none">Good care makes a difference</p>
          </div>
        </div>
        <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto sm:ml-auto shrink-0 rounded-full overflow-hidden">
          <Image
            src="https://media.base44.com/images/public/6a9ea24b809f9bb40f0d02bf/9a0a3e1b2_generated_image.png"
            alt="Stethoscope illustration"
            fittingType="fill"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}