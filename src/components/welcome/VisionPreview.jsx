import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppLanguage } from "@/lib/appLanguage";
import {
  AR_PARAGRAPHS,
  AR_VISION_HEADING,
  AR_VISION_LINE,
  AR_FOUNDERS,
} from "@/lib/amedixStoryArabic";
import { FOUNDERS_EN } from "@/lib/founders";

const EN_STORY = [
  `AMedix was founded by two medical students: ${FOUNDERS_EN[0]} and ${FOUNDERS_EN[1]}, with a clear vision: to make healthcare connected, organized, and accessible for both patients and healthcare professionals.`,
  "At the heart of AMedix is the idea that a patient’s healthcare information should be securely organized and readily accessible whenever and wherever it is needed. The platform brings essential health information together in one place, including medical appointments, laboratory results, diagnostic imaging, medical documents, prescriptions, and medications, creating a comprehensive and accessible digital health record.",
  "Beyond record management, AMedix is designed to create an interconnected healthcare ecosystem that brings patients, physicians, laboratories, radiology services, and other healthcare providers together through a unified platform. By enabling healthcare information to move efficiently and securely across different points of care, AMedix aims to improve communication, support continuity of care, and reduce the fragmentation that often exists within the healthcare system.",
  "Most importantly, AMedix keeps the patient at the center of the healthcare journey. By connecting healthcare professionals, services, and information around each patient, the platform aims to create a simpler, more coordinated, and more informed healthcare experience.",
];

// Boldens AMedix and the founder names inside the official Arabic text without
// altering a single character of it.
const BOLD_PHRASES = ["AMedix", ...AR_FOUNDERS];
const BOLD_PATTERN = new RegExp(
  `(${BOLD_PHRASES.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`
);

function Emphasised({ text }) {
  return (
    <>
      {String(text || "")
        .split(BOLD_PATTERN)
        .map((part, i) => (BOLD_PHRASES.includes(part) ? <strong key={i}>{part}</strong> : part))}
    </>
  );
}

// "Our Vision" — the AMedix story.
export default function VisionPreview({ onClose }) {
  const { t, isArabic } = useAppLanguage();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("Our Vision")}
      className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-6">
            <h2 className="min-w-0 font-heading text-lg font-bold sm:text-xl">{t("Our Vision")}</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={t("Close")}
              className="shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            <div
              dir={isArabic ? "rtl" : "ltr"}
              className="space-y-3 text-sm leading-relaxed text-foreground"
            >
              {(isArabic ? AR_PARAGRAPHS : EN_STORY).map((paragraph, i) => (
                <p key={i}>
                  <Emphasised text={paragraph} />
                </p>
              ))}
              <p className="font-semibold">{isArabic ? AR_VISION_HEADING : "Our vision is simple:"}</p>
              <p className="text-base font-semibold text-primary sm:text-lg">
                {isArabic ? AR_VISION_LINE : "One patient. One connected healthcare journey. All in one place."}
              </p>
            </div>

            <Button type="button" variant="outline" className="w-full rounded-xl" onClick={onClose}>
              {t("Close")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}