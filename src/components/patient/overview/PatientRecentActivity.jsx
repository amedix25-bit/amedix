import React from "react";
import { Clock, Image as ImageIcon, FlaskConical, Pill } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Recent Activity is deliberately limited to new clinical items. Appointments,
// messages, reminders and recalls are not listed here, and nothing about the
// author, the facility or the time is shown — those details live on the tab itself.
const KINDS = {
  radiology_request: { label: "New radiology request", Icon: ImageIcon, tone: "pp-icon-purple", target: "imaging" },
  radiology_report: { label: "New radiology report", Icon: ImageIcon, tone: "pp-icon-purple", target: "imaging" },
  prescription: { label: "New prescription", Icon: Pill, tone: "pp-icon-purple", target: "prescriptions" },
  lab_request: { label: "New lab request", Icon: FlaskConical, tone: "pp-icon-green", target: "labs" },
  lab_report: { label: "New lab report", Icon: FlaskConical, tone: "pp-icon-green", target: "mylabresults" },
};

function kindOf(item) {
  const type = String(item?.type || "");
  const target = String(item?.target || "");
  const title = String(item?.title || "").toLowerCase();

  if (type === "lab_results" || /lab(?:oratory)? (?:results?|report)/.test(title)) return "lab_report";
  if (type === "lab_request" || /lab(?:oratory)? request/.test(title)) return "lab_request";
  if (["imaging_critical", "critical_finding", "imaging_results"].includes(type) || /(radiology|imaging) (report|result)/.test(title)) {
    return "radiology_report";
  }
  if (type === "imaging" || /(radiology|imaging) request/.test(title)) return "radiology_request";
  if (type === "medication_update" || target === "prescriptions" || /prescription/.test(title)) return "prescription";
  return null;
}

export default function PatientRecentActivity({ items, onNavigate, onViewAll }) {
  const { t } = usePatientLanguage();
  const entries = (items || [])
    .map((item) => ({ item, kind: kindOf(item) }))
    .filter((entry) => entry.kind)
    .slice(0, 4);

  return <section className="pp-panel pp-activity">
    <div className="pp-activity-header"><h2 className="pp-panel-heading"><Clock />{t("Recent Activity")}</h2><button type="button" className="pp-view-all" onClick={onViewAll}>{t("View All")}</button></div>
    {!entries.length ? <p className="pp-empty">{t("No recent activity")}</p> : <ul className="pp-activity-list">{entries.map(({ item, kind }) => {
      const { label, Icon, tone, target } = KINDS[kind];
      return <li key={item.id}><button type="button" className={`pp-activity-item ${tone}`} onClick={() => onNavigate?.(target)}>
        <span className="pp-timeline-dot" /><span className="pp-timeline-icon"><Icon /></span>
        <span className="pp-activity-copy"><strong>{t(label)}</strong></span>
      </button></li>;
    })}</ul>}
  </section>;
}