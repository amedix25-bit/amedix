import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import resolveClinicalFile from "@/lib/clinicalFileUrl";

// Access-checked clinical file UI: resolves a stored (private) file
// reference to a short-lived signed URL through the backend, and only
// opens/downloads after the server authorizes the caller.

// Resolves on mount — for previews/thumbnails.
export function useResolvedFileUrl(kind, id, fileRef) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (!kind || !id || !fileRef) return undefined;
    resolveClinicalFile(kind, id, fileRef)
      .then((u) => { if (!cancelled) setUrl(u || null); })
      .catch(() => { if (!cancelled) setUrl(null); });
    return () => { cancelled = true; };
  }, [kind, id, fileRef]); // eslint-disable-line react-hooks/exhaustive-deps
  return url;
}

// Click-to-open button (mirrors ResolvedFileButton).
export function ClinicalFileButton({ kind, id, fileRef, className, children, onClick }) {
  const [loading, setLoading] = useState(false);
  const open = async (e) => {
    if (loading || !fileRef) return;
    if (onClick) { onClick(e); }
    setLoading(true);
    try {
      const url = await resolveClinicalFile(kind, id, fileRef);
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