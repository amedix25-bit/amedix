import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, FileText, Loader2, Mail, MapPin, Phone, ShieldCheck, Upload } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";

export default function HospitalRegister({ embedded = false }) {
  const [form, setForm] = useState({ hospital_name: "", location: "", phone: "", email: "", password: "", confirm: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  // Set once the server has recorded the request — the hospital then waits for
  // AMedix administrative approval.
  const [submitted, setSubmitted] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const licenseInputRef = useRef(null);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("The hospital photo must be an image file (JPG, PNG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The photo file must be smaller than 5 MB");
      return;
    }
    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleLicenseChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("The registration document must be smaller than 10 MB");
      return;
    }
    setError("");
    setLicenseFile(file);
  };

  const validate = () => {
    if (!form.hospital_name.trim()) return "Hospital name is required";
    if (!form.location.trim()) return "Location / address is required";
    if (!form.phone.trim()) return "Phone number is required";
    if (!photoFile) return "Please upload a hospital photo";
    if (!licenseFile) return "Please upload the hospital's registration / licence document for verification";
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
      const photoRes = await base44.integrations.Core.UploadPublicFile({ file: photoFile });
      const licenseRes = await base44.integrations.Core.UploadPrivateFile({ file: licenseFile });

      // The profile and the authorization request are created server-side; the
      // hospital cannot create either of them itself, and it can never set its
      // own approval or activation state.
      const res = await base44.functions.invoke("hospitalRegistrationSubmit", {
        hospital_name: form.hospital_name.trim(),
        location: form.location.trim(),
        phone: form.phone.trim(),
        photo_url: photoRes.file_url,
        license_file_uri: licenseRes.file_uri,
        license_file_name: licenseFile?.name || "",
      });
      setSubmitted(res.data);
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

  if (submitted) {
    return (
      <AuthLayout
        embedded={embedded}
        icon={ShieldCheck}
        title="Pending administrative approval"
        subtitle="Your registration has been submitted to AMedix"
      >
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <p className="font-medium">Reference: {submitted.request_reference || "—"}</p>
            <p className="mt-1 text-foreground/80">
              AMedix administration is reviewing {form.hospital_name} and the documentation you submitted. Your
              AMedix Hospital Code stays locked until the institution is approved and you activate the authorization
              code issued to this hospital.
            </p>
          </div>
          <Button className="w-full h-12 font-medium" onClick={() => (window.location.href = "/hospital-portal")}>
            Go to hospital portal
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            A notification with your registration details and documentation was sent to AMedix administration. The
            decision appears in your hospital portal.
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (showOtp) {
    return (
      <AuthLayout embedded={embedded} icon={Mail} title="Verify your email" subtitle={`We sent a code to ${form.email}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
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
            "Verify & Create Hospital Account"
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
      title="Create Hospital Account"
      subtitle="Register your hospital on AMedix"
      footer={
        <>
          Already have a hospital account?{" "}
          <Link to="/hospital" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hospital_name">Hospital Name *</Label>
          <Input
            id="hospital_name"
            placeholder="e.g. Tripoli Central Hospital"
            value={form.hospital_name}
            onChange={set("hospital_name")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location / Address *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="location"
              placeholder="e.g. Omar Al-Mukhtar St., Tripoli"
              value={form.location}
              onChange={set("location")}
              className="pl-10"
              required
            />
          </div>
        </div>
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
          <Label>Hospital Photo *</Label>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              <img src={photoPreview} alt="Hospital photo preview" className="w-16 h-16 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border">
                <Building2 className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              {photoPreview ? "Change Photo" : "Upload Photo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Registration / Licence Document *</Label>
          <p className="text-xs text-muted-foreground">
            Upload the institution's official registration or licence so AMedix administration can verify it.
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => licenseInputRef.current?.click()}>
              <FileText className="w-4 h-4 mr-2" />
              {licenseFile ? "Change Document" : "Upload Document"}
            </Button>
            <span className="text-sm text-muted-foreground truncate">
              {licenseFile ? licenseFile.name : "PDF or image, up to 10 MB"}
            </span>
            <input
              ref={licenseInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleLicenseChange}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="hospital@example.com"
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
            "Create Hospital Account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}