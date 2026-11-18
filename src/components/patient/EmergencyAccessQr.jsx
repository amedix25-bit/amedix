import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldAlert } from "lucide-react";

// The patient's Emergency QR, issued and signed by the server. It identifies
// the patient to an eligible emergency doctor — it never carries a diagnosis,
// never authorizes access on its own, and can be revoked server-side.
export default function EmergencyAccessQr({ size = 100 }) {
  const [token, setToken] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("emergencyAccess", { action: "issue_patient_qr" });
        if (mounted) setToken(res.data?.token || "");
      } catch (e) {
        if (mounted) setFailed(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (failed) {
    return <p className="text-[10px] text-muted-foreground text-center max-w-[110px]">Emergency QR unavailable</p>;
  }

  if (!token) {
    return (
      <div style={{ width: size, height: size }} className="flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=2&data=${encodeURIComponent(token)}`;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="rounded-lg border border-border bg-white p-1.5">
        <img src={src} alt="Emergency access QR code" width={size} height={size} className="rounded" />
      </div>
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700">
        <ShieldAlert className="w-3 h-3" /> Emergency
      </span>
    </div>
  );
}