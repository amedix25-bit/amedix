import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, FlaskConical, Loader2, Lock, LogIn, Mail, UserCircle } from "lucide-react";
import { saveLabSession } from "@/lib/labSession";

export default function LabLogin() {
  const [tab, setTab] = useState("lab");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLabLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/lab-portal";
    } catch (err) {
      setError(err.message || "Invalid email or password");
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
      setError(err.response?.data?.error || err.message || "Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Building2}
      title="Lab Portal"
      subtitle="Laboratory and technician sign-in"
      footer={
        <>
          Don't have a laboratory account?{" "}
          <Link to="/lab/register" className="text-primary font-medium hover:underline">
            Create one
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
          Laboratory
        </button>
        <button
          type="button"
          onClick={() => setTab("technician")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === "technician" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          Technician
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      {tab === "lab" ? (
        <form onSubmit={handleLabLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Password</Label>
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
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Log in to Lab Portal
              </>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleTechLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Technician Username</Label>
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
            <Label htmlFor="tech_password">Password</Label>
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
                Signing in...
              </>
            ) : (
              "Sign in to your workspace"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}