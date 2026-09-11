import React from "react";
import { HeartPulse, Check } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <HeartPulse className="w-7 h-7" />
            </div>
            <span className="text-xl font-bold tracking-tight [font-family:'Crave_Fine',_sans-serif]">AMedix</span>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight">
                Connected Care.<br />Better Health.
              </h2>
              <p className="text-white/80 mt-4 text-lg max-w-md">
                A secure healthcare platform connecting doctors and patients in one unified, confidential system.
              </p>
            </div>

            <div className="space-y-4">
              {[
              "Unique Clinical Identification Number (CIN) for every patient",
              "You own your medical records — doctors access them only with your consent",
              "Manage appointments, lab results, imaging, and documents in one place"].
              map((feature, i) =>
              <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-white/80 text-sm">{feature}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-white/50 text-sm">© 2026 A&M Healthcare. All rights reserved.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">A&M Healthcare</span>
          </div>
          <p className="lg:hidden text-center text-sm text-muted-foreground mb-8">
            Connected Care. Better Health.
          </p>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            {children}
          </div>

          {footer &&
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
          }
        </div>
      </div>
    </div>);

}