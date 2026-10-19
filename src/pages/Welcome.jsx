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
        aria-hidden="true">
        
        <Image
          src={AMEDIX_LOGO_URL}
          alt=""
          fittingType="fill"
          className="h-full w-full opacity-[0.15] mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen" />
        
      </div>

      {/* Top navigation — language selection available before login */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-end px-4 py-4">
        <AppLanguageSwitcher />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold">{t("Welcome to AMedix")}</h1>

        {isArabic ?
        // Official, manually provided Arabic version — displayed verbatim,
        // never auto-translated, with the same design as the English
        // version and proper RTL alignment.
        <div className="mt-6 space-y-4 text-foreground leading-relaxed font-bold" dir="rtl">
            {AR_PARAGRAPHS.map((p, i) =>
          <p key={i}>{p}</p>
          )}
            <p className="font-semibold">{AR_VISION_HEADING}</p>
            <p className="text-primary text-lg sm:text-xl">{AR_VISION_LINE}</p>
          </div> :

        <div className="mt-6 space-y-4 text-foreground leading-relaxed font-bold">
            <p className="font-normal"><strong>AMedix</strong> was founded by two medical students: Ayatallah Abed Elallegy and Mohammed Saad Alsaba, with a clear vision: to make healthcare connected, organized, and accessible for both patients and healthcare professionals.



          </p>
            <p>
              At the heart of AMedix is the idea that a patient’s healthcare information
              should be securely organized and readily accessible whenever and wherever
              it is needed. The platform brings essential health information together in
              one place, including medical appointments, laboratory results, diagnostic
              imaging, medical documents, prescriptions, and medications, creating a
              comprehensive and accessible digital health record.
            </p>
            <p>
              Beyond record management, AMedix is designed to create an interconnected
              healthcare ecosystem that brings patients, physicians, laboratories,
              radiology services, and other healthcare providers together through a
              unified platform. By enabling healthcare information to move efficiently
              and securely across different points of care, AMedix aims to improve
              communication, support continuity of care, and reduce the fragmentation
              that often exists within the healthcare system.
            </p>
            <p>
              Most importantly, AMedix keeps the patient at the center of the healthcare
              journey. By connecting healthcare professionals, services, and information
              around each patient, the platform aims to create a simpler, more
              coordinated, and more informed healthcare experience.
            </p>
            <p>Our vision is simple:</p>
            <p className="text-primary text-lg sm:text-xl">
              One patient. One connected healthcare journey. All in one place.
            </p>
          </div>
        }

        <p className="mt-8 text-xl font-bold">
          {t("AMedix — Your Healthcare, All in One Place.")}
        </p>

        <Button size="lg" className="mt-8" onClick={() => navigate("/landing")}>
          {t("Get Started")}
          <ArrowRight className="w-4 h-4 ml-1 rtl:ml-0 rtl:mr-1" />
        </Button>
      </div>
    </div>);

}