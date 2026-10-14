import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, Lock, LogIn, Mail } from "lucide-react";
import PortalSelection from "@/components/PortalSelection";
import { validatePortalAccess, rejectionMessage, logoutWithRejection, routeAfterValidation } from "@/lib/portalAccess";
import { useAppLanguage } from "@/lib/appLanguage";

// The Pharmacy login only accepts accounts authorized for the Pharmacy Portal —
// verified against the user's database roles by the checkPortalAccess function.
export default function PharmacyLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selection, setSelection] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useAppLanguage();
  const [error, setError] = useState(() => {
    const rejected = new URLSearchParams(window.location.search).get("rejected");
    return rejected ? rejectionMessage(rejected, t) : "";
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      const data = await validatePortalAccess("pharmacy");
      routeAfterValidation(data, "pharmacy", {
        onSelection: (sel) => {
          setSelection({ ...sel, full_name: sel.full_name || email });
          setLoading(false);
        },
        onReject: (role) => logoutWithRejection(role, "/pharmacy"),
      });
    } catch (err) {
      setError(err.message || t("Invalid email or password"));
      setLoading(false);
    }
  };

  if (selection) {
    return (
      <AuthLayout icon={Building2} title={t("Pharmacy Portal")} subtitle={t("Pharmacy sign-in")}>
        <PortalSelection fullName={selection.full_name} roles={selection.roles} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Building2}
      title={t("Pharmacy Portal")}
      subtitle={t("Pharmacy sign-in")}
      footer={
        <>
          {t("Don't have a pharmacy account?")}{" "}
          <Link to="/pharmacy/register" className="text-primary font-medium hover:underline">
            {t("Create one")}
          </Link>
        </>
      }
    >
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("Email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="pharmacy@example.com"
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
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("Logging in...")}
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t("Log in to Pharmacy Portal")}
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}