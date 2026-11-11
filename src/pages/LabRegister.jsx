import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, KeyRound, Loader2, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Upload } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import InstitutionCodeGate from "@/components/registration/InstitutionCodeGate";
import InstitutionRegistrationFields from "@/components/registration/InstitutionRegistrationFields";
import RegistrationProgress from "@/components/registration/RegistrationProgress";

const PHONE_PATTERN = /^\+?[0-9\s-]{7,15}$/;
const STEPS = ["Administration Code", "Email Verification", "Laboratory Information", "AMedix Approval"];

export default function LabRegister({ embedded = false }) {
  const [form, setForm] = useState({
    lab_name: "",
    address: "",
    phone: "",
    whatsapp_number: "",
    registration_number: "",
    license_number: "",
    responsible_person_name: "",
    responsible_person_license: "",
    administrator_name: "",
    administrator_phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  // The AMedix Administration Code verified before any email is entered, and
  // the pending registration returned by the server.
  const [codeInfo, setCodeInfo] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Logo must be an image file (JPG, PNG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo file must be smaller than 5 MB");
      return;
    }
    setError("");
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!form.lab_name.trim()) return "Laboratory name is required";
    if (!form.address.trim()) return "Location / address is required";
    if (!PHONE_PATTERN.test(form.phone.trim())) return "Please enter a valid phone number";
    if (!PHONE_PATTERN.test(form.whatsapp_number.trim())) return "Please enter a valid WhatsApp number";
    if (!logoFile) return "Please upload a profile picture or laboratory logo";
    if (!form.registration_number.trim()) return "The laboratory registration number is required";
    if (!form.license_number.trim()) return "The laboratory licence number is required";
    if (!form.responsible_person_name.trim()) return "The responsible laboratory director is required";
    if (!form.administrator_name.trim()) return "The authorised administrator is required";
    if (!licenseFile) return "Please upload the laboratory licence document for verification";
    if (form.password !== form.confirm) return "Passwords do not match";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    setError(validationError || "");
    if (validationError) return;
    setLoading(true);
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: form.email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      const uploadRes = await base44.integrations.Core.UploadPublicFile({ file: logoFile });
      const licenseRes = await base44.integrations.Core.UploadPrivateFile({ file: licenseFile });

      // The registration is recorded server-side against the AMedix
      // Administration Code and stays PENDING. No laboratory profile is created
      // here, and the institution gains no access until AMedix administration
      // approves and activates it.
      const res = await base44.functions.invoke("institutionRegistrationSubmit", {
        institution_type: "laboratory",
        registration_code: codeInfo?.code || "",
        legal_name: form.lab_name.trim(),
        registration_number: form.registration_number.trim(),
        license_number: form.license_number.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        whatsapp_number: form.whatsapp_number.trim(),
        responsible_person_name: form.responsible_person_name.trim(),
        responsible_person_license: (form.responsible_person_license || "").trim(),
        administrator_name: form.administrator_name.trim(),
        administrator_email: form.email,
        administrator_phone: (form.administrator_phone || "").trim(),
        logo_url: uploadRes.file_url,
        license_file_uri: licenseRes.file_uri,
        license_file_name: licenseFile?.name || "",
      });
      setSubmitted(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Invalid verification code");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(form.email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  // Step 1 — mandatory AMedix Administration Code, before any email address is
  // entered and before any verification code can be sent.
  if (!codeInfo) {
    return (
      <AuthLayout
        embedded={embedded}
        icon={KeyRound}
        title="Register Your Laboratory with AMedix"
        subtitle="Step 1 of 4 · AMedix Administration Code"
        footer={
          <>
            Already have a laboratory account?{" "}
            <Link to="/lab" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </>
        }
      >
        <InstitutionCodeGate institutionType="laboratory" onValidated={setCodeInfo} />
      </AuthLayout>
    );
  }

  if (submitted) {
    return (
      <AuthLayout
        embedded={embedded}
        icon={ShieldCheck}
        title="Pending AMedix approval"
        subtitle="Your laboratory registration has been submitted"
      >
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <p className="font-medium">Reference: {submitted.reference || "—"}</p>
            <p className="mt-1 text-foreground/80">
              AMedix administration is reviewing {form.lab_name} and the licence you submitted. The laboratory stays
              inactive and cannot receive laboratory requests, submit results, or access patient records until it is
              approved and activated.
            </p>
          </div>
          <Button className="w-full h-12 font-medium" onClick={() => (window.location.href = "/lab-portal")}>
            Go to laboratory portal
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            The reviewing administrator opens your licence through a secure private link. Approval is recorded in your
            laboratory account.
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (showOtp) {
    return (
      <AuthLayout embedded={embedded} icon={Mail} title="Verify your email" subtitle={`We sent a code to ${form.email}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <RegistrationProgress steps={STEPS} current={1} />
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & Create Laboratory Account"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Resend
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      embedded={embedded}
      icon={Building2}
      title="Create Laboratory Account"
      subtitle="Register your laboratory on AMedix"
      footer={
        <>
          Already have a laboratory account?{" "}
          <Link to="/lab" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <RegistrationProgress steps={STEPS} current={2} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lab_name">Legal Laboratory Name *</Label>
          <Input
            id="lab_name"
            placeholder="e.g. Tripoli Medical Laboratory"
            value={form.lab_name}
            onChange={set("lab_name")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Location / Address *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="address"
              placeholder="e.g. Omar Al-Mukhtar St., Tripoli"
              value={form.address}
              onChange={set("address")}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="phone"
                type="tel"
                placeholder="+218 91 234 5678"
                value={form.phone}
                onChange={set("phone")}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="whatsapp_number"
                type="tel"
                placeholder="+218 91 234 5678"
                value={form.whatsapp_number}
                onChange={set("whatsapp_number")}
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Laboratory Profile Picture / Logo *</Label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border">
                <Building2 className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              {logoPreview ? "Change Logo" : "Upload Logo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>
        <InstitutionRegistrationFields
          values={form}
          onChange={(key, value) => setForm((s) => ({ ...s, [key]: value }))}
          licenseFile={licenseFile}
          onLicenseFile={setLicenseFile}
          responsibleLabel="Responsible Laboratory Director"
          responsiblePlaceholder="Full name of the laboratory director"
        />
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="lab@example.com"
            value={form.email}
            onChange={set("email")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={set("password")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password *</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={set("confirm")}
            required
          />
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Laboratory Account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}