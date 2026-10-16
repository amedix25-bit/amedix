import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useAppLanguage } from "@/lib/appLanguage";
import PortalSelection from "@/components/PortalSelection";
import {
  VALID_PORTALS,
  ROLE_LOGIN_LABELS,
  validatePortalAccess,
  rejectionMessage,
  logoutWithRejection,
  routeAfterValidation,
} from "@/lib/portalAccess";

export default function Login({ portal = null, embedded = false }) {
  const { t } = useAppLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState(null);

  // The portal selected on the role-choice page: ?portal= wins, the role
  // stored by the landing page is the fallback. Read from the CURRENT url on
  // every navigation — reading it once at module load captured the address
  // the app booted on, so a client-side navigation to /login?portal=patient
  // could still open the previous (e.g. lab) portal login.
  const { returnTo, selectedPortal, rejectedParam } = React.useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // Post-login destination (e.g. the MCP OAuth consent page sends users here
    // with returnTo so the grant flow can resume). Same-origin paths only.
    const currentReturnTo = safeReturnTo();
    const portalParam = urlParams.get("portal");
    const storedRole = localStorage.getItem("amh_selected_role");
    return {
      returnTo: currentReturnTo,
      selectedPortal: VALID_PORTALS.includes(portalParam)
        ? portalParam
        : VALID_PORTALS.includes(portal)
          ? portal
          : VALID_PORTALS.includes(storedRole)
            ? storedRole
            : null,
      rejectedParam: urlParams.get("rejected"),
    };
  }, [location.search, portal]);

  useEffect(() => {
    if (rejectedParam) setError(rejectionMessage(rejectedParam, t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectedParam]);

  const reject = (role) => logoutWithRejection(role, "/login", selectedPortal ? { portal: selectedPortal } : {});

  // After authentication the backend decides which portals the account is
  // authorized for — a mismatch is rejected, never silently redirected.
  const finishLogin = async () => {
    const data = await validatePortalAccess(selectedPortal);
    routeAfterValidation(data, selectedPortal, {
      onSelection: (sel) => {
        setSelection({ ...sel, full_name: sel.full_name || email });
        setLoading(false);
      },
      onReject: reject,
    });
  };

  // Visitors arriving already authenticated (e.g. returning from Google
  // sign-in) go through the same backend role check before any portal opens.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        if (returnTo !== "/") {
          window.location.href = returnTo;
          return;
        }
        const data = await validatePortalAccess(selectedPortal);
        if (!cancelled) {
          routeAfterValidation(data, selectedPortal, {
            onSelection: (sel) => setSelection(sel),
            onReject: reject,
          });
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, returnTo, selectedPortal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      if (returnTo !== "/") {
        window.location.href = returnTo;
        return;
      }
      await finishLogin();
    } catch (err) {
      setError(err.message || t("Invalid email or password"));
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // After Google returns, the user lands back on this page authenticated —
    // the backend role check then runs before any portal opens.
    const fromUrl = returnTo !== "/" ? returnTo : `${window.location.origin}/login${selectedPortal ? `?portal=${selectedPortal}` : ""}`;
    base44.auth.loginWithProvider("google", fromUrl);
  };

  if (selection) {
    return (
      <AuthLayout
        embedded={embedded}
        icon={LogIn}
        title={t("Welcome Back")}
        subtitle={t("Log in to your A&M Healthcare account")}
      >
        <PortalSelection fullName={selection.full_name} roles={selection.roles} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      embedded={embedded}
      icon={LogIn}
      title={selectedPortal ? t(ROLE_LOGIN_LABELS[selectedPortal]) : t("Welcome Back")}
      subtitle={t("Log in to your A&M Healthcare account")}
      footer={
        <>
          {t("Don't have an account?")}{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            {t("Create one")}
          </Link>
        </>
      }
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("Password")}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t("Forgot password?")}
            </Link>
          </div>
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
            t("Log in")
          )}
        </Button>
      </form>

      {selectedPortal && (
        <button
          type="button"
          onClick={() => navigate("/landing")}
          className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground"
        >
          {t("Choose a different portal")}
        </button>
      )}
    </AuthLayout>
  );
}