import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, LogIn, UserCircle } from "lucide-react";
import { savePharmacistSession } from "@/lib/pharmacistSession";

export default function PharmacistLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("pharmacistLogin", { username, password });
      savePharmacistSession(res.data);
      window.location.href = "/pharmacy/pharmacist";
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex justify-center mb-4">
        <BrandLogo className="w-16 h-16 rounded-full" />
      </div>
      <h1 className="text-xl font-bold text-center">Pharmacist Login</h1>
      <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
        Sign in with your individual pharmacist account
      </p>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="username"
              autoComplete="username"
              autoFocus
              placeholder="e.g. sara.ahmed.pharmacy"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              Sign in
            </>
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground text-center mt-4">
        Pharmacist accounts are created by the pharmacy administrator.{" "}
        <Link to="/pharmacy" className="text-primary font-medium hover:underline">
          Pharmacy sign-in
        </Link>
      </p>
    </div>
  );
}