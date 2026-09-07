import React from "react";
import { useNavigate } from "react-router-dom";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { getTests } from "@/lib/labRequestUtils";
import { ChevronRight } from "lucide-react";

export default function LabHistoryList({ requests, currentId }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
      {requests.map((r) => {
        const isCurrent = r.id === currentId;
        const count = getTests(r).length;
        return (
          <button
            key={r.id}
            onClick={() => !isCurrent && navigate(`/doctor/lab-request/${r.id}`)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
              isCurrent ? "bg-primary/5" : "hover:bg-accent/50"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {r.date_requested}
                <span className="text-muted-foreground font-normal">
                  {" "}· {count} test{count !== 1 ? "s" : ""}
                  {r.request_id ? ` · ${r.request_id}` : ""}
                </span>
              </p>
              {r.indication && <p className="text-xs text-muted-foreground truncate mt-0.5">{r.indication}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isCurrent && <span className="text-xs text-primary font-medium">Viewing</span>}
              <LabStatusBadge status={r.status} />
              {!isCurrent && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}