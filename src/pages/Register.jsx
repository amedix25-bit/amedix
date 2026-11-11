import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useAppLanguage } from "@/lib/appLanguage";
import { lookupDoctorRegistration } from "@/lib/doctorRegistration";
import SignupVerification from "@/components/registration/SignupVerification";

export default function Register({ embedded = false, onLogin = null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  // An email that already has a registration: the page offers to continue it
  // instead of reporting that the account already exists.
  const [existingState, setExistingState] = useState("");
  const [continuing, setContinuing] = useState(false);
  // The chosen verification (phone by SMS or email by code) must succeed before
  // the registration form appears at all.
  const [verified, setVerified] = useState(null);
  const { t } = useAppLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("Passwords do not match"));
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      // The account may already exist. Ask what state that registration is in:
      // an unfinished one is offered for continuation, a finished one is sent
      // to the login — never reported as a bare "already exists" dead end.
      const existing = await lookupDoctorRegistration(email).catch(() => null);
      if (existing?.state && existing.state !== "none") {
        setExistingState(existing.state);
      } else {
        setError(err.message || t("Registration failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Continuing a saved registration requires proving the account is theirs: a
  // verification code goes to the registered email address.
  const handleContinue = async () => {
    setError("");
    setLoading(true);
    try {
      await base44.auth.resendOtp(email);
      setContinuing(true);
      setShowOtp(true);
    } catch (err) {
      setError(t("We could not send a code to this email. Please log in to continue your registration."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Continuing a registration lands on the onboarding page, where the saved
      // steps are restored.
      window.location.href = continuing ? "/home" : safeReturnTo();
    } catch (err) {
      setError(err.message || t("Invalid verification code"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: t("Code sent"),
        description: t("Check your email for the new code."),
      });
    } catch (err) {
      setError(err.message || t("Failed to resend code"));
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  const loginFooter = (
    <>
      {t("Already have an account?")}{" "}
      {onLogin ? (
        <button type="button" onClick={onLogin} className="text-primary font-medium hover:underline">{t("Log in")}</button>
      ) : (
        <Link to={"/login" + (safeReturnTo(null) ? "?returnTo=" + encodeURIComponent(safeReturnTo(null)) : "")} className="text-primary font-medium hover:underline">{t("Log in")}</Link>
      )}
    </>
  );

  // Step one of account creation: prove a phone number or an email address.
  // Everything after this point is the registration flow exactly as before.
  if (!verified) {
    return (
      <AuthLayout
        embedded={embedded}
        icon={ShieldCheck}
        title={t("Create your account")}
        subtitle={t("Verify your phone number or email address to continue.")}
        footer={loginFooter}
      >
        <SignupVerification
          onVerified={(result) => {
            if (result.channel === "email" && result.destination) setEmail(result.destination);
            setVerified(result);
          }}
        />
      </AuthLayout>
    );
  }

  if (showOtp) {
    return (
      <AuthLayout
        embedded={embedded}
        icon={Mail}
        title={t("Verify your email")}
        subtitle={t("We sent a code to {email}", { email })}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
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
              {t("Verifying...")}
            </>
          ) : (
            t("Verify")
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("Didn't receive the code?")}{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            {t("Resend")}
          </button>
        </p>
      </AuthLayout>
    );
  }

  // An email that already has a registration is offered a way forward instead
  // of an error: continue an unfinished registration, or go to the login for a
  // finished one. Saved registration information is never shown here — it is
  // only restored after the email address has been verified.
  if (existingState && !showOtp) {
    const canContinue = existingState === "incomplete";
    const message = {
      incomplete: t("An unfinished doctor registration was found for this email. Verify your email address to continue from the step you stopped at."),
      pending_verification: t("This registration was submitted and is awaiting verification. Log in to check its status."),
      active: t("This email is already registered. Log in to continue."),
      other_account: t("This email is already registered. Log in to continue."),
      rejected: t("This registration was not approved. Please contact AMedix administration for help."),
    }[existingState] || t("This email is already registered. Log in to continue.");

    return (
      <AuthLayout
        embedded={embedded}
        icon={canContinue ? RotateCcw : ShieldCheck}
        title={canContinue ? t("Continue your registration") : t("Account already registered")}
        subtitle={t("Connected Care. Better Health.")}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        {canContinue ? (
          <div className="space-y-3">
            <Button className="w-full h-12 font-medium" onClick={handleContinue} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("Sending code...")}
                </>
              ) : (
                t("Verify email and continue")
              )}
            </Button>
            <Button variant="outline" className="w-full h-12 font-medium" asChild>
              <Link to="/login">{t("Log in to continue")}</Link>
            </Button>
          </div>
        ) : existingState !== "rejected" ? (
          <Button className="w-full h-12 font-medium" asChild>
            <Link to="/login">{t("Go to login")}</Link>
          </Button>
        ) : null}
        <p className="text-center text-sm text-muted-foreground mt-4">
          <button
            type="button"
            onClick={() => { setExistingState(""); setContinuing(false); setError(""); }}
            className="text-primary font-medium hover:underline"
          >
            {t("Use a different email")}
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      embedded={embedded}
      icon={UserPlus}
      title={t("Join A&M Healthcare")}
      subtitle={t("Connected Care. Better Health.")}
      footer={loginFooter}
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        {t("Continue with Google")}
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t("or")}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("Email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("Password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t("Confirm Password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("Creating account...")}
            </>
          ) : (
            t("Create account")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}