import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { AMEDIX_LOGO_URL } from "@/components/BrandLogo";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";
import FoundersCredit from "@/components/welcome/FoundersCredit";
import VisionPreview from "@/components/welcome/VisionPreview";

// The mark's own proportions (1334 × 1179). The logo is always rendered with
// `fit` (object-contain) inside a box of this ratio, so it is scaled — never
// stretched, cropped or recoloured — on any screen.
const LOGO_WIDTH = 1334;
const LOGO_HEIGHT = 1179;

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

// Welcome screen — the first screen anyone sees when opening AMedix.
// Get Started leads to the existing portal choice page; Our Vision opens the
// story and a presentation preview of the home screen. Nothing here touches
// authentication, registration or any patient record.
export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useAppLanguage();
  const [visionOpen, setVisionOpen] = useState(false);

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-background">
      {/* Ambient brand glow — decorative only */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 end-[-6rem] h-80 w-80 rounded-full bg-accent/70 blur-3xl" />
      </div>

      {/* Language selection is available before any login or registration. */}
      <header className="relative z-10 flex justify-end px-4 py-4 sm:px-6">
        <AppLanguageSwitcher />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-6 sm:px-6 sm:pb-8">
        <div className="w-full max-w-3xl text-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={rise}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto w-fit"
          >
            <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-3 shadow-[0_30px_80px_-42px_hsl(var(--primary)/0.6)] backdrop-blur sm:rounded-[2rem] sm:p-5">
              <Image
                src={AMEDIX_LOGO_URL}
                alt="AMedix"
                fittingType="fit"
                originWidth={LOGO_WIDTH}
                originHeight={LOGO_HEIGHT}
                className="block h-auto w-[min(64vw,14rem)] sm:w-[min(48vw,18rem)] md:w-[min(38vw,20rem)] lg:w-[min(26rem,40vh)]"
              />
            </div>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={rise}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="mt-5 font-heading text-3xl font-bold tracking-tight sm:mt-8 sm:text-4xl lg:text-5xl"
          >
            {t("Welcome to AMedix")}
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            variants={rise}
            transition={{ duration: 0.5, delay: 0.14, ease: "easeOut" }}
            className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base lg:text-lg"
          >
            {t("Connected Care. Better Health.")}
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={rise}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <FoundersCredit className="mt-5 sm:mt-7" />
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={rise}
            transition={{ duration: 0.5, delay: 0.26, ease: "easeOut" }}
            className="mx-auto mt-6 flex w-full max-w-sm flex-col items-stretch gap-2.5 sm:mt-8 sm:gap-3"
          >
            {/* Primary action — the first thing a visitor notices. */}
            <Button
              size="lg"
              onClick={() => navigate("/landing")}
              className="group h-14 w-full rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-[0_24px_50px_-20px_hsl(var(--primary)/0.9)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-0"
            >
              {t("Get Started")}
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Button>

            {/* Secondary action — deliberately smaller and outlined. */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setVisionOpen(true)}
              className="h-11 w-full rounded-2xl border-border bg-card/70 text-sm font-medium backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground sm:h-12"
            >
              <Eye className="h-4 w-4" />
              {t("Our Vision")}
            </Button>
          </motion.div>
        </div>
      </main>

      {visionOpen && <VisionPreview onClose={() => setVisionOpen(false)} />}
    </div>
  );
}