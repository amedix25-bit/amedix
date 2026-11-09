// Portal identifying accents — one shared AMedix design system, with a small
// colour signature per portal (nav indicator, selected tabs, icons). Never
// used for whole-page theming.
export const PORTAL_ACCENTS = {
  patient: {
    activeNav: "bg-portal-patient text-white shadow-sm",
    heading: "text-portal-patient",
    icon: "text-portal-patient",
  },
  doctor: {
    activeNav: "bg-doctor-blue text-white shadow-sm",
    heading: "text-doctor-blue",
    icon: "text-portal-doctor",
  },
  lab: {
    activeNav: "bg-portal-lab text-white shadow-sm",
    heading: "text-portal-lab",
    icon: "text-portal-lab",
  },
  radiology: {
    activeNav: "bg-portal-radiology text-white shadow-sm",
    heading: "text-portal-radiology",
    icon: "text-portal-radiology",
  },
  pharmacy: {
    activeNav: "bg-portal-pharmacy text-white shadow-sm",
    heading: "text-portal-pharmacy",
    icon: "text-portal-pharmacy",
  },
  hospital: {
    activeNav: "bg-portal-hospital text-white shadow-sm",
    heading: "text-portal-hospital",
    icon: "text-portal-hospital",
  },
  insurance: {
    activeNav: "bg-portal-insurance text-white shadow-sm",
    heading: "text-portal-insurance",
    icon: "text-portal-insurance",
  },
};

export function getPortalAccent(accent) {
  return PORTAL_ACCENTS[accent] || PORTAL_ACCENTS.patient;
}