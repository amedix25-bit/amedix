import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Collapsible "drop box" card for the numbered My Health sections. Collapsed by
// default; clicking the title (or the chevron) expands the content. When
// patient + sectionKey are given, the card shows who last edited the section
// ("Dr. <name> edited <datetime>") from the HealthSectionEdit log.
export default function SectionCard({
  number,
  title,
  action,
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  patient,
  sectionKey,
  editLogRefresh = 0,
}) {
  const { t, isArabic } = usePatientLanguage();
  const [openState, setOpenState] = useState(defaultOpen);
  const [edited, setEdited] = useState(null);
  const open = openProp !== undefined ? openProp : openState;

  const setOpen = (value) => {
    if (onOpenChange) onOpenChange(value);
    else setOpenState(value);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!patient?.id || !sectionKey) return;
      try {
        const data = await base44.entities.HealthSectionEdit.filter(
          { patient_id: patient.id, section: sectionKey },
          "-datetime",
          1
        );
        if (active) setEdited(data[0] || null);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [patient?.id, sectionKey, editLogRefresh]);

  const editedWhen = edited?.datetime
    ? new Date(edited.datetime).toLocaleString(isArabic ? "ar" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 p-5 pb-0">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="min-w-0 flex-1 text-left rtl:text-right"
          aria-expanded={open}
        >
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
              {number}
            </span>
            <span className="truncate">{title}</span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </h3>
        </button>
        {action}
      </div>
      {edited && (
        <p className="text-xs text-muted-foreground px-5 mt-1">
          {t("Dr.")} {edited.actor_name} {t("edited")} {editedWhen}
        </p>
      )}
      {open && <div className="p-5 pt-4">{children}</div>}
    </div>
  );
}