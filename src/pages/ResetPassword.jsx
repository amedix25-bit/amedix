import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, CheckCircle2, KeyRound } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import { passwordPolicyError } from "@/lib/passwordPolicy";
import {
  readResetToken,
  lastResetEmail,
  forgetResetEmail,
  isTokenError,
  isCredentialError,
} from "@/lib/passwordRecovery";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = readResetToken(searchParams);
  const knownEmail = lastResetEmail();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // form → invalid_token | not_applied | success
  const [phase, setPhase] = useState("form");
  const [verified, setVerified] = useState(false);
  const { t } = useAppLanguage();

  const goToLogin = () => {
    forgetResetEmail();
    if (verified) {
      // A session was created only to prove the new password works; end it so
      // the user signs in themselves with the new password.
      base44.auth.logout(`${window.location.origin}/login?reset=1`);
      return;
    }
    window.location.href = "/login?reset=1";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const policyError = passwordPolicyError(newPassword, confirmPassword);
    if (policyError) {
      setError(t(policyError));
      return;
    }

    setLoading(true);
    try {
      // The backend is the only thing that can change the credential; nothing
      // is shown as successful until this resolves.
      await base44.auth.resetPassword({ resetToken, newPassword });
    } catch (err) {
      setLoading(false);
      if (isTokenError(err)) {
        setPhase("invalid_token");
        return;
      }
      setError(err?.response?.data?.message || err.message || t("Failed to reset password"));
      return;
    }

    // Prove the new credential actually works before claiming success. Without
    // this, a reset that silently failed would only surface as "the new
    // password does not work" at the login screen.
    if (knownEmail) {
      try {
        await base44.auth.loginViaEmailPassword(knownEmail, newPassword);
        setVerified(true);
      } catch (err) {
        if (isCredentialError(err)) {
          setLoading(false);
          setPhase("not_applied");
          return;
        }
        // Not a credential problem (unverified account, MFA, network): the
        // password change itself was accepted, so continue without the proof.
        setVerified(false);
      }
    }

    setLoading(false);
    setPhase("success");
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={t("Invalid reset link")}
        subtitle={t("This password reset link is missing or invalid")}
        footer={
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t("Back to log in")}
          </Link>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-foreground">
            {t("The link you used appears to be incomplete. Please request a new password reset email.")}
          </p>
          <Button asChild className="w-full">
            <Link to="/forgot-password">{t("Request a new link")}</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (phase === "invalid_token") {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={t("This link has expired")}
        subtitle={t("Reset links can be used only once")}
        footer={
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t("Back to log in")}
          </Link>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-foreground">
            {t("This password reset link has expired or was already used. Request a new one and use the newest email you receive.")}
          </p>
          <Button asChild className="w-full">
            <Link to="/forgot-password">{t("Request a new link")}</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (phase === "not_applied") {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={t("Password not updated")}
        subtitle={t("The new password was not accepted")}
        footer={
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t("Back to log in")}
          </Link>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-foreground">
            {t("The server accepted the reset but the new password did not work when checked. Please request a new link and try again.")}
          </p>
          <Button asChild className="w-full">
            <Link to="/forgot-password">{t("Request a new link")}</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (phase === "success") {
    return (
      <AuthLayout
        icon={CheckCircle2}
        title={t("Password updated")}
        subtitle={t("Your new password is active")}
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-foreground">
            {verified
              ? t("Your password was changed and confirmed by the server. Sign in with your new password.")
              : t("Your password was changed. Sign in with your new password.")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("For your security, every device signed in to this account has been signed out.")}
          </p>
          <Button className="w-full h-12 font-medium" onClick={goToLogin}>
            <KeyRound className="w-4 h-4 mr-2" />
            {t("Continue to sign in")}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title={t("New password")}
      subtitle={t("Enter your new password below")}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t("New Password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
        <p className="text-xs text-muted-foreground">
          {t("Use at least 8 characters.")}
        </p>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("Resetting...")}
            </>
          ) : (
            t("Reset password")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}