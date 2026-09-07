import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, UserCheck, Clock, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DoctorPatientSearch({ doctorProfile }) {
  const [cin, setCin] = useState("");
  const [patient, setPatient] = useState(null);
  const [accessStatus, setAccessStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!cin.trim()) return;
    setLoading(true);
    setSearched(true);
    setPatient(null);
    setAccessStatus(null);
    try {
      const results = await base44.entities.PatientProfile.filter({ cin: cin.trim().toUpperCase() });
      if (results.length > 0) {
        const p = results[0];
        setPatient(p);
        const accessReqs = await base44.entities.AccessRequest.filter({ patient_id: p.id, doctor_id: doctorProfile.id });
        if (accessReqs.length > 0) {
          setAccessStatus(accessReqs[0].status);
        } else {
          setAccessStatus("none");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    setRequesting(true);
    try {
      await base44.entities.AccessRequest.create({
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        doctor_name: doctorProfile.full_name,
        doctor_specialization: doctorProfile.specialization,
        doctor_hospital: doctorProfile.hospital,
        status: "pending",
        date_requested: new Date().toISOString().slice(0, 10),
      });
      setAccessStatus("pending");
    } catch (err) {
      console.error(err);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter patient CIN (e.g. CIN-XXXXXX)"
            value={cin}
            onChange={(e) => setCin(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading || !cin.trim()}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {searched && !patient && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No patient found with that CIN</p>
        </div>
      )}

      {patient && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-lg font-bold">{patient.full_name}</p>
              <p className="text-sm text-muted-foreground mt-1">CIN: {patient.cin}</p>
              <div className="flex gap-4 mt-3 text-sm">
                {patient.date_of_birth && <span className="text-muted-foreground">DOB: {patient.date_of_birth}</span>}
                {patient.gender && <span className="text-muted-foreground">Gender: {patient.gender}</span>}
                {patient.blood_type && <span className="text-muted-foreground">Blood: {patient.blood_type}</span>}
              </div>
            </div>
            <div>
              {accessStatus === "approved" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
                  <UserCheck className="w-4 h-4" />
                  Access Granted
                </div>
              )}
              {accessStatus === "pending" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Access Pending
                </div>
              )}
              {accessStatus === "declined" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium">
                  <X className="w-4 h-4" />
                  Access Declined
                </div>
              )}
              {accessStatus === "none" && (
                <Button onClick={handleRequestAccess} disabled={requesting}>
                  {requesting ? "Requesting..." : "Request Access"}
                </Button>
              )}
              {accessStatus === "revoked" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium">
                  <X className="w-4 h-4" />
                  Access Revoked
                </div>
              )}
            </div>
          </div>

          {accessStatus === "approved" && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-semibold text-sm mb-3">Medical Information</h4>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <InfoRow label="Allergies" value={patient.allergies} />
                <InfoRow label="Phone" value={patient.phone} />
                <InfoRow label="Address" value={patient.address} />
                <InfoRow label="Emergency Contact" value={patient.emergency_contact_name} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}