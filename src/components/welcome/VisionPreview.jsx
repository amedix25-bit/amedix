import React, { useEffect } from "react";
import { X, Home, CalendarDays, FlaskConical, ScanLine, Pill, Files, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { AMEDIX_LOGO_URL } from "@/components/BrandLogo";
import { useAppLanguage } from "@/lib/appLanguage";
import {
  AR_PARAGRAPHS,
  AR_VISION_HEADING,
  AR_VISION_LINE,
  AR_FOUNDERS,
} from "@/lib/amedixStoryArabic";
import { FOUNDERS_EN } from "@/lib/founders";

const LOGO_WIDTH = 1334;
const LOGO_HEIGHT = 1179;

const EN_STORY = [
  `AMedix was founded by two medical students: ${FOUNDERS_EN[0]} and ${FOUNDERS_EN[1]}, with a clear vision: to make healthcare connected, organized, and accessible for both patients and healthcare professionals.`,
  "At the heart of AMedix is the idea that a patient’s healthcare information should be securely organized and readily accessible whenever and wherever it is needed. The platform brings essential health information together in one place, including medical appointments, laboratory results, diagnostic imaging, medical documents, prescriptions, and medications, creating a comprehensive and accessible digital health record.",
  "Beyond record management, AMedix is designed to create an interconnected healthcare ecosystem that brings patients, physicians, laboratories, radiology services, and other healthcare providers together through a unified platform. By enabling healthcare information to move efficiently and securely across different points of care, AMedix aims to improve communication, support continuity of care, and reduce the fragmentation that often exists within the healthcare system.",
  "Most importantly, AMedix keeps the patient at the center of the healthcare journey. By connecting healthcare professionals, services, and information around each patient, the platform aims to create a simpler, more coordinated, and more informed healthcare experience.",
];

const HOME_TILES = [
  { label: "Home", icon: Home },
  { label: "Appointments", icon: CalendarDays },
  { label: "Lab Tests & Results", icon: FlaskConical },
  { label: "Imaging & Scans", icon: ScanLine },
  { label: "Medications & Prescriptions", icon: Pill },
  { label: "Reports & Documents", icon: Files },
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

// "Our Vision" — the AMedix story plus a presentation preview of the patient
// home screen. Every value in the preview is sample data; no patient record is
// read or shown.
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
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-bold sm:text-xl">{t("Our Vision")}</h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t("This is a presentation preview of the AMedix patient home screen. Every value shown is sample data.")}
              </p>
            </div>
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
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-[11px] font-medium text-amber-800">
                {t("Demo data only — no real patient information")}
              </p>
            </div>

            {/* The story — the same text the welcome page has always carried. */}
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

            {/* Presentation preview of the patient home screen. */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-sm font-semibold">{t("AMedix Home Screen")}</h3>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  {t("Presentation preview")}
                </span>
              </div>

              <div className="mt-2 rounded-2xl border border-border bg-background p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={AMEDIX_LOGO_URL}
                      alt=""
                      fittingType="fit"
                      originWidth={LOGO_WIDTH}
                      originHeight={LOGO_HEIGHT}
                      className="h-7 w-7"
                    />
                    <span className="font-heading text-sm font-semibold">AMedix</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                      DEMO-0000-0000
                    </span>
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      D
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("Quick access")}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {HOME_TILES.map((tile) => {
                    const Icon = tile.icon;
                    return (
                      <div
                        key={tile.label}
                        className="rounded-xl border border-border bg-card px-3 py-2.5"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <p className="mt-1.5 text-[11px] font-medium leading-snug">{t(tile.label)}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("Next appointment")}
                    </p>
                    <p className="mt-1 text-xs font-medium">{t("Cardiology clinic")} · 12/03 · 10:30</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("Recent activity")}
                    </p>
                    <p className="mt-1 text-xs font-medium">{t("Lab result released")}</p>
                    <p className="text-xs text-muted-foreground">{t("Prescription dispensed")}</p>
                  </div>
                </div>
              </div>
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