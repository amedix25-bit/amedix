import React from "react";

export default function SectionCard({ number, title, action, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
            {number}
          </span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}