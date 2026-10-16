import React from "react";
import { ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppLanguage } from "@/lib/appLanguage";

export default function PortalChoice({ option, onLogin, onRegister, onBack }) {
  const { t } = useAppLanguage();
  const Icon = option.icon;
  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="rounded-2xl border border-border bg-card p-8 text-left rtl:text-right">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><Icon className="w-7 h-7 text-primary" /></div>
        <h2 className="text-2xl font-bold">{t(option.title)}</h2>
        <p className="text-sm text-muted-foreground mt-2">{t(option.description)}</p>
        <div className="flex flex-col gap-3 mt-6">
          <Button size="lg" variant="outline" onClick={onLogin}><LogIn className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />{t("Log In")}</Button>
          <Button size="lg" onClick={onRegister}>{t("Create Account")}</Button>
        </div>
      </div>
      <button type="button" onClick={onBack} className="mt-6 mx-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />{t("I am neither — choose again")}
      </button>
    </div>
  );
}