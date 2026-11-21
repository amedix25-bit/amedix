import React, { useEffect, useState } from "react";
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
import { logRegistrationStep, lookupRegistrationState } from "@/lib/registrationRecovery";
import { passwordPolicyError } from "@/lib/passwordPolicy";

// A resend is held back on the client too: several codes in flight at once is
// exactly what makes a valid code look wrong.
const RESEND_SECONDS = 45;

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
  const [resendIn, setResendIn] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const { t } = useAppLanguage();

  // Counts the resend cooldown down. The setter returns the same value at zero,
  // so the page does not re-render while no cooldown is running.
  useEffect(() => {
    const timer = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const policyError = passwordPolicyError(password, confirmPassword);
    if (policyError) {
      setError(t(policyError));
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      logRegistrationStep("code_requested", email, "first_send");
      setOtpCode("");
      setOtpAttempts(0);
      setResendIn(RESEND_SECONDS);
      setShowOtp(true);
    } catch (err) {
      // The account may already exist. The backend says which state that
      // registration is in — an unfinished one is offered for continuation, a
      // finished one is sent to sign-in. Never a bare "already exists" dead end.
      const info = await lookupRegistrationState(email).catch(() => null);
      const state = info?.state || "unknown";
      // If the backend reports a brand-new address but the platform refused the
      // sign-up because the account exists, the account still exists — send the
      // person to sign-in rather than back to a dead end.
      const existsPerPlatform = /exist|already|registered/i.test(String(err?.message || ""));
      if (state === "new" && existsPerPlatform) {
        setExistingState("active");
      } else if (["unverified", "incomplete", "pending_verification", "active", "rejected", "blocked", "rate_limited"].includes(state)) {
        setExistingState(state);
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
      logRegistrationStep("code_resent", email, "resume");
      setContinuing(true);
      setOtpCode("");
      setOtpAttempts(0);
      setResendIn(RESEND_SECONDS);
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
      logRegistrationStep("code_verified", email, continuing ? "resumed" : "signup");
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Continuing a registration lands on the onboarding page, where the saved
      // steps are restored.
      window.location.href = continuing ? "/home" : safeReturnTo();
    } catch (err) {
      logRegistrationStep("code_rejected", email, "wrong_code");
      setOtpAttempts((n) => n + 1);
      setError(err.message || t("Invalid verification code"));
    } finally {
      setLoading(false);
    }
  };

  // One resend at a time, then a cooldown. Every resend replaces the previous
  // code, so tapping repeatedly is what leaves people typing a code that is no
  // longer valid.
  const handleResend = async () => {
    if (loading || resendIn > 0) return;
    setError("");
    setLoading(true);
    try {
      await base44.auth.resendOtp(email);
      logRegistrationStep("code_resent", email, "resend");
      setOtpCode("");
      setOtpAttempts(0);
      setResendIn(RESEND_SECONDS);
      toast({
        title: t("New code sent"),
        description: t("Only the newest code works. If you cannot find the email, check your spam or junk folder."),
      });
    } catch (err) {
      setError(t("We could not resend the code right now. Please try again in a moment."));
    } finally {
      setLoading(false);
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
        <div className="mt-4 space-y-2 text-center">
          <p className="text-xs text-muted-foreground">
            {t("The code can take a minute to arrive. Check your spam or junk folder. If you asked for more than one code, only the newest one works.")}
          </p>
          {otpAttempts >= 2 && (
            <p className="text-xs text-muted-foreground">
              {t("Still not working? Request a new code — an older one may have been replaced.")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {resendIn > 0 ? (
              t("Resend code in {seconds}s", { seconds: resendIn })
            ) : (
              <button onClick={handleResend} disabled={loading} className="text-primary font-medium hover:underline">
                {t("Resend code")}
              </button>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowOtp(false);
              setOtpCode("");
              setOtpAttempts(0);
              setContinuing(false);
              setError("");
            }}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {t("Use a different email")}
          </button>
        </div>
      </AuthLayout>
    );
  }

  // An email that already has a registration is offered a way forward instead
  // of an error: continue an unfinished registration, or go to the login for a
  // finished one. Saved registration information is never shown here — it is
  // only restored after the email address has been verified.
  if (existingState && !showOtp) {
    // An unconfirmed account is resumed with a fresh code. A confirmed one is
    // resumed by signing in — its saved registration is restored from the
    // server after login. Neither is a dead end.
    const canContinue = existingState === "unverified";
    const title = {
      unverified: t("Finish creating your account"),
      incomplete: t("Continue your registration"),
      pending_verification: t("Your registration is under review"),
      active: t("This email is already registered"),
      rejected: t("Registration not approved"),
      blocked: t("Account unavailable"),
      rate_limited: t("Please wait a moment"),
    }[existingState] || t("This email is already registered");
    const message = {
      unverified: t("This email has an account that has not been confirmed yet. Send a new code to confirm it and continue where you stopped."),
      incomplete: t("Your registration for this email is saved. Log in with your password and we will take you back to the step you stopped at."),
      pending_verification: t("This registration was submitted and is waiting for AMedix verification. Log in to see its status."),
      active: t("Log in to continue to your account. If you have forgotten your password, you can reset it."),
      rejected: t("This registration was not approved. Please contact AMedix administration for help."),
      blocked: t("This account is not available. Please contact AMedix administration."),
      rate_limited: t("Too many attempts from this device. Please try again in a few minutes."),
    }[existingState] || t("Log in to continue.");

    return (
      <AuthLayout
        embedded={embedded}
        icon={canContinue ? RotateCcw : ShieldCheck}
        title={title}
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
                t("Send code and continue")
              )}
            </Button>
            <Button variant="outline" className="w-full h-12 font-medium" asChild>
              <Link to="/login">{t("Log in to continue")}</Link>
            </Button>
          </div>
        ) : !["rejected", "blocked", "rate_limited"].includes(existingState) ? (
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