import React, { useEffect, useState } from "react";
import resolveRadiologyFile from "@/lib/radiologyFileUrl";
import { Loader2 } from "lucide-react";

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
    try {
      const url = await resolveRadiologyFile(requestId, fileRef);
      if (url) window.open(url, "_blank", "noopener");
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