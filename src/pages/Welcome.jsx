import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { ArrowRight } from "lucide-react";
import { AMEDIX_LOGO_URL } from "@/components/BrandLogo";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";
import { AR_PARAGRAPHS, AR_VISION_HEADING, AR_VISION_LINE } from "@/lib/amedixStoryArabic";

// Welcome screen — the first screen anyone sees when opening AMedix.
// The AMedix logo sits behind the message as a large, low-opacity watermark
// so the text and button stay fully readable. Get Started leads to the
// existing role-choice page. The language switcher is available from here,
// before any login or registration.
export default function Welcome() {
  const navigate = useNavigate();
  const { t, isArabic } = useAppLanguage();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex items-center justify-center">
      {/* AMedix logo watermark */}
      <div
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <Image
          src={AMEDIX_LOGO_URL}
          alt=""
          fittingType="fill"
          className="h-full w-full opacity-[0.15] mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen"
        />
      </div>

      {/* Top navigation — language selection available before login */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-end px-4 py-4">
        <AppLanguageSwitcher />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold">{t("Welcome to AMedix")}</h1>

        {isArabic ? (
          // Official, manually provided Arabic version — displayed verbatim,
          // never auto-translated, with the same design as the English
          // version and proper RTL alignment.
          <div className="mt-6 space-y-4 text-foreground leading-relaxed font-bold" dir="rtl">
            {AR_PARAGRAPHS.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="font-semibold">{AR_VISION_HEADING}</p>
            <p className="text-primary text-lg sm:text-xl">{AR_VISION_LINE}</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-foreground leading-relaxed font-bold">
            <p>
              AMedix was created by two medical students, Ayatallah Abed Elallegy and
              Mohammed Saad Alsaba, with a simple vision: to make healthcare easier for
              patients and healthcare professionals.
            </p>
            <p>
              Our goal is to bring the patient's healthcare journey into one place,
              connecting patients, doctors, and laboratories through one simple platform.
            </p>
            <p>
              From medical information and doctors' notes to laboratory requests and
              results, AMedix is designed to make healthcare more organized, accessible,
              and connected.
            </p>
          </div>
        )}

        <p className="mt-8 text-xl font-bold">
          {t("AMedix — Your Healthcare, All in One Place.")}
        </p>

        <Button size="lg" className="mt-8" onClick={() => navigate("/landing")}>
          {t("Get Started")}
          <ArrowRight className="w-4 h-4 ml-1 rtl:ml-0 rtl:mr-1" />
        </Button>
      </div>
    </div>
  );
}