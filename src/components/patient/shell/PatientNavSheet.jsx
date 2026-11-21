import React from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { usePatientLanguage } from "@/lib/patientLanguage";

// A clean slide-up submenu opened from the phone navigation bar.
export default function PatientNavSheet({ open, onOpenChange, title, items, onSelect }) {
  const { t } = usePatientLanguage();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="pp-sheet rounded-t-3xl border-0 bg-card px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-2.5"
      >
        <div className="pp-sheet-grip" aria-hidden="true" />
        <SheetTitle className="pp-sheet-title">{t(title)}</SheetTitle>
        <div className="pp-sheet-list">
          {items.map((item) => {
            const Icon = item.icon || (item.key === "logout" ? LogOut : ChevronRight);
            const danger = item.key === "logout";
            return (
              <button
                key={item.label}
                type="button"
                className={`pp-sheet-item ${danger ? "is-danger" : ""}`}
                onClick={() => onSelect(item.key)}
              >
                <Icon aria-hidden="true" />
                <span>{t(item.label)}</span>
                {!danger && <ChevronRight aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}