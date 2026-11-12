import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import BrandLogo from "@/components/BrandLogo";
import { useAppLanguage } from "@/lib/appLanguage";
import {
  clearPatientPhoneSession,
  readPatientPhoneSession,
  savePatientPhoneSession,
} from "@/lib/patientPhoneSession";
import {
  CalendarDays,
  FileText,
  FlaskConical,
  Loader2,
  LogOut,
  Phone,
  Pill,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

// Phone-only patient access: enter the number once, receive the code by SMS,
// enter it, complete personal details if this is a new record, and land in the
// patient portal. No email address is asked for at any step.
export default function PatientPhoneAccess() {
  const { t } = useAppLanguage();
  const [step, setStep] = useState("checking");
  const [phone, setPhone] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [counts, setCounts] = useState(null);
  const [details, setDetails] = useState({
    first_name: "",
    father_name: "",
    grandfather_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    nationality: "Libyan",
    address: "",
    identification_number: "",
    preferred_language: "ar",
  });

  const fail = (err, fallback) => err?.response?.data?.error || fallback;

  const loadContext = async (token) => {
    try {
      const { data } = await base44.functions.invoke("patientPhoneAuth", { action: "context", token });
      setSession({ token, ...data.patient });
      setCounts(data.counts);
      setStep("portal");
    } catch {
      clearPatientPhoneSession();
      setStep("phone");
    }
  };

  useEffect(() => {
    const token = readPatientPhoneSession();
    if (token) loadContext(token);
    else setStep("phone");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendCode = async (event) => {
    event?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke("patientPhoneAuth", {
        action: "send",
        phone,
      });
      setPhone(data.phone);
      setChallengeToken(data.challenge_token);
      setCode("");
      setStep("code");
    } catch (err) {
      setError(fail(err, t("We could not send the code. Please try again.")));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke("patientPhoneAuth", {
        action: "verify",
        challenge_token: challengeToken,
        code,
      });
      savePatientPhoneSession(data.token);
      if (data.needs_details) {
        setSession({ token: data.token });
        setStep("details");
      } else {
        setSession({ token: data.token, ...data.patient });
        setStep("portal");
        loadContext(data.token);
      }
    } catch (err) {
      setError(fail(err, t("We could not verify that code. Please try again.")));
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = session?.token || readPatientPhoneSession();
      const { data } = await base44.functions.invoke("patientPhoneAuth", {
        action: "complete",
        token,
        details,
      });
      setSession({ token, ...data.patient });
      await loadContext(token);
    } catch (err) {
      setError(fail(err, t("We could not create your record. Please try again.")));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const token = session?.token || readPatientPhoneSession();
    clearPatientPhoneSession();
    setSession(null);
    setCounts(null);
    setCode("");
    setChallengeToken("");
    setStep("phone");
    if (token) {
      base44.functions.invoke("patientPhoneAuth", { action: "logout", token }).catch(() => null);
    }
  };

  if (step === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "portal" && session?.patient_id) {
    const cards = [
      { key: "appointments", label: t("Appointments"), icon: CalendarDays, value: counts?.appointments },
      { key: "labRequests", label: t("Lab Requests"), icon: FlaskConical, value: counts?.labRequests },
      { key: "imaging", label: t("Imaging"), icon: ScanLine, value: counts?.imaging },
      { key: "documents", label: t("Documents"), icon: FileText, value: counts?.documents },
      { key: "medications", label: t("Medications"), icon: Pill, value: counts?.medications },
    ];

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
            <div className="flex items-center gap-2">
              <BrandLogo className="h-9 w-9 rounded-xl" />
              <span className="text-lg font-normal [font-family:'Bungee',_system-ui]">AMedix</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              {t("Sign out")}
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="text-2xl font-bold">
            {t("Welcome,")} {String(session.full_name || "").split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{session.full_name}</p>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Clinical Identification Number")}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-widest text-primary">{session.cin}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cards.map(({ key, label, icon: Icon, value }) => (
              <div key={key} className="rounded-xl border border-border bg-card p-4">
                <Icon className="h-4 w-4 text-primary" />
                <p className="mt-2 text-2xl font-bold">{value ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (step === "details") {
    return (
      <AuthLayout
        icon={ShieldCheck}
        title={t("Complete your details")}
        subtitle={t("Your number is verified. These details create your patient record and your permanent CIN.")}
        footer={
          <button type="button" onClick={signOut} className="text-sm text-muted-foreground hover:text-primary">
            {t("Use a different number")}
          </button>
        }
      >
        <form onSubmit={completeRegistration} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t("First Name")}</Label>
              <Input id="first_name" value={details.first_name} onChange={(e) => setDetails((d) => ({ ...d, first_name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father_name">{t("Father's Name")}</Label>
              <Input id="father_name" value={details.father_name} onChange={(e) => setDetails((d) => ({ ...d, father_name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grandfather_name">{t("Grandfather's Name")}</Label>
              <Input id="grandfather_name" value={details.grandfather_name} onChange={(e) => setDetails((d) => ({ ...d, grandfather_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{t("Last Name")}</Label>
              <Input id="last_name" value={details.last_name} onChange={(e) => setDetails((d) => ({ ...d, last_name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">{t("Date of birth")}</Label>
              <Input id="dob" type="date" value={details.date_of_birth} onChange={(e) => setDetails((d) => ({ ...d, date_of_birth: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>{t("Sex")}</Label>
              <Select value={details.gender} onValueChange={(v) => setDetails((d) => ({ ...d, gender: v }))}>
                <SelectTrigger><SelectValue placeholder={t("Select")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("Male")}</SelectItem>
                  <SelectItem value="female">{t("Female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_number">{t("Identification number")}</Label>
              <Input id="id_number" value={details.identification_number} onChange={(e) => setDetails((d) => ({ ...d, identification_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("Preferred language")}</Label>
              <Select value={details.preferred_language} onValueChange={(v) => setDetails((d) => ({ ...d, preferred_language: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{t("Address")}</Label>
            <Input id="address" value={details.address} onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("Creating your record...")}
              </>
            ) : (
              t("Create my account")
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {t("Your verified number stays your sign-in. No email address is needed.")}
          </p>
        </form>
      </AuthLayout>
    );
  }

  if (step === "code") {
    return (
      <AuthLayout
        icon={Phone}
        title={t("Enter the code")}
        subtitle={t("We sent a 6-digit code by SMS to your number.")}
        footer={
          <button type="button" onClick={signOut} className="text-sm text-muted-foreground hover:text-primary">
            {t("Use a different number")}
          </button>
        }
      >
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="flex justify-center mb-6">
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
        <Button className="w-full h-12 font-medium" onClick={verifyCode} disabled={loading || code.length < 6}>
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
          <button type="button" onClick={sendCode} disabled={loading} className="text-primary font-medium hover:underline">
            {t("Send the code again")}
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Phone}
      title={t("Sign in with your phone number")}
      subtitle={t("Enter your mobile number and we will text you a 6-digit code.")}
      footer={
        <Link to="/landing" className="text-sm text-muted-foreground hover:text-primary">
          {t("Back to sign in options")}
        </Link>
      }
    >
      <form onSubmit={sendCode} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="phone">{t("Mobile number")}</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              placeholder="091 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("Libyan numbers only: 091, 092, 093 or 094.")}</p>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || !phone.trim()}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("Sending code...")}
            </>
          ) : (
            t("Send the code")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}