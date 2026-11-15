import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import PatientNavItem from "@/components/patient/shell/PatientNavItem";

export default function PatientSidebarGroup({ group, activeKey, onClick }) {
  const { t } = usePatientLanguage();
  const [expanded, setExpanded] = useState(group.key === "record");
  const Icon = group.icon;
  return <div className="pp-nav-group">
    <button type="button" className="pp-nav-item pp-nav-group-trigger" aria-expanded={expanded} aria-controls={`pp-group-${group.key}`} onClick={() => setExpanded(!expanded)}><Icon /><span>{t(group.label)}</span><ChevronDown className={expanded ? "pp-chevron-open" : ""} /></button>
    {expanded && <div className="pp-nav-subitems" id={`pp-group-${group.key}`}>
      {group.items.map((item) => <PatientNavItem key={item.key} item={item} activeKey={activeKey} onClick={onClick} nested />)}
    </div>}
  </div>;
}