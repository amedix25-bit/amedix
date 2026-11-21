import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import {
  cooldownRemaining,
  markRequested,
  rememberResetEmail,
  describeRequestError,
} from "@/lib/passwordRecovery";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sent | error
  const [message, setMessage] = useState("");
  const [remaining, setRemaining] = useState(0);
  const { t } = useAppLanguage();

  // The resend cooldown is the app's own: it protects the platform's shared
  // auth allowance and stops a user from firing five requests in ten seconds.
  const syncCooldown = useCallback(() => {
    setRemaining(cooldownRemaining(email));
  }, [email]);

  // Recomputed from the stored timestamp on every tick, and again whenever the
  // tab becomes visible or regains focus. Mobile browsers and background tabs
  // throttle timers, so counting down in memory would leave the resend button
  // disabled long after the cooldown had actually ended.
  useEffect(() => {
    syncCooldown();
    const timer = setInterval(syncCooldown, 1000);
    const onVisible = () => {
      if (!document.hidden) syncCooldown();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", syncCooldown);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", syncCooldown);
    };
  }, [syncCooldown]);

  const request = async (event) => {
    event?.preventDefault();
    if (sending) return;
    const address = email.trim();
    // Never suppressed by stale local state: the window is re-read from the
    // stored request time for this exact address.
    if (cooldownRemaining(address) > 0) {
      setRemaining(cooldownRemaining(address));
      return;
    }
    setSending(true);
    setMessage("");
    try {
      await base44.auth.resetPasswordRequest(address);
      // Accepted by the server. That is all this page can honestly confirm.
      rememberResetEmail(address);
      markRequested(address);
      setRemaining(cooldownRemaining(address));
      setStatus("sent");
    } catch (err) {
      // A refused request starts no cooldown, so it can be retried at once.
      const info = describeRequestError(err);
      setMessage(info.message);
      setStatus("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout
      icon={status === "sent" ? CheckCircle2 : Mail}
      title={t("Reset password")}
      subtitle={t("We'll send you a link to reset it")}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1 rtl:rotate-180" />{t("Back to log in")}
        </Link>
      }
    >
      {status === "sent" ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-foreground">
            {t("If an account exists with that email, a password reset link has been requested for it.")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("The email can take a minute or two to arrive. If it is not there, check your spam or junk folder and make sure the address is the one you registered with.")}
          </p>
          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            {t("Each link can be used once. If you request another one, use the newest email — older links stop working.")}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={request}
            disabled={sending || remaining > 0}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {remaining > 0
              ? t("Send again in {seconds}s").replace("{seconds}", String(remaining))
              : t("Send another reset link")}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setMessage("");
            }}
            className="text-xs text-primary font-medium hover:underline"
          >
            {t("Use a different email address")}
          </button>
        </div>
      ) : (
        <form onSubmit={request} className="space-y-4">
          {status === "error" && message && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t("Email address")}</Label>
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
          <Button type="submit" className="w-full h-12 font-medium" disabled={sending || remaining > 0}>
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("Sending...")}
              </>
            ) : remaining > 0 ? (
              t("Send again in {seconds}s").replace("{seconds}", String(remaining))
            ) : (
              t("Send reset link")
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("Working at a hospital, laboratory or pharmacy? Receptionist, laboratory technician and pharmacist passwords are managed by the facility, not by this email. Ask your facility administrator to reset it from their portal.")}
          </p>
        </form>
      )}
    </AuthLayout>
  );
}