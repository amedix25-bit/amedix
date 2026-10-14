import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import FavoriteEditorDialog from "@/components/doctor/lab/FavoriteEditorDialog";
import { Plus, FlaskConical, Trash2, SquarePen } from "lucide-react";
import { entryById } from "@/lib/labTestCatalog";

export default function AdminLabPanels() {
  const { user } = useAuth();
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await base44.entities.DoctorLabFavorite.filter({ is_shared: true }, "-created_date");
      setPanels(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (panel) => {
    if (!window.confirm(`Delete the shared panel "${panel.favorite_name}"? Doctors will no longer see it.`)) return;
    await base44.entities.DoctorLabFavorite.delete(panel.id);
    setPanels((p) => p.filter((x) => x.id !== panel.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold">Shared Laboratory Panels</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Standardized test collections every doctor can apply with one click. Only administrators create, edit or delete them — doctors' personal favorites are separate and private.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setEditorOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Panel
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : panels.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-xl border border-border bg-card">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No shared panels yet</p>
          <p className="text-xs mt-1">Create one to give all doctors a one-click standardized test set.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {panels.map((panel) => {
            const testNames = (panel.test_ids || []).map(entryById).filter(Boolean).map((e) => e.name);
            return (
              <div key={panel.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{panel.favorite_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {testNames.length} test(s){testNames.length > 0 ? ` — ${testNames.slice(0, 6).join(", ")}${testNames.length > 6 ? ` and ${testNames.length - 6} more` : ""}` : ""}
                  </p>
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
        isShared
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