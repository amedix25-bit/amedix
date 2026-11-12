import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import AppLanguageSwitcher from "@/components/AppLanguageSwitcher";
import { useAppLanguage } from "@/lib/appLanguage";
import { PORTAL_OPTIONS } from "@/components/landing/portalOptions";
import PrimaryChoice from "@/components/landing/PrimaryChoice";
import PortalChoice from "@/components/landing/PortalChoice";
import PortalAuthForm from "@/components/landing/PortalAuthForm";

// Public entry. The home screen offers two choices only — patient and
// healthcare professional. Deep links (?portal=…&step=…) keep opening the
// existing portal login and registration flows unchanged.
export default function Landing() {
  const { t } = useAppLanguage();
  const navigate = useNavigate();
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
  const goBack = () => {
    localStorage.removeItem("amh_selected_role");
    setParams(step ? { portal: option.key } : {});
  };

  const selectPrimary = (choice) => {
    if (choice === "patient") choosePortal("patient");
    else navigate("/professional-access");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-9 w-9 rounded-xl" />
            <span className="text-lg font-normal [font-family:'Bungee',_system-ui]">AMedix</span>
          </div>
          <div className="flex items-center gap-3">
            {option && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t("Back")}
              </button>
            )}
            <AppLanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-14">
        <div className="w-full max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("Welcome to AMedix")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("Connected Care. Better Health.")}</p>

          {!option ? (
            <PrimaryChoice onSelect={selectPrimary} />
          ) : step ? (
            <PortalAuthForm portal={option.key} mode={step} onModeChange={changeStep} />
          ) : (
            <>
              <PortalChoice
                option={option}
                onLogin={() => changeStep("login")}
                onRegister={() => changeStep("register")}
                onBack={() => setParams({})}
              />
              {option.key === "patient" && (
                <Link
                  to="/patient-phone"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  {t("Sign in with your phone number only")}
                </Link>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {t("AMedix · Connected Care. Better Health.")}
      </footer>
    </div>
  );
}