import React from "react";
import { X } from "lucide-react";

export default function EntryModal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="flex items-start sm:items-center justify-center p-4 min-h-full">
        <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-lg my-4">
          <div className="flex items-start justify-between p-5 pb-0">
            <div>
              <h3 className="font-bold">{title}</h3>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}