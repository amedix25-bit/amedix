import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// First step of account creation: the visitor proves a Libyan mobile number by
// SMS (Resala) or an email address by code. Only after that does the existing
// registration form appear. The code is never known to the browser.
export default function SignupVerification({ onVerified }) {
  const { t } = useAppLanguage();
  const [channel, setChannel] = useState(null);
  const [destination, setDestination] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendIn((s) => (s > 0 ? s - 1 : 0));
      setExpiresIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutesLeft = Math.max(Math.floor(expiresIn / 60), 0);
  const secondsLeft = expiresIn % 60;

  const sendCode = async (overrideDestination) => {
    setError("");
    setLoading(true);
    try {
      const response = await base44.functions.invoke("signupOtp", {
        action: "send",
        channel,
        destination: overrideDestination ?? destination,
      });
      const data = response?.data || {};
      if (data.error) {
        setError(data.error);
        if (data.retry_after) setResendIn(data.retry_after);
        return;
      }
      setChallengeToken(data.challenge_token);
      setDestination(data.destination || destination);
      setResendIn(data.resend_after || 60);
      setExpiresIn(data.expires_in || 600);
      setCode("");
    } catch (err) {
      const detail = err?.response?.data || {};
      setError(detail.error || t("We could not send the code. Please try again."));
      if (detail.retry_after) setResendIn(detail.retry_after);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await base44.functions.invoke("signupOtp", {
        action: "verify",
        challenge_token: challengeToken,
        code,
      });
      const data = response?.data || {};
      if (data.verified) {
        onVerified({ channel: data.channel, destination: data.destination });
        return;
      }
      setError(data.error || t("We could not verify that code. Please try again."));
    } catch (err) {
      const detail = err?.response?.data || {};
      setError(detail.error || t("We could not verify that code. Please try again."));
      if (detail.expired || detail.locked) setChallengeToken("");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setChannel(null);
    setDestination("");
    setChallengeToken("");
    setCode("");
    setError("");
  };

  if (!channel) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("Choose how you would like to verify yourself before creating your account.")}
        </p>
        <Button
          variant="outline"
          className="w-full h-14 justify-start px-4 gap-3 font-medium"
          onClick={() => { setChannel("sms"); setError(""); }}
        >
          <Phone className="w-5 h-5 text-primary" />
          <span className="text-left">
            {t("Continue with Phone Number")}
            <span className="block text-xs font-normal text-muted-foreground">
              {t("We will text a 6-digit code to your Libyan mobile number.")}
            </span>
          </span>
        </Button>
        <Button
          variant="outline"
          className="w-full h-14 justify-start px-4 gap-3 font-medium"
          onClick={() => { setChannel("email"); setError(""); }}
        >
          <Mail className="w-5 h-5 text-primary" />
          <span className="text-left">
            {t("Continue with Email Address")}
            <span className="block text-xs font-normal text-muted-foreground">
              {t("We will email you a 6-digit code.")}
            </span>
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {!challengeToken ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="verify_destination">
              {channel === "sms" ? t("Mobile number") : t("Email Address")}
            </Label>
            <div className="relative">
              {channel === "sms" ? (
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              )}
              <Input
                id="verify_destination"
                type={channel === "sms" ? "tel" : "email"}
                autoFocus
                autoComplete={channel === "sms" ? "tel" : "email"}
                inputMode={channel === "sms" ? "tel" : "email"}
                placeholder={channel === "sms" ? "091 123 4567" : "you@example.com"}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
            {channel === "sms" && (
              <p className="text-xs text-muted-foreground">
                {t("Libyan numbers only: 091, 092, 093 or 094.")}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading || !destination.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("Sending code...")}
              </>
            ) : (
              t("Send code")
            )}
          </Button>
          <button
            type="button"
            onClick={reset}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary inline-flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("Back")}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {channel === "sms"
              ? t("We sent a code by SMS to {destination}", { destination })
              : t("We sent a code to {destination}", { destination })}
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus autoComplete="one-time-code">
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
          {expiresIn > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {t("Code expires in {time}", {
                time: `${minutesLeft}:${String(secondsLeft).padStart(2, "0")}`,
              })}
            </p>
          )}
          <Button
            className="w-full h-12 font-medium"
            onClick={verifyCode}
            disabled={loading || code.length < 6}
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
          <p className="text-center text-sm text-muted-foreground">
            {resendIn > 0 ? (
              t("Resend code in {seconds}s", { seconds: resendIn })
            ) : (
              <button
                type="button"
                onClick={() => sendCode()}
                disabled={loading}
                className="text-primary font-medium hover:underline"
              >
                {t("Resend code")}
              </button>
            )}
          </p>
          <button
            type="button"
            onClick={reset}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary"
          >
            {t("Use a different number or email")}
          </button>
        </div>
      )}
    </div>
  );
}