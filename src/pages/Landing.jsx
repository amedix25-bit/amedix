import React from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";
import { PORTAL_OPTIONS } from "@/components/landing/portalOptions";
import PortalOptions from "@/components/landing/PortalOptions";
import PortalFeatures from "@/components/landing/PortalFeatures";
import PortalChoice from "@/components/landing/PortalChoice";
import PortalAuthForm from "@/components/landing/PortalAuthForm";

export default function Landing() {
  const { t } = useAppLanguage();
  const [params, setParams] = useSearchParams();
  const option = PORTAL_OPTIONS.find((item) => item.key === params.get("portal"));
  const step = option && ["login", "register"].includes(params.get("step")) ? params.get("step") : null;
  const choosePortal = (portal) => {
    localStorage.removeItem("amh_selected_role");
    setParams({ portal });
  };
  const changeStep = (next) => {
    if (next === "register" && ["patient", "doctor"].includes(option.key)) localStorage.setItem("amh_selected_role", option.key);
    else localStorage.removeItem("amh_selected_role");
    setParams({ portal: option.key, step: next });
  };
  const goBack = () => setParams(step ? { portal: option.key } : {});
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/90 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><BrandLogo className="w-9 h-9 rounded-xl" /><span className="text-lg font-normal [font-family:'Bungee',_system-ui]">AMedix</span></div>
          <div className="flex items-center gap-3">
            {option && <button type="button" onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4 rtl:rotate-180" />{t("Back")}</button>}
            <AppLanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6"><ShieldCheck className="w-3.5 h-3.5" />{t("Secure, patient-owned clinical records")}</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{t("Welcome to AMedix")}</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">{t("Your medical information, securely connected to your healthcare.")}</p>
          {!option ? <><PortalOptions options={PORTAL_OPTIONS} onContinue={choosePortal} /><PortalFeatures /></> : step ? <PortalAuthForm portal={option.key} mode={step} /> : <PortalChoice option={option} onLogin={() => changeStep("login")} onRegister={() => changeStep("register")} onBack={() => setParams({})} />}
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">{t("AMedix · Connected Care. Better Health.")}</footer>
    </div>
  );
}