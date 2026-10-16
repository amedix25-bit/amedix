import { base44 } from "@/api/base44Client";

// Portal login validation helpers. The credentials identify the user, the
// database determines their authorized roles (checked server-side in the
// checkPortalAccess backend function), and the selected login portal must
// match one of those roles before access is granted.

export const VALID_PORTALS = ["patient", "doctor", "radiologist", "lab", "hospital", "pharmacy"];

export const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Doctor",
  radiologist: "Radiologist",
  lab: "Laboratory",
  hospital: "Hospital",
  pharmacy: "Pharmacy",
  admin: "Administrator",
};

export const ROLE_LOGIN_LABELS = {
  patient: "Patient Login",
  doctor: "Doctor Login",
  radiologist: "Radiologist Login",
  lab: "Laboratory Login",
  hospital: "Hospital Login",
  pharmacy: "Pharmacy Login",
  admin: "Administrator Login",
};

export const PORTAL_DESTINATIONS = {
  patient: "/patient",
  doctor: "/doctor",
  radiologist: "/radiologist",
  lab: "/lab-portal",
  hospital: "/hospital-portal",
  pharmacy: "/pharmacy-portal",
  admin: "/admin",
};

// Asks the backend which portals the currently authenticated user is
// authorized for, and whether the selected portal matches one of them.
export async function validatePortalAccess(portal) {
  const res = await base44.functions.invoke("checkPortalAccess", { portal: portal || null });
  return res.data;
}

export function rejectionMessage(role, t) {
  if (!ROLE_LOGIN_LABELS[role]) return "";
  return t("Incorrect login. This account is registered as {role}. Please use the {roleLogin}.", {
    role: t(ROLE_LABELS[role]),
    roleLogin: t(ROLE_LOGIN_LABELS[role]),
  });
}

// Logs the user out and returns them to the login page they used, carrying the
// rejection reason so the page can show the message after the reload.
export function logoutWithRejection(role, basePath = "/login", extraParams = {}) {
  const params = new URLSearchParams(extraParams);
  params.set("rejected", role);
  base44.auth.logout(`${window.location.origin}${basePath}?${params.toString()}`);
}

// Decides what happens after a successful, backend-verified check:
// - no profile yet → the post-registration onboarding page
// - selected authorized portal → that portal, even with multiple roles
// - no selection, one role → that portal
// - no selection, multiple roles → the "Welcome back — Continue as" screen
export function routeAfterValidation(data, selectedPortal, { onSelection, onReject }) {
  const { roles, allowed } = data;
  if (!roles || roles.length === 0) {
    window.location.href = "/home";
    return;
  }
  if (selectedPortal) {
    if (!allowed || !roles.includes(selectedPortal)) {
      onReject(roles[0]);
      return;
    }
    localStorage.removeItem("amh_selected_role");
    window.location.href = PORTAL_DESTINATIONS[selectedPortal];
    return;
  }
  if (roles.length === 1) {
    localStorage.removeItem("amh_selected_role");
    window.location.href = PORTAL_DESTINATIONS[roles[0]];
    return;
  }
  onSelection({ full_name: data.full_name, roles });
}