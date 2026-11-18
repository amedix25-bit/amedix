import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus } from "lucide-react";
import FamilyHistoryCards from "./FamilyHistoryCards";
import FamilyMemberDialog from "./FamilyMemberDialog";
import { groupFamilyHistory, groupToMember, memberKeyOf } from "@/lib/familyHistory";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Family history editor: the saved family members as cards, "+ Add New Member"
// to record another relative, and edit/remove per member. Saving is delegated,
// so the same editor serves registration (in-form list) and the Patient Portal
// (saved records).
export default function FamilyHistoryEditor({ entries = [], isArabic, readOnly, emptyText, onSaveMember, onRemoveMember }) {
  const { t } = usePatientLanguage();
  const groups = useMemo(() => groupFamilyHistory(entries), [entries]);
  const existingKeys = useMemo(() => new Set(groups.map((g) => g.key)), [groups]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (member) => {
    setBusy(true);
    setError("");
    try {
      await onSaveMember(member, { editing: Boolean(editing) });
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      console.error(err);
      setError(t("Could not save the family member. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      await onRemoveMember(removing);
      setRemoving(null);
    } catch (err) {
      console.error(err);
      setError(t("Could not remove the family member. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {groups.length > 0 ? (
        <FamilyHistoryCards
          groups={groups}
          isArabic={isArabic}
          readOnly={readOnly}
          onEdit={(group) => {
            setError("");
            setEditing(groupToMember(group));
            setDialogOpen(true);
          }}
          onRemove={(group) => {
            setError("");
            setRemoving(group);
          }}
        />
      ) : (
        emptyText && <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setError("");
            setEditing(null);
            setDialogOpen(true);
          }}
          disabled={busy}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t("Add New Member")}
        </Button>
      )}

      <FamilyMemberDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditing(null);
        }}
        initial={editing}
        existingKeys={existingKeys}
        isArabic={isArabic}
        onSave={save}
        busy={busy}
        error={error}
      />

      <AlertDialog open={Boolean(removing)} onOpenChange={(v) => !v && !busy && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Remove family member")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Remove this family member and all of their conditions?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} disabled={busy}>
              {t("Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}