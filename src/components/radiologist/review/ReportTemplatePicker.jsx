import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { BookmarkPlus, Building2, User as UserIcon, Loader2, FilePlus2 } from "lucide-react";

// Report templates (Phase 5.1) — institution-approved templates shared with
// every radiologist, plus the radiologist's own personal templates. The best
// match for the study's modality/examination is auto-suggested; applying a
// template never silently replaces text the radiologist already entered.
export default function ReportTemplatePicker({ study, user, onApply, onSavePersonal, disabled }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [personalName, setPersonalName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.entities.RadiologyReportTemplate.filter({}, { limit: 100 });
        if (!cancelled) setTemplates(res.items || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setTemplates([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const bestMatch = useMemo(() => {
    if (!templates || !templates.length) return null;
    const label = `${study.scan_type || ""} ${study.examination || ""}`.toLowerCase();
    let best = null;
    let bestScore = 0;
    for (const t of templates) {
      const tpl = `${t.modality || ""} ${t.examination || ""} ${t.name || ""}`.toLowerCase();
      let score = 0;
      if (label.includes(String(t.modality || "").toLowerCase()) && t.modality && t.modality !== "Any") score += 2;
      if (t.examination && label.includes(String(t.examination).toLowerCase())) score += 3;
      for (const token of label.split(/\s+/)) {
        if (token && tpl.includes(token)) score += 1;
      }
      if (score > bestScore) { bestScore = score; best = t; }
    }
    return bestScore >= 3 ? best : null;
  }, [templates, study]);

  useEffect(() => {
    if (bestMatch && !selectedId) setSelectedId(bestMatch.id);
  }, [bestMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = () => {
    const tpl = (templates || []).find((t) => t.id === selectedId);
    if (!tpl) return;
    onApply(tpl);
  };

  const savePersonal = async () => {
    const name = personalName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await onSavePersonal(name);
      setPersonalName("");
      const res = await base44.entities.RadiologyReportTemplate.filter({}, { limit: 100 });
      setTemplates(res.items || []);
      toast({ title: "Personal template saved" });
    } catch (err) {
      toast({ title: "Could not save the template", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedId} onValueChange={setSelectedId} disabled={disabled || templates === null}>
          <SelectTrigger className="h-8 w-auto min-w-[240px] flex-1 text-xs">
            <SelectValue placeholder={templates === null ? "Loading templates..." : "Choose a report template"} />
          </SelectTrigger>
          <SelectContent>
            {(templates || []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.institution_approved ? "Institution · " : "Personal · "}{t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8 text-xs" onClick={apply} disabled={disabled || !selectedId}>
          <FilePlus2 className="w-3.5 h-3.5 mr-1" /> Use Template
        </Button>
      </div>
      {bestMatch && bestMatch.id === selectedId && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          {bestMatch.institution_approved ? <Building2 className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
          Suggested for {study.scan_type} — {study.examination}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={personalName}
          onChange={(e) => setPersonalName(e.target.value)}
          placeholder="Save the current draft as a personal template..."
          className="h-8 text-xs"
          disabled={disabled}
        />
        <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={savePersonal}
          disabled={disabled || saving || !personalName.trim()}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
          Save
        </Button>
      </div>
    </div>
  );
}