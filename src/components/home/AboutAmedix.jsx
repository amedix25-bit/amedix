import React from "react";
import { useAppLanguage } from "@/lib/appLanguage";
import { AR_PARAGRAPHS, AR_VISION_HEADING, AR_VISION_LINE } from "@/lib/amedixStoryArabic";

export default function AboutAmedix() {
  const { isArabic } = useAppLanguage();

  if (isArabic) {
    return (
      <div dir="rtl" className="max-w-2xl mx-auto mt-6 space-y-4">
        {AR_PARAGRAPHS.map((p, i) => (
          <p key={i} className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {p}
          </p>
        ))}
        <div className="pt-2">
          <p className="font-semibold text-foreground">{AR_VISION_HEADING}</p>
          <p className="text-primary font-semibold text-lg sm:text-xl mt-1">
            {AR_VISION_LINE}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-4">
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        AMedix was founded by two medical students, Ayatallah Abed Elallegy and
        Mohammed Saad Alsaba, with a clear vision: to make healthcare connected,
        organized, and accessible for both patients and healthcare professionals.
      </p>
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        At the heart of AMedix is the idea that a patient's healthcare information
        should be securely organized and readily accessible whenever and wherever
        it is needed. The platform brings essential health information together in
        one place, including medical appointments, laboratory results, diagnostic
        imaging, medical documents, prescriptions, and medications, creating a
        comprehensive and accessible digital health record.
      </p>
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        Beyond record management, AMedix is designed to create an interconnected
        healthcare ecosystem that brings patients, physicians, laboratories,
        radiology services, and other healthcare providers together through a
        unified platform. By enabling healthcare information to move efficiently
        and securely across different points of care, AMedix aims to improve
        communication, support continuity of care, and reduce the fragmentation
        that often exists within the healthcare system.
      </p>
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        Most importantly, AMedix keeps the patient at the center of the healthcare
        journey. By connecting healthcare professionals, services, and information
        around each patient, the platform aims to create a simpler, more
        coordinated, and more informed healthcare experience.
      </p>
      <div className="pt-2">
        <p className="font-semibold text-foreground">Our vision is simple:</p>
        <p className="text-primary font-semibold text-lg sm:text-xl mt-1">
          One patient. One connected healthcare journey. All in one place.
        </p>
      </div>
    </div>
  );
}