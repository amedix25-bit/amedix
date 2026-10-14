import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function usePrescriptionAvailability({ medicationName, strength, activeIngredient, refreshKey }) {
  const medication = String(medicationName || "").trim();
  const ingredient = String(activeIngredient || "").trim();
  const doseStrength = String(strength || "").trim();
  const enabled = Boolean(medication || ingredient);
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ["prescriptionAvailability", medication, doseStrength, ingredient, refreshKey],
    enabled,
    staleTime: 0,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await base44.functions.invoke("prescriptionAvailability", {
        medication_name: medication,
        strength: doseStrength,
        active_ingredient: ingredient,
      });
      const result = response.data;
      if (result?.error || !Array.isArray(result?.pharmacies)) {
        throw new Error(result?.error || "Availability could not be confirmed. Please refresh.");
      }
      return { pharmacies: result.pharmacies, substitutes: result.substitutes || [] };
    },
  });
  useEffect(() => {
    if (!enabled) return;
    return base44.entities.PharmacyInventory.subscribe(() => { void refetch(); });
  }, [enabled, medication, ingredient, doseStrength, refetch]);
  return {
    pharmacies: data?.pharmacies ?? null,
    substitutes: data?.substitutes || [],
    loading: isFetching,
    error: !enabled ? "A medication name or active ingredient is required."
      : error?.data?.error || error?.response?.data?.error || error?.message || "",
    check: () => refetch(),
  };
}