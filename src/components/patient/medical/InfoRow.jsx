import React from "react";

export default function InfoRow({ label, value }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right rtl:text-left min-w-0 break-words">{value || "—"}</span>
    </div>
  );
}