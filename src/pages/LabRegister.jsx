import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, Mail } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";

export default function LabRegister() {
  const [form, setForm] = useState({ lab_name: "", lab_number: "", email: "", password: "", confirm: "" });
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
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
      const user = await base44.auth.me();
      await base44.entities.LaboratoryProfile.create({
        user_id: user.id,
        lab_name: form.lab_name.trim(),
        lab_number: form.lab_number.trim(),
        email: form.email,
      });
      window.location.href = "/lab-portal";
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

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title="Verify your email" subtitle={`We sent a code to ${form.email}`}>
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
      icon={Building2}
      title="Create Laboratory Account"
      subtitle="Register your laboratory on A&M Healthcare"
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lab_name">Laboratory Name *</Label>
          <Input
            id="lab_name"
            placeholder="e.g. Tripoli Medical Laboratory"
            value={form.lab_name}
            onChange={set("lab_name")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lab_number">Company / Laboratory Number *</Label>
          <Input
            id="lab_number"
            placeholder="e.g. LAB-10245"
            value={form.lab_number}
            onChange={set("lab_number")}
            required
          />
        </div>
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