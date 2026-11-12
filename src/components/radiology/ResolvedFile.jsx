import React, { useEffect, useState } from "react";
import resolveRadiologyFile from "@/lib/radiologyFileUrl";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Resolves study file references (private storage URIs or legacy public URLs)
// to fetchable, access-checked URLs (Phase 9 protected file access).
export function useResolvedImages(images, requestId) {
  const [resolved, setResolved] = useState(
    (images || []).every((u) => /^https?:/i.test(u || "")) ? images || [] : null
  );
  const key = (images || []).join("|") + "|" + (requestId || "");
  useEffect(() => {
    let cancelled = false;
    if (!(images || []).length) {
      setResolved([]);
      return;
    }
    (async () => {
      const out = await Promise.all(
        (images || []).map((u) => resolveRadiologyFile(requestId, u).catch(() => ""))
      );
      if (!cancelled) setResolved(out);
    })();
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return resolved;
}

export function ResolvedFileButton({ requestId, fileRef, className, children }) {
  const [loading, setLoading] = useState(false);
  const open = async () => {
    if (loading) return;
    setLoading(true);
    // Opened inside the tap: a window opened after an await is blocked on iOS
    // Safari and Android Chrome, so the signed URL fills the already-open tab.
    const tab = window.open("", "_blank");
    try {
      const url = await resolveRadiologyFile(requestId, fileRef);
      if (!url) throw new Error("empty");
      if (tab) tab.location.href = url;
      else window.open(url, "_blank", "noopener");
    } catch (err) {
      if (tab) tab.close();
      // Never a blank screen: say what failed and leave the button ready to retry.
      toast({
        title: "This document could not be opened",
        description:
          err?.response?.data?.error ||
          "Your access could not be verified, or the file is temporarily unavailable. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <button className={className} onClick={open} disabled={loading || !fileRef}>
      {loading && <Loader2 className="w-3.5 h-3.5 mr-1 inline animate-spin" />}
      {children}
    </button>
  );
}