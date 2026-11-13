import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Save, ShieldCheck, UserRound, GraduationCap, Award, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import PhotoUploader from "./PhotoUploader";
import BasicProfileForm from "./BasicProfileForm";
import EducationSection from "./EducationSection";
import AchievementSection from "./AchievementSection";
import PrivacySettingsForm from "./PrivacySettingsForm";
import VerifiedQualifications from "./VerifiedQualifications";
import ShareProfileButton from "./ShareProfileButton";
import { PRIVACY_DEFAULTS } from "@/lib/professionalProfile";

const TABS = [
  { key: "profile", label: "Profile", icon: UserRound },
  { key: "education", label: "Education & Qualifications", icon: GraduationCap },
  { key: "achievements", label: "Achievements & Experience", icon: Award },
  { key: "privacy", label: "Privacy", icon: Lock },
];

const draftFrom = (record) => ({
  professional_title: record?.professional_title || "",
  workplace: record?.workplace || "",
  location: record?.location || "",
  bio: record?.bio || "",
  education: Array.isArray(record?.education) ? record.education : [],
  achievements: Array.isArray(record?.achievements) ? record.achievements : [],
  privacy: { ...PRIVACY_DEFAULTS, ...(record?.privacy || {}) },
});

// Doctor Portal → Professional Profile. The physician builds and manages the
// professional identity other physicians see: photograph, title, biography,
// education, achievements and who may see each part of it.
export default function ProfessionalProfileSection({ profile, onProfileUpdated }) {
  const { toast } = useToast();
  const [tab, setTab] = useState("profile");
  const [view, setView] = useState(null);
  const [draft, setDraft] = useState(draftFrom(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("doctorProfessionalProfile", { action: "get", doctor_id: profile.id });
      setView(res.data);
      setDraft(draftFrom(res.data));
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "The professional profile could not be loaded" });
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (overrides = {}, message) => {
    const next = { ...draft, ...overrides };
    setSaving(true);
    try {
      const res = await base44.functions.invoke("doctorProfessionalProfile", { action: "save", ...next });
      const record = res.data?.profile || null;
      if (record) {
        setDraft(draftFrom(record));
        setView((prev) => ({
          ...(prev || {}),
          professional_title: record.professional_title || "",
          workplace: record.workplace || "",
          location: record.location || "",
          bio: record.bio || "",
          education: record.education || [],
          achievements: record.achievements || [],
          privacy: record.privacy,
          has_profile: true,
        }));
      }
      if (message) toast({ title: message });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Your changes could not be saved" });
    } finally {
      setSaving(false);
    }
  };

  const updateBasic = (patch) => setDraft((current) => ({ ...current, ...patch }));

  const saveEntry = (kind, entry) =>
    persist({
      [kind]: (draft[kind] || []).some((item) => item.entry_id === entry.entry_id)
        ? draft[kind].map((item) => (item.entry_id === entry.entry_id ? entry : item))
        : [...(draft[kind] || []), entry],
    }, kind === "education" ? "Qualification saved" : "Entry saved");

  const removeEntry = (kind, entryId) => {
    if (!window.confirm("Remove this entry from your professional profile?")) return;
    persist({ [kind]: (draft[kind] || []).filter((item) => item.entry_id !== entryId) }, "Entry removed");
  };

  const visibilityLabel = useMemo(
    () => (draft.privacy.visibility === "connections" ? "Only my connections" : "All verified physicians"),
    [draft.privacy.visibility]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header — photograph, identity, share and save */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PhotoUploader
            profile={profile}
            onUploaded={(updated) => onProfileUpdated?.(updated)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <ShareProfileButton doctorId={profile.id} name={profile.full_name} />
            <Button size="sm" onClick={() => persist({}, "Professional profile saved")} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save changes
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border" role="tablist">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className={`relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "text-doctor-blue" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <span
                    className={`absolute inset-x-1 -bottom-px h-0.5 rounded-full ${active ? "bg-doctor-blue" : "bg-transparent"}`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            {tab === "profile" && (
              <BasicProfileForm
                name={profile.full_name}
                specialty={profile.specialization}
                verified={view?.verified}
                draft={draft}
                onChange={updateBasic}
              />
            )}
            {tab === "education" && (
              <EducationSection
                entries={draft.education}
                onSaveEntry={(entry) => saveEntry("education", entry)}
                onRemoveEntry={(entryId) => removeEntry("education", entryId)}
                busy={saving}
              />
            )}
            {tab === "achievements" && (
              <AchievementSection
                entries={draft.achievements}
                onSaveEntry={(entry) => saveEntry("achievements", entry)}
                onRemoveEntry={(entryId) => removeEntry("achievements", entryId)}
                busy={saving}
              />
            )}
            {tab === "privacy" && (
              <div className="space-y-4">
                <PrivacySettingsForm
                  privacy={draft.privacy}
                  onChange={(patch) => updateBasic({ privacy: { ...draft.privacy, ...patch } })}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => persist({}, "Privacy settings saved")} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    Save privacy settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <VerifiedQualifications verified={view?.verified} />
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Lock className="h-4 w-4 text-primary" /> Profile visibility
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{visibilityLabel}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {Object.entries(draft.privacy).filter(([key, value]) => key.startsWith("show_") && value === false).length}{" "}
              detail(s) hidden from other physicians.
            </p>
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setTab("privacy")}>
              Manage privacy
            </Button>
          </div>
          <p className="rounded-2xl bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
            Professional connections are separate from patient care. A colleague never gains access to your
            patients&rsquo; records, notes or prescriptions through this profile.
          </p>
        </aside>
      </div>
    </div>
  );
}