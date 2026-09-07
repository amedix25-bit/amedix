import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { generateUniqueCIN } from "@/lib/cin";
import QrCodeCard from "@/components/QrCodeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2, BadgeCheck, Lock, Fingerprint } from "lucide-react";

export default function PatientOnboardingForm({ user, onComplete, onClose }) {
  const nameParts = (user?.full_name || "").split(" ").filter(Boolean);
  const [form, setForm] = useState({
    first_name: nameParts[0] || "",
    middle_name: "",
    last_name: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
    date_of_birth: "",
    gender: "",
    phone: "",
    address: "",
    blood_type: "Unknown",
    allergies: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    identification_number: "",
  });
  const [step, setStep] = useState("form");
  const [cin, setCin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.gender) {
      setError("Please select your sex.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const newCin = await generateUniqueCIN();
      const fullName = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(" ");
      await base44.entities.PatientProfile.create({
        user_id: user.id,
        cin: newCin,
        full_name: fullName,
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        phone: form.phone,
        address: form.address,
        blood_type: form.blood_type,
        allergies: form.allergies,
        identification_number: form.identification_number,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        emergency_contact_relationship: form.emergency_contact_relationship,
      });
      setCin(newCin);
      setStep("success");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while creating your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="flex items-start sm:items-center justify-center p-4 min-h-full">
        <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-2xl my-4">
          {step === "form" ? (
            <>
              <div className="flex items-start justify-between p-6 pb-0">
                <div>
                  <h2 className="text-xl font-bold">Patient Registration</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete your profile to receive your unique CIN and QR code.
                  </p>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <section>
                  <h3 className="text-sm font-semibold text-primary mb-3">Personal Information</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="first_name">First name *</Label>
                      <Input id="first_name" value={form.first_name} onChange={set("first_name")} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="middle_name">Middle name</Label>
                      <Input id="middle_name" value={form.middle_name} onChange={set("middle_name")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="last_name">Last name *</Label>
                      <Input id="last_name" value={form.last_name} onChange={set("last_name")} required />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dob">Date of birth *</Label>
                      <Input id="dob" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Sex *</Label>
                      <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone number *</Label>
                      <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ""} disabled />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-primary mb-3">Address</h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address *</Label>
                    <Input id="address" placeholder="Street, city, country" value={form.address} onChange={set("address")} required />
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-primary mb-3">Emergency Contact</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ec_name">Name *</Label>
                      <Input id="ec_name" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ec_phone">Phone *</Label>
                      <Input id="ec_phone" type="tel" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ec_rel">Relationship</Label>
                      <Input id="ec_rel" placeholder="e.g. Spouse, Parent" value={form.emergency_contact_relationship} onChange={set("emergency_contact_relationship")} />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-primary mb-3">Additional Information</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="id_number">Identification number *</Label>
                      <Input id="id_number" placeholder="National ID / passport number" value={form.identification_number} onChange={set("identification_number")} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Blood type</Label>
                      <Select value={form.blood_type} onValueChange={(v) => setForm((f) => ({ ...f, blood_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    <Label htmlFor="allergies">Known allergies</Label>
                    <Input id="allergies" placeholder="e.g. Penicillin, peanuts — or 'None'" value={form.allergies} onChange={set("allergies")} />
                  </div>
                </section>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating your profile...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <BadgeCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mt-4">Registration Complete</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Your unique Clinical Identification Number has been generated.
              </p>
              <p className="text-3xl font-bold tracking-widest text-primary mt-6">{cin}</p>
              <div className="flex justify-center mt-6">
                <QrCodeCard cin={cin} size={180} />
              </div>
              <div className="text-left max-w-sm mx-auto mt-6 space-y-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Your CIN is permanent and can never be changed or duplicated.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Fingerprint className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>It contains no personal information (such as your date of birth) and doctors can search for you with it.</span>
                </div>
              </div>
              <Button className="mt-6 w-full max-w-xs" size="lg" onClick={onComplete}>
                Continue to My Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}