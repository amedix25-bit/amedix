import React from "react";
import { Check } from "lucide-react";
import { Image } from "@/components/ui/image";
import { AMEDIX_LOGO_URL } from "@/components/BrandLogo";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, embedded = false, children }) {
  const { t } = useAppLanguage();

  // Embedded mode renders only the form card — the host page (e.g. the role
  // selection page) already provides the branding, header and language switch.
  if (embedded) {
    return (
      <div className="w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer &&
        <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        }
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white overflow-hidden shrink-0">
              <Image src={AMEDIX_LOGO_URL} alt="AMedix logo" fittingType="fill" className="w-full h-full" />
            </div>
            <span className="font-bold tracking-tight text-5xl [font-family:'Crave_Fine',_sans-serif]">AMedix</span>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight">
                {t("Connected Care.")}<br />{t("Better Health.")}
              </h2>
              <p className="text-white/80 mt-4 text-lg max-w-md">
                {t("A secure healthcare platform connecting doctors and patients in one unified, confidential system.")}
              </p>
            </div>

            <div className="space-y-4">
              {[
              t("Unique Clinical Identification Number (CIN) for every patient"),
              t("You own your medical records — doctors access them only with your consent"),
              t("Manage appointments, lab results, imaging, and documents in one place")].
              map((feature, i) =>
              <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-white/80 text-sm">{feature}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-white/50 text-sm">{t("© 2026 AMedix. All rights reserved.")}</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-8 bg-background">
        <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto z-10">
          <AppLanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full bg-white overflow-hidden">
              <Image src={AMEDIX_LOGO_URL} alt="AMedix logo" fittingType="fill" className="w-full h-full" />
            </div>
            <span className="text-2xl font-bold text-foreground">AMedix</span>
          </div>
          <p className="lg:hidden text-center text-sm text-muted-foreground mb-8">
            {t("Connected Care. Better Health.")}
          </p>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            {children}
          </div>

          {footer &&
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
          }
        </div>
      </div>
    </div>);

}