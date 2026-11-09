import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Database, Loader2, ShieldCheck, Upload } from "lucide-react";
import { coverageTone } from "@/lib/icd11Local";

// ICD-11 classification database — the local dataset the diagnosis fields code against.
//
// Clinical coding reads this workspace's own ICD-11 entries, so no WHO API
// subscription, key or network call is involved in documenting a diagnosis. The
// dataset is loaded once by an administrator, either from the bundled AMedix
// verified catalogue or from an official WHO ICD-11 release export, and the
// release, its licence reference and its import validation are kept with it so
// every stored code stays traceable to the classification it came from.
const SOURCE_LABEL = {
  verified_catalogue: "Bundled AMedix verified catalogue",
  who_export: "Official WHO ICD-11 release export",
  who_api_export: "Export produced from the WHO ICD-11 API under the institution's subscription",
};

export default function Icd11DatasetPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [result, setResult] = useState(null);
  const [releaseId, setReleaseId] = useState("");
  const [licence, setLicence] = useState("");
  const [progress, setProgress] = useState("");

  const loadStatus = async () => {
    setError("");
    try {
      const res = await base44.functions.invoke("icd11LocalSearch", { mode: "status" });
      setStatus(res.data || null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "The ICD-11 database status could not be read.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setIsAdmin(me?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
      loadStatus();
    })();
  }, []);

  const record = (res) => {
    setResult(res.data || null);
    setError(res.data?.error || "");
    loadStatus();
  };

  const loadBundled = async () => {
    setBusy("seed");
    setResult(null);
    try {
      record(await base44.functions.invoke("icd11LocalImport", { mode: "seed" }));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "The bundled catalogue could not be loaded.");
    } finally {
      setBusy("");
    }
  };

  // A full WHO MMS export runs to many thousands of entries, far more than one call
  // can carry, so the file is sent in parts: the first part creates the release and
  // the rest are appended to it. Re-sending a file is harmless — entries already
  // stored are skipped.
  const ENTRIES_PER_PART = 3000;

  const entriesOf = (payload) =>
    Array.isArray(payload)
      ? payload
      : payload?.entries ||
        payload?.concepts ||
        payload?.terms ||
        payload?.items ||
        payload?.destinationEntities ||
        payload?.["@graph"] ||
        null;

  const importExport = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    setError("");
    setResult(null);
    if (!/^\d{4}-\d{2}$/.test(releaseId.trim()) || !licence.trim()) {
      setError("Enter the WHO release identifier (e.g. 2026-01) and the institution's licence reference before choosing the export file.");
      return;
    }

    setBusy("import");
    const release = releaseId.trim();
    const continuesExisting = status?.release?.release_id === release && status.release.source_type !== "verified_catalogue";
    let firstPart = !continuesExisting;
    let imported = 0;
    let rejected = 0;
    let skipped = 0;

    try {
      for (const file of files) {
        const text = await file.text();
        let payload;
        try {
          payload = JSON.parse(text);
        } catch {
          setError(`${file.name} is not valid JSON. Import the official WHO export as JSON.`);
          break;
        }
        const entries = entriesOf(payload);
        if (!Array.isArray(entries)) {
          setError(`${file.name} does not contain a JSON array of entries.`);
          break;
        }

        const parts = [];
        for (let i = 0; i < entries.length; i += ENTRIES_PER_PART) parts.push(entries.slice(i, i + ENTRIES_PER_PART));

        for (let p = 0; p < parts.length; p += 1) {
          setProgress(`${file.name} — part ${p + 1} of ${parts.length}`);
          const res = await base44.functions.invoke("icd11LocalImport", {
            mode: firstPart ? "import" : "append",
            release_id: release,
            licence_reference: licence.trim(),
            entries: parts[p],
          });
          const data = res.data || {};
          imported += data.imported ?? data.appended ?? 0;
          rejected += (data.rejected || []).length;
          skipped += data.skipped_already_present || 0;
          firstPart = false;
        }
      }
      setResult({ release, accepted: imported, rejected, duplicates: skipped });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "The release could not be imported.");
    } finally {
      setProgress("");
      setBusy("");
      loadStatus();
    }
  };

  const release = status?.release || null;
  const coverage = status?.coverage || null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-heading font-semibold flex items-center gap-1.5">
            <Database className="w-4 h-4 text-primary" /> ICD-11 classification database (local)
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
            Diagnoses are coded against classification entries stored in this workspace. No WHO API subscription or
            credential is needed to document a diagnosis, and a code is only ever offered when the dataset holds it.
          </p>
        </div>
        {!loading && (
          <Badge variant={release ? "secondary" : "outline"} className="text-[10px] shrink-0">
            {release ? `Release ${release.release_id}` : "No release loaded"}
          </Badge>
        )}
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading the classification database…
        </p>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>{error}</span>
        </p>
      )}

      {release && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div>
            <p className="text-muted-foreground">Source</p>
            <p className="font-medium">{SOURCE_LABEL[release.source_type] || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Licence reference</p>
            <p className="font-medium">{release.licence_reference || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Entries / codable</p>
            <p className="font-medium">
              {release.term_count} / {release.codable_count}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Official WHO Arabic terms</p>
            <p className="font-medium">{release.arabic_official_count}</p>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <p className="text-muted-foreground">
              Imported {release.imported_datetime ? String(release.imported_datetime).slice(0, 16).replace("T", " ") : "—"}
              {release.imported_by_name ? ` by ${release.imported_by_name}` : ""}
            </p>
          </div>
        </div>
      )}

      {coverage && (
        <div className="rounded border border-border bg-muted/40 p-2.5">
          <p className="text-[11px] font-medium">
            Respiratory scope coverage: {coverage.mapped} of {coverage.total} target conditions coded
          </p>
          <div className="mt-1 space-y-0.5">
            {coverage.rows.map((row) => (
              <p key={row.key} className={`text-[11px] ${coverageTone(row.status)}`}>
                {row.status === "mapped" ? "✓" : "•"} {row.label}
                {row.status === "mapped" ? ` — ${row.code} ${row.title_en}` : " — not in the loaded dataset"}
              </p>
            ))}
          </div>
          {coverage.missing?.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              An unlisted condition is recorded exactly as documented and flagged for coding review; no nearby code is
              substituted. Importing a full official release extends coverage.
            </p>
          )}
        </div>
      )}

      {result && !error && (
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            {result.already_loaded
              ? `Release ${result.release} is already in the database.`
              : `Release ${result.release} accepted: ${result.accepted} entries, ${result.rejected || 0} rejected, ${result.duplicates || 0} duplicates.`}
            {result.superseded?.length ? ` Superseded: ${result.superseded.join(", ")}.` : ""}
          </span>
        </p>
      )}

      {isAdmin && (
        <div className="rounded border border-border p-2.5 space-y-2">
          <p className="text-[11px] font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Administrator only
          </p>
          {!release && (
            <Button size="sm" variant="outline" onClick={loadBundled} disabled={busy !== ""}>
              {busy === "seed" ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
              Load the bundled verified catalogue
            </Button>
          )}
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <Label htmlFor="icd-release" className="text-[11px]">
                WHO release identifier
              </Label>
              <Input
                id="icd-release"
                className="h-8 text-xs mt-1"
                placeholder="2026-01"
                value={releaseId}
                onChange={(e) => setReleaseId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="icd-licence" className="text-[11px]">
                Institution licence / subscription reference
              </Label>
              <Input
                id="icd-licence"
                className="h-8 text-xs mt-1"
                placeholder="Recorded so the classification provenance is auditable"
                value={licence}
                onChange={(e) => setLicence(e.target.value)}
              />
            </div>
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-primary cursor-pointer">
            {busy === "import" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Import an official release export (JSON — a large export is sent in parts automatically)
            <input
              type="file"
              accept="application/json,.json"
              multiple
              className="hidden"
              disabled={busy !== ""}
              onChange={(e) => {
                importExport(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          {progress && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Importing {progress}…
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Uploading the same export again is safe: entries already stored are skipped, never duplicated.
          </p>
          <p className="text-[10px] text-muted-foreground">
            A release is never overwritten. Every import is validated and its rejected entries are named with the
            reason; a later release supersedes the current one while the codes already recorded keep their provenance.
          </p>
        </div>
      )}
    </div>
  );
}