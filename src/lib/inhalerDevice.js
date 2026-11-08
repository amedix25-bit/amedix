// Inhaler device vocabulary shared by the prescribing form, the pharmacy
// dispense view and the patient's own prescription list. The device is a
// structured choice recorded beside the medication — the prescription itself is
// never duplicated, amended or replaced by it.
export const INHALER_DEVICES = [
  { value: "mdi", label: "Metered-dose inhaler (MDI)" },
  { value: "dpi", label: "Dry-powder inhaler (DPI)" },
  { value: "soft_mist", label: "Soft-mist inhaler" },
  { value: "nebulizer", label: "Nebulizer" },
  { value: "other", label: "Other" },
  { value: "not_applicable", label: "Not applicable" },
];

export const TECHNIQUE_COUNSELLING = [
  { value: "counselled", label: "Counselling given" },
  { value: "declined", label: "Patient declined" },
  { value: "not_applicable", label: "Not applicable" },
];

export const inhalerDeviceLabel = (value) =>
  INHALER_DEVICES.find((d) => d.value === value)?.label || "";

export const techniqueCounsellingLabel = (value) =>
  TECHNIQUE_COUNSELLING.find((d) => d.value === value)?.label || "";

// One readable line for the device, or "" when the prescriber recorded none —
// an unrecorded device is shown as absent, never assumed from the drug name.
export const inhalerSummary = (prescription) => {
  const device = inhalerDeviceLabel(prescription?.inhaler_device);
  if (!device) return "";
  const detail = (prescription?.inhaler_device_detail || "").trim();
  const counselling = techniqueCounsellingLabel(prescription?.technique_counselling);
  return [detail ? `${device} — ${detail}` : device, counselling].filter(Boolean).join(" · ");
};