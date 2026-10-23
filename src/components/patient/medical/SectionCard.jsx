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
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="group min-w-0 flex-1 flex items-center gap-3 text-left rtl:text-right"
          aria-expanded={open}
        >
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold shrink-0 shadow-sm">
            {number}
          </span>
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate">
            {title}
          </h3>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {action}
      </div>
      {edited && (
        <p className="text-xs text-muted-foreground px-5 pb-3 -mt-1">
          {t("Dr.")} {edited.actor_name} {t("edited")} {editedWhen}
        </p>
      )}
      {open && <div className="px-5 pb-5 pt-1 border-t border-border/60">{children ? <div className="pt-4">{children}</div> : children}</div>}
    </div>
  );
}