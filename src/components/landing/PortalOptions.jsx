import React from "react";
import { ArrowRight } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

export default function PortalOptions({ options, onContinue }) {
  const { t } = useAppLanguage();
  return (
    <>
      <p className="text-sm text-muted-foreground mt-6 font-medium">{t("Choose how you use the platform")}</p>
      <div className="grid sm:grid-cols-2 gap-6 mt-8">
        {options.map(({ key, icon: Icon, title, summary }) => (
          <button key={key} type="button" onClick={() => onContinue(key)} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-left rtl:text-right transition-all hover:shadow-lg hover:border-primary/30">
            <div className="absolute top-0 right-0 rtl:right-auto rtl:left-0 w-32 h-32 bg-accent rounded-bl-full rtl:rounded-bl-none rtl:rounded-br-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><Icon className="w-7 h-7 text-primary" /></div>
              <h3 className="text-xl font-bold">{t(title)}</h3>
              <p className="text-muted-foreground text-sm mt-2">{t(summary)}</p>
              <div className="flex items-center gap-2 mt-6 text-primary font-medium text-sm">
                {t("Continue")}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}