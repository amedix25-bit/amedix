import React from "react";
import { useNavigate } from "react-router-dom";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { ChevronRight } from "lucide-react";

export default function LabRequestListRow({ lab }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/doctor/lab-request/${lab.id}`)}
      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-accent/50 transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">{lab.patient_name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">CIN: {lab.patient_cin}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground">{lab.date_requested}</span>
        <LabStatusBadge status={lab.status} />
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}