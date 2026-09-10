import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { getTests, groupTestsByCategory, normalizeLabStatus } from "@/lib/labRequestUtils";
import { ArrowLeft, FileText, CheckCircle2, Loader2, FlaskConical, Building2 } from "lucide-react";

export default function LabRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const data = await base44.entities.LabRequest.get(id);
      const myProfiles = await base44.entities.DoctorProfile.filter({ user_id: user.id });
      if (myProfiles.length === 0 || myProfiles[0].id !== data.doctor_id) {
        setNotFound(true);
        return;
      }
      setLab(data);
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !lab) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
        <FlaskConical className="w-12 h-12 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Lab request not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const status = normalizeLabStatus(lab.status);
  const categories = groupTestsByCategory(getTests(lab));
  const testCount = categories.reduce((a, [, names]) => a + names.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 lg:p-6 max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Lab Requests
        </button>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</p>
              <h1 className="text-xl font-bold mt-1">{lab.patient_name}</h1>
              <p className="text-sm text-primary font-semibold mt-1">CIN: {lab.patient_cin}</p>
            </div>
            <LabStatusBadge status={lab.status} />
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Date submitted</p>
              <p className="font-medium mt-0.5">{lab.date_requested}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Requesting doctor</p>
              <p className="font-medium mt-0.5">{lab.doctor_name}</p>
            </div>
            {lab.request_id && (
              <div>
                <p className="text-xs text-muted-foreground">Request ID</p>
                <p className="font-medium mt-0.5">{lab.request_id}</p>
              </div>
            )}
            {lab.lab_name && (
              <div>
                <p className="text-xs text-muted-foreground">Laboratory</p>
                <p className="font-medium mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />{lab.lab_name}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {lab.pdf_url && (
            <a href={lab.pdf_url} target="_blank" rel="noopener noreferrer">
              <Button>
                <FileText className="w-4 h-4 mr-2" />View PDF
              </Button>
            </a>
          )}
          {status === "results" && (
            <Button variant="outline" onClick={() => setShowResults(!showResults)}>
              <CheckCircle2 className="w-4 h-4 mr-2" />View Results
            </Button>
          )}
        </div>

        {status === "results" && showResults && (lab.result || lab.result_file_url) && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-sm font-semibold text-emerald-800 mb-1">Laboratory Results{lab.date_completed ? ` — ${lab.date_completed}` : ""}</p>
            {lab.result && <p className="text-sm text-emerald-800 whitespace-pre-wrap">{lab.result}</p>}
            {lab.result_file_url && (
              <a
                href={lab.result_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-600 underline mt-2 inline-block"
              >
                View result file
              </a>
            )}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Requested Laboratory Tests ({testCount})</h2>
          <div className="mt-3 space-y-3">
            {categories.map(([category, names]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category}</p>
                <ul className="mt-1 space-y-1">
                  {names.map((name) => (
                    <li key={name} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {(lab.indication || lab.clinical_info || lab.instructions) && (
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
              {lab.indication && <p>Indication: {lab.indication}</p>}
              {lab.clinical_info && <p>Clinical information: {lab.clinical_info}</p>}
              {lab.instructions && <p>Instructions: {lab.instructions}</p>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}