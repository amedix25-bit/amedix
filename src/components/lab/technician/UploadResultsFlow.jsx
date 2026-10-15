import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LabStatusBadge from "@/components/lab/LabStatusBadge";
import { normalizeLabStatus } from "@/lib/labRequestUtils";
import { ArrowLeft, FileText, Loader2, Search, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Insurance", "Mobile Wallet", "Other"];

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadResultsFlow({ session, onSubmitted }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [name, setName] = useState("");
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState(null);
  const [patient, setPatient] = useState(null);
  const [request, setRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [customMethod, setCustomMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const search = async () => {
    const q = name.trim();
    if (q.length < 2) {
      toast({ title: "Enter at least 2 characters of the patient's name." });
      return;
    }
    setSearching(true);
    try {
      const res = await base44.functions.invoke("labFindPatientByName", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        name: q,
      });
      setMatches(res.data.matches || []);
    } catch (err) {
      toast({
        title: "Search failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const pickFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "PDF required", description: "Please upload the results as a PDF.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "Please upload a PDF up to 3 MB.", variant: "destructive" });
      return;
    }
    // A file renamed to .pdf (e.g. a PNG image) still opens blank in the PDF viewer —
    // check the real file signature, not just the name.
    const head = new Uint8Array(await f.slice(0, 5).arrayBuffer());
    if (String.fromCharCode(...head) !== "%PDF-") {
      toast({
        title: "Not a valid PDF",
        description: "This file is an image or document renamed to .pdf. Export or print it as a real PDF and try again.",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!file) {
      toast({ title: "Results PDF required", description: "Upload the laboratory results PDF.", variant: "destructive" });
      return;
    }
    if (!amount.trim() || !/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      toast({ title: "Invalid amount", description: "Enter the payment amount collected, e.g. 150 or 150.50.", variant: "destructive" });
      return;
    }
    const finalMethod = method === "Other" ? customMethod.trim() : method;
    if (!finalMethod) {
      toast({ title: "Payment method required", description: "Select or enter how the patient paid.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const b64 = await toBase64(file);
      await base44.functions.invoke("labSubmitResults", {
        technician_id: session.technician_id,
        session_token: session.session_token,
        lab_request_id: request.id,
        file_b64: b64,
        file_name: file.name,
        file_type: file.type || "application/pdf",
        payment_amount: amount.trim(),
        payment_method: finalMethod,
      });
      toast({
        title: "Results submitted",
        description: "The results and payment are securely linked to the request. The patient has been notified.",
      });
      setName("");
      setMatches(null);
      setPatient(null);
      setRequest(null);
      setFile(null);
      setAmount("");
      setMethod("Cash");
      setCustomMethod("");
      onSubmitted?.();
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetPatient = () => {
    setPatient(null);
    setRequest(null);
    setFile(null);
    setAmount("");
    setMethod("Cash");
    setCustomMethod("");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      {/* Step 1: search patient by name */}
      {!patient && (
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold">Find the Patient</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only patients who explicitly authorized your laboratory can be found here.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
            className="flex gap-2"
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Patient name"
              autoFocus
            />
            <Button type="submit" disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
            </Button>
          </form>

          {matches !== null &&
            (matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No authorized patients found with that name for your laboratory.
              </p>
            ) : (
              <div className="space-y-2">
                {matches.map((m) => (
                  <button
                    key={m.patient_id}
                    type="button"
                    onClick={() => {
                      setPatient(m);
                      setMatches(null);
                    }}
                    className="w-full text-left rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
                  >
                    <p className="text-sm font-medium">{m.patient_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.patient_cin} · {m.requests.length} open request(s)
                    </p>
                  </button>
                ))}
              </div>
            ))}
        </div>
      )}

      {/* Step 2: select the laboratory request */}
      {patient && !request && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">{patient.patient_name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{patient.patient_cin}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetPatient}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
          <div className="space-y-2">
            {patient.requests.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{r.request_ref}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requested {r.created_date ? new Date(r.created_date).toLocaleString() : r.date_requested}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Tests: {(r.tests || []).join(", ")}</p>
                  </div>
                  <LabStatusBadge status={normalizeLabStatus(r.status)} />
                </div>
                <Button size="sm" className="mt-3" onClick={() => setRequest(r)}>
                  Select Request
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: view request + upload results & payment */}
      {patient && request && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-semibold truncate">{patient.patient_name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {patient.patient_cin} · {request.request_ref}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setRequest(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Requested {request.created_date ? new Date(request.created_date).toLocaleString() : request.date_requested}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Tests: {(request.tests || []).join(", ")}</p>
              </div>
              <LabStatusBadge status={normalizeLabStatus(request.status)} />
            </div>
            {request.pdf_url && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => window.open(request.pdf_url, "_blank")}
              >
                <FileText className="w-4 h-4 mr-1" /> View Lab Request PDF
              </Button>
            )}
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <div className="space-y-1.5">
              <Label>Laboratory Results PDF *</Label>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={pickFile}
              />
              <Button variant="outline" className="w-full" onClick={() => fileRef.current && fileRef.current.click()}>
                <Upload className="w-4 h-4 mr-1" /> {file ? file.name : "Choose PDF file"}
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pay_amount">Payment Amount Collected *</Label>
                <Input
                  id="pay_amount"
                  inputMode="decimal"
                  placeholder="e.g. 150.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method *</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {method === "Other" && (
              <div className="space-y-1.5">
                <Label htmlFor="pay_method_custom">Enter Payment Method *</Label>
                <Input
                  id="pay_method_custom"
                  placeholder="e.g. Cheque"
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value)}
                />
              </div>
            )}

            <Button className="w-full" size="lg" disabled={submitting} onClick={submit}>
              {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Submit Results & Payment
            </Button>
            <p className="text-xs text-muted-foreground">
              The results PDF, payment amount and payment method will be securely attached to{" "}
              {request.request_ref} for {patient.patient_name} and sent to the Lab Portal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}