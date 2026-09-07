import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Check, X, Clock, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PatientAccessControl({ patientId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [patientId]);

  const load = async () => {
    try {
      const data = await base44.entities.AccessRequest.filter({ patient_id: patientId }, "-date_requested");
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await base44.entities.AccessRequest.update(id, { status, date_responded: new Date().toISOString().slice(0, 10) });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  const pending = requests.filter((r) => r.status === "pending");
  const active = requests.filter((r) => r.status === "approved");

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Your medical record is private</p>
            <p className="text-xs text-muted-foreground mt-1">
              Doctors can only access your records with your approval. You can revoke access at any time.
            </p>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Pending Access Requests</h3>
          <div className="space-y-3">
            {pending.map((req) => (
              <div key={req.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{req.doctor_name}</p>
                    <p className="text-sm text-muted-foreground">{req.doctor_specialization} {req.doctor_hospital && `· ${req.doctor_hospital}`}</p>
                    <p className="text-xs text-muted-foreground mt-1">Requested on {req.date_requested}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => handleAction(req.id, "approved")}>
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(req.id, "declined")}>
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Doctors with Access</h3>
        {active.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No doctors currently have access</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((req) => (
              <div key={req.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{req.doctor_name}</p>
                  <p className="text-sm text-muted-foreground">{req.doctor_specialization} {req.doctor_hospital && `· ${req.doctor_hospital}`}</p>
                  <p className="text-xs text-muted-foreground mt-1">Approved on {req.date_responded}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAction(req.id, "revoked")}>
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {requests.filter((r) => r.status === "declined").length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground">Declined Requests</h3>
          <div className="space-y-2">
            {requests.filter((r) => r.status === "declined").map((req) => (
              <div key={req.id} className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{req.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">Declined on {req.date_responded}</p>
                </div>
                <X className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}