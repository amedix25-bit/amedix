import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { loadRequestLogo } from "@/lib/requestPdfLayout";
import { saveNotePdf } from "@/lib/clinicalNotePdfStore";

// Saves the official document for every clinical note already in the system,
// so no note is left without its PDF. Runs in the browser, a batch at a time.
export default function AdminNotePdfs() {
  const [stats, setStats] = useState(null);
  const [saved, setSaved] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await base44.functions.invoke("clinicalNotePdf", { action: "count" });
    setStats(res.data);
  };

  useEffect(() => {
    load().catch((err) => setError(err?.response?.data?.error || err.message));
  }, []);

  const run = async () => {
    setRunning(true);
    setError("");
    setSaved(0);
    try {
      const logo = await loadRequestLogo();
      let cursor = null;
      let count = 0;
      for (;;) {
        const res = await base44.functions.invoke("clinicalNotePdf", { action: "pending", cursor });
        const notes = res.data?.notes || [];
        for (const note of notes) {
          await saveNotePdf(note, { logo });
          count += 1;
          setSaved(count);
        }
        if (!res.data?.has_more || !res.data?.next_cursor) break;
        cursor = res.data.next_cursor;
      }
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
      await load().catch(() => {});
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold">Clinical note documents</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Every clinical note keeps its own official AMedix document. Save one for each of the
            notes already in the system, including notes written before documents were saved.
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-lg font-bold">{stats.notes}</p>
            <p className="text-xs text-muted-foreground">Clinical notes</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-lg font-bold">{stats.saved}</p>
            <p className="text-xs text-muted-foreground">Documents saved</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-lg font-bold">{stats.remaining}</p>
            <p className="text-xs text-muted-foreground">Still to save</p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={running || (stats && stats.remaining === 0)}>
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {running ? "Saving documents..." : "Save PDFs for existing notes"}
        </Button>
        {running && <span className="text-sm text-muted-foreground">{saved} saved in this run</span>}
        {!running && stats && stats.remaining === 0 && stats.notes > 0 && (
          <span className="text-sm text-muted-foreground">Every note already has its document.</span>
        )}
      </div>
    </div>
  );
}