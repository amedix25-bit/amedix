import React from "react";
import { useAppLanguage } from "@/lib/appLanguage";
import { cn } from "@/lib/utils";

// The "English | العربية" pill used in top navigation across the platform.
// Switching is instant — no reload, no navigation, nothing is lost.
export default function AppLanguageSwitcher({ className }) {
  const { lang, setLang } = useAppLanguage();

  const option = (code, label) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      className={cn(
        "px-3 py-1 rounded-full transition-colors",
        lang === code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs font-medium",
        className
      )}
    >
      {option("en", "English")}
      <span className="text-muted-foreground select-none">|</span>
      {option("ar", "العربية")}
    </div>
  );
}