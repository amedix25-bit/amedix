export const LAB_STATUS = {
  requested: {
    label: "REQUESTED",
    description: "Awaiting your laboratory selection",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  authorized: {
    label: "AUTHORIZED / SENT TO LABORATORY",
    description: "Authorized by you and sent to the laboratory",
    className: "bg-teal-50 text-teal-700 border-teal-200",
  },
  pending: {
    label: "PENDING",
    description: "Received by the laboratory — awaiting results",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  results: {
    label: "RESULTS AVAILABLE",
    description: "Results are available",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export function normalizeLabStatus(status) {
  if (status === "completed") return "results";
  return LAB_STATUS[status] ? status : "requested";
}

export function getTests(lab) {
  if (Array.isArray(lab.tests) && lab.tests.length > 0) return lab.tests;
  if (lab.test_name) return [{ name: lab.test_name, category: lab.category, panel: null }];
  return [];
}

export function groupTestsByCategory(tests) {
  const map = new Map();
  (tests || []).forEach((t) => {
    const key = t.category || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t.name);
  });
  return [...map.entries()];
}