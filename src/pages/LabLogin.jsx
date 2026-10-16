import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, FlaskConical, Loader2, Lock, LogIn, Mail, UserCircle } from "lucide-react";
import { saveLabSession } from "@/lib/labSession";
import PortalSelection from "@/components/PortalSelection";
import { validatePortalAccess, rejectionMessage, logoutWithRejection, routeAfterValidation } from "@/lib/portalAccess";
import { useAppLanguage } from "@/lib/appLanguage";

export default function LabLogin({ embedded = false }) {
  const [tab, setTab] = useState("lab");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selection, setSelection] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useAppLanguage();
  const [error, setError] = useState(() => {
    const rejected = new URLSearchParams(window.location.search).get("rejected");
    return rejected ? rejectionMessage(rejected, t) : "";
  });

  // The Laboratory login only accepts accounts authorized for the Lab Portal —
  // verified against the user's database roles by the checkPortalAccess function.
  const handleLabLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      const data = await validatePortalAccess("lab");
      routeAfterValidation(data, "lab", {
        onSelection: (sel) => {
          setSelection({ ...sel, full_name: sel.full_name || email });
          setLoading(false);
        },
        onReject: (role) => logoutWithRejection(role, "/lab"),
      });
    } catch (err) {
      setError(err.message || t("Invalid email or password"));
      setLoading(false);
    }
  };

  const handleTechLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("labTechnicianLogin", { username, password });
      saveLabSession(res.data);
      window.location.href = "/lab-technician";
    } catch (err) {
      setError(err.response?.data?.error || err.message || t("Invalid username or password"));
      setLoading(false);
    }
  };

  if (selection) {
    return (
      <AuthLayout
        embedded={embedded}
        icon={Building2}
        title={t("Lab Portal")}
        subtitle={t("Laboratory and technician sign-in")}
      >
        <PortalSelection fullName={selection.full_name} roles={selection.roles} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      embedded={embedded}
      icon={Building2}
      title={t("Lab Portal")}
      subtitle={t("Laboratory and technician sign-in")}
      footer={
        <>
          {t("Don't have a laboratory account?")}{" "}
          <Link to="/lab/register" className="text-primary font-medium hover:underline">
            {t("Create one")}
          </Link>
        </>
      }
    >
      <div className="flex rounded-xl border border-border bg-card p-1 gap-1 mb-6">
        <button
          type="button"
          onClick={() => setTab("lab")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "lab" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <Building2 className="w-4 h-4" />
          {t("Laboratory")}
        </button>
        <button
          type="button"
          onClick={() => setTab("technician")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "technician" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          {t("Technician")}
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      {tab === "lab" ? (
        <form onSubmit={handleLabLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("Email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="lab@example.com"
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
                {t("Log in to Lab Portal")}
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleTechLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("Technician Username")}</Label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="username"
                autoComplete="username"
                autoFocus
                placeholder="e.g. sara.ahmed.lab123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tech_password">{t("Password")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="tech_password"
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
                {t("Signing in...")}
              </>
            ) : (
              t("Sign in to your workspace")
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}