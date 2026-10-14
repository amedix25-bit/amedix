import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import FavoriteEditorDialog from "@/components/doctor/lab/FavoriteEditorDialog";
import { Plus, FlaskConical, Trash2, SquarePen, AlertTriangle, Loader2 } from "lucide-react";
import { entryById } from "@/lib/labTestCatalog";

// Hospital-wide lab panels, managed by the hospital administrator.
// All create/update/delete operations go through the backend-enforced
// hospitalPanelManage function — doctors of this hospital can view and apply
// these panels but never modify them.
export default function HospitalLabPanelsSection({ profile }) {
  const { user } = useAuth();
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await base44.functions.invoke("hospitalPanelManage", { action: "list" });
      // Only this hospital's panels are managed here; platform-wide panels stay in the admin dashboard.
      setPanels((res.data.panels || []).filter((p) => p.hospital_user_id === user?.id));
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (panel) => {
    if (!window.confirm(`Delete the hospital panel "${panel.favorite_name}"? Doctors of ${profile.hospital_name} will no longer see it.`)) return;
    try {
      await base44.functions.invoke("hospitalPanelManage", { action: "delete", id: panel.id });
      setPanels((p) => p.filter((x) => x.id !== panel.id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold">Hospital Lab Panels</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Standardized test collections shared with the doctors of {profile.hospital_name} — they can apply a panel with one click, but only this hospital's administrators create, edit or delete panels. Doctors' personal favorites remain private.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setEditorOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Hospital Panel
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading panels...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Couldn't load the panels.
          </p>
          <Button size="sm" variant="outline" onClick={load}>Retry</Button>
        </div>
      ) : panels.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-xl border border-border bg-card">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hospital panels yet</p>
          <p className="text-xs mt-1">Create one to give this hospital's doctors a one-click standardized test set.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {panels.map((panel) => {
            const testNames = (panel.test_ids || []).map(entryById).filter(Boolean).map((e) => e.name);
            const retiredCount = (panel.test_ids || []).length - testNames.length;
            return (
              <div key={panel.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{panel.favorite_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {testNames.length} test(s){testNames.length > 0 ? ` — ${testNames.slice(0, 6).join(", ")}${testNames.length > 6 ? ` and ${testNames.length - 6} more` : ""}` : ""}
                  </p>
                  {retiredCount > 0 && (
                    <p className="text-xs text-destructive mt-0.5">{retiredCount} test(s) no longer in the catalog</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setEditing(panel); setEditorOpen(true); }}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                    title="Edit panel"
                  >
                    <SquarePen className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(panel)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                    title="Delete panel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FavoriteEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        favorite={editing}
        doctorId={user?.id || ""}
        hospital={{ hospital_user_id: user?.id || "", hospital_name: profile.hospital_name }}
        onSaved={(saved) =>
          setPanels((p) => {
            const rest = p.filter((x) => x.id !== saved.id);
            return [saved, ...rest];
          })
        }
      />
    </div>
  );
}