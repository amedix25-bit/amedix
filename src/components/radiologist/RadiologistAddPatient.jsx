import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, UserCheck, Clock, X, EyeOff, QrCode, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DoctorScanPatientQr from "@/components/doctor/DoctorScanPatientQr";

// Radiologist Portal → Find Patient → Add New.
// Identify the patient by CIN or QR code scan — the same existing patient
// account, never a new profile — and request the patient's authorization.
export default function RadiologistAddPatient({ radiologistProfile, user, onBack, onOpenPatient }) {
  const [cin, setCin] = useState("");
  const [patient, setPatient] = useState(null);
  const [accessStatus, setAccessStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const lookupCin = async (cinValue) => {
    setLoading(true);
    setSearched(true);
    setPatient(null);
    setAccessStatus(null);
    try {
      const results = await base44.entities.PatientProfile.filter({ cin: String(cinValue).trim().toUpperCase() });
      if (results.length > 0) {
        const p = results[0];
        setPatient(p);
        const reqs = await base44.entities.RadiologistAccessRequest.filter({
          patient_id: p.id,
          radiologist_user_id: user.id,
        });
        setAccessStatus(reqs.length > 0 ? reqs[0].status : "none");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!cin.trim()) return;
    lookupCin(cin.trim());
  };

  const handleRequestAccess = async () => {
    setRequesting(true);
    try {
      await base44.entities.RadiologistAccessRequest.create({
        patient_id: patient.id,
        patient_user_id: patient.user_id,
        patient_cin: patient.cin,
        patient_name: patient.full_name,
        radiologist_id: radiologistProfile.id,
        radiologist_user_id: user.id,
        radiologist_name: radiologistProfile.full_name,
        radiologist_specialization: radiologistProfile.specialization,
        radiologist_hospital: radiologistProfile.hospital,
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
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter patient CIN (e.g. 7F3-829-461)"
            value={cin}
            onChange={(e) => setCin(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={loading || !cin.trim()}>
          {loading ? "Searching..." : "Search"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setScanning(true)}>
          <QrCode className="w-4 h-4 mr-2" />
          Scan Patient QR Code
        </Button>
      </form>

      {scanning && (
        <DoctorScanPatientQr
          onCinDetected={(cinValue) => {
            setScanning(false);
            setCin(cinValue);
            lookupCin(cinValue);
          }}
          onCancel={() => setScanning(false)}
        />
      )}

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
                <Button onClick={() => onOpenPatient(patient)}>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Open Radiology Workspace
                </Button>
              )}
              {accessStatus === "pending" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Awaiting patient authorization
                </div>
              )}
              {accessStatus === "suspended" && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                  <EyeOff className="w-4 h-4" />
                  Access suspended by patient
                </div>
              )}
              {(accessStatus === "declined" || accessStatus === "revoked") && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium">
                  <X className="w-4 h-4" />
                  {accessStatus === "declined" ? "Access declined" : "Access removed"}
                </div>
              )}
              {accessStatus === "none" && (
                <Button onClick={handleRequestAccess} disabled={requesting}>
                  {requesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    "Request Access"
                  )}
                </Button>
              )}
            </div>
          </div>

          {accessStatus === "pending" && (
            <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
              The patient will see your access request in their Access &amp; Privacy settings. You can open their
              radiology information once they approve it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}