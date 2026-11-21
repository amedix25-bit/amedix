import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAppLanguage } from "@/lib/appLanguage";
import {
  RESEND_COOLDOWN_SECONDS,
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
  const [remaining, setRemaining] = useState(() => cooldownRemaining());
  const { t } = useAppLanguage();

  // The resend cooldown is the app's own: it protects the platform's shared
  // auth allowance and stops a user from firing five requests in ten seconds.
  useEffect(() => {
    if (remaining <= 0) return undefined;
    const timer = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const request = async (event) => {
    event?.preventDefault();
    if (sending || remaining > 0) return;
    setSending(true);
    setMessage("");
    try {
      await base44.auth.resetPasswordRequest(email);
      // Accepted by the server. That is all this page can honestly confirm.
      rememberResetEmail(email);
      markRequested();
      setRemaining(RESEND_COOLDOWN_SECONDS);
      setStatus("sent");
    } catch (err) {
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
            {t("If an account exists with that email, a password reset link is on its way to it.")}
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