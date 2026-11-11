import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useAppLanguage } from "@/lib/appLanguage";

// Mandatory first step of every institutional registration: the AMedix
// Administration Code. Validation is server-side; a valid code only unlocks the
// next screen of the registration — it never grants portal or clinical access.
export default function InstitutionCodeGate({ institutionType, onValidated }) {
  const { t } = useAppLanguage();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("registrationCode", {
        action: "validate",
        institution_type: institutionType,
        code: code.trim(),
      });
      onValidated({ ...res.data, code: code.trim() });
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("This code could not be verified."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-accent p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">
          {t("An AMedix Administration Code issued directly by AMedix administration is required before registration. Each code is issued for one institution type — a laboratory code cannot register a hospital or pharmacy.")}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="administration-code">{t("AMedix Administration Code *")}</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="administration-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="AMX-XXXX-XXXX-XXXX"
            className="pl-10 font-mono uppercase tracking-wider"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            required
          />
        </div>
      </div>
      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <Button type="submit" className="h-12 w-full font-medium" disabled={loading || code.trim().length < 8}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("Verifying code...")}
          </>
        ) : (
          t("Verify Code and Continue")
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {t("No code? Registration cannot continue without one. Contact AMedix administration to request your institutional code.")}
      </p>
    </form>
  );
}