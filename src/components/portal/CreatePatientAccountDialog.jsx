import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, HeartPulse } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";
import { generateUniqueCIN } from "@/lib/cin";

// Lets a Doctor or Radiologist add a Patient profile linked securely to the
// same authenticated account — a second authorized role with its own CIN and
// patient health record, not a separate login identity.
export default function CreatePatientAccountDialog({ open, user, onClose }) {
  const { t } = useAppLanguage();
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "male",
    phone: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null); // { cin }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      // Never create a duplicate patient account — an existing profile simply
      // opens the Patient Portal.
      const existing = await base44.entities.PatientProfile.filter({ user_id: user.id });
      if (existing.length > 0) {
        setCreated({ cin: existing[0].cin });
        return;
      }
      const cin = await generateUniqueCIN();
      const full_name = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ");
      await base44.entities.PatientProfile.create({
        user_id: user.id,
        cin,
        full_name,
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        date_of_birth: form.date_of_birth || undefined,
        gender: form.gender,
        phone: form.phone || undefined,
        preferred_language: "en",
      });
      setCreated({ cin });
    } catch (err) {
      console.error(err);
      setError(t("Could not create the patient account. Please try again."));
    } finally {
      setCreating(false);
    }
  };

  const close = () => {
    setCreated(null);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        {created ? (
          <div className="text-center py-2">
            <HeartPulse className="w-10 h-10 mx-auto text-primary mb-3" />
            <h3 className="text-lg font-bold">{t("Patient Account Created")}</h3>
            <p className="text-sm text-muted-foreground mt-2">{t("Your patient CIN is:")}</p>
            <p className="text-2xl font-bold text-primary mt-1">{created.cin}</p>
            <p className="text-sm text-muted-foreground mt-3">
              {t("You can now switch between your professional portal and the Patient Portal at any time.")}
            </p>
            <Button className="mt-5 w-full" onClick={() => { window.location.href = "/patient"; }}>
              {t("Open Patient Portal")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("Create Patient Account")}</DialogTitle>
              <DialogDescription>
                {t(
                  "Add a patient profile linked to this account. You will be able to switch between your professional portal and the Patient Portal."
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pa-first-name">{t("First Name *")}</Label>
                  <Input id="pa-first-name" placeholder={t("First name")} value={form.first_name} onChange={set("first_name")} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pa-middle-name">{t("Middle Name")}</Label>
                  <Input id="pa-middle-name" placeholder={t("Middle name")} value={form.middle_name} onChange={set("middle_name")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pa-last-name">{t("Last Name *")}</Label>
                <Input id="pa-last-name" placeholder={t("Last name")} value={form.last_name} onChange={set("last_name")} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pa-dob">{t("Date of Birth")}</Label>
                  <Input id="pa-dob" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pa-gender">{t("Sex")}</Label>
                  <select
                    id="pa-gender"
                    value={form.gender}
                    onChange={set("gender")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="male">{t("Male")}</option>
                    <option value="female">{t("Female")}</option>
                    <option value="other">{t("Other")}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pa-phone">{t("Phone")}</Label>
                <Input id="pa-phone" placeholder={t("Contact number")} value={form.phone} onChange={set("phone")} />
              </div>
              {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("Creating patient account...")}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t("Create Patient Account")}
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}