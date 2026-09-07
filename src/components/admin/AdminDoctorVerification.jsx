import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Check, X, Stethoscope } from "lucide-react";

export default function AdminDoctorVerification() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await base44.entities.DoctorProfile.list();
      setDoctors(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleVerify = async (id) => {
    try {
      await base44.entities.DoctorProfile.update(id, { is_verified: true });
      load();
    } catch (err) { console.error(err); }
  };

  const handleRevoke = async (id) => {
    try {
      await base44.entities.DoctorProfile.update(id, { is_verified: false });
      load();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  const pending = doctors.filter((d) => !d.is_verified);
  const verified = doctors.filter((d) => d.is_verified);

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Pending Verification ({pending.length})</h3>
          <div className="space-y-3">
            {pending.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-medium">{doc.full_name}</p>
                    <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>License: {doc.license_number}</span>
                      {doc.hospital && <span>· {doc.hospital}</span>}
                      {doc.phone && <span>· {doc.phone}</span>}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleVerify(doc.id)}>
                    <Check className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-sm mb-3">Verified Doctors ({verified.length})</h3>
        {verified.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No verified doctors</p>
          </div>
        ) : (
          <div className="space-y-3">
            {verified.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium">{doc.full_name}</p>
                  <p className="text-sm text-muted-foreground">{doc.specialization} {doc.hospital && `· ${doc.hospital}`}</p>
                  <p className="text-xs text-muted-foreground mt-1">License: {doc.license_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleRevoke(doc.id)}>
                    <X className="w-4 h-4 mr-1" />
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}