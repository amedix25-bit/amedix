import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Check, Loader2, Mic, Square } from "lucide-react";

// AMedix medical dictation — one mic button dropped under any doctor-facing
// clinical text field, across every specialty. Records the doctor's speech,
// transcribes it on the secure backend with a multilingual recognizer
// (Arabic, English, or both mixed interchangeably, and English medical terms
// pronounced with an Arabic accent), then applies specialty-aware, context-
// aware medical terminology correction. The doctor ALWAYS reviews and
// confirms the final text before it is inserted into the field — clinically
// significant terms (medication names, doses, allergies, diagnoses, treatment
// instructions) are never changed automatically, only offered as flagged
// suggestions to accept or keep. Existing field text is preserved: the
// confirmed text is appended after it.
export default function MedicalDictationButton({ value = "", onChange, specialty = "", contextLabel = "" }) {
  const [lang, setLang] = useState(() => localStorage.getItem("amedix_dictation_lang") || "mixed");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState(null); // { transcript, corrected_text, corrections }
  const [finalText, setFinalText] = useState("");
  const [applied, setApplied] = useState({});
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

  // Release the microphone and timer if the field unmounts mid-dictation.
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    },
    []
  );

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(1000);
      recorderRef.current = rec;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error(err);
      setError("Microphone access is required for dictation. Allow mic access and try again.");
    }
  };

  const process = async (blob) => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (!blob || blob.size === 0) {
      setError("Nothing was recorded. Press the mic and speak, then stop.");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const ext = (blob.type || "").includes("mp4") ? "m4a" : "webm";
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({
        file: new File([blob], `dictation-${Date.now()}.${ext}`, { type: blob.type || "audio/webm" }),
      });
      const res = await base44.functions.invoke("medicalDictation", {
        audio_uri: file_uri,
        language: lang,
        specialty: specialty || "General",
        field_context: contextLabel || "clinical documentation",
      });
      setFinalText(res.data.corrected_text || "");
      setReview(res.data);
      setApplied({});
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Dictation failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const stop = () => {
    const rec = recorderRef.current;
    if (!rec) return;
    recorderRef.current = null;
    rec.onstop = () => process(new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" }));
    rec.stop();
  };

  const applyCorrection = (c) => {
    const text = finalText;
    const idx = c.original ? text.indexOf(c.original) : -1;
    if (idx === -1) return;
    setFinalText(text.slice(0, idx) + (c.suggestion || c.original) + text.slice(idx + c.original.length));
  };

  const confirmInsert = () => {
    const text = finalText.trim();
    if (text && onChange) {
      const existing = String(value || "").trimEnd();
      onChange(existing ? `${existing} ${text}` : text);
    }
    setReview(null);
    setFinalText("");
    setReview(null);
  };

  const chooseLang = (v) => {
    setLang(v);
    localStorage.setItem("amedix_dictation_lang", v);
  };

  const spokenArabic = /[\u0600-\u06FF]/.test(review?.transcript || "");
  const flagged = (review?.corrections || []).filter((c) => c.flagged);
  const autoApplied = (review?.corrections || []).filter((c) => !c.flagged).length;

  return (
    <div className="pt-1">
      <div className="flex items-center gap-2">
        <Select value={lang} onValueChange={chooseLang} disabled={recording || processing}>
          <SelectTrigger className="h-7 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mixed">Arabic + English</SelectItem>
            <SelectItem value="ar">Arabic</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
        {recording ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-7 text-xs"
            onClick={stop}
            disabled={processing}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
            <Square className="w-3 h-3" />
            Stop
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={start}
            disabled={!supported || processing}
            title={supported ? "Dictate" : "Dictation is not supported in this browser"}
          >
            {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
            {processing ? "Transcribing…" : "Dictate"}
          </Button>
        )}
      </div>
      {recording && (
        <p className="text-xs text-muted-foreground mt-1">Recording — speak clearly, then press Stop.</p>
      )}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      <Dialog open={!!review} onOpenChange={(open) => { if (!open) setReview(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Dictated Text</DialogTitle>
            <DialogDescription>
              Review and edit the text, then confirm to insert it into the field. Flagged medical terms were{" "}
              <span className="font-medium">not</span> changed automatically — verify them yourself.
            </DialogDescription>
          </DialogHeader>

          <Textarea rows={8} value={finalText} onChange={(e) => setFinalText(e.target.value)} />

          {spokenArabic && (
            <p className="text-xs text-muted-foreground">
              Arabic dictation was translated into English — please verify the translation before inserting.
            </p>
          )}

          {autoApplied > 0 && (
            <p className="text-xs text-muted-foreground">
              {autoApplied} lower-risk wording / terminology correction{autoApplied !== 1 ? "s" : ""} applied — visible in
              the text above, editable before inserting.
            </p>
          )}

          {flagged.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Flagged terms — verify before inserting
              </p>
              {flagged.map((c, i) => {
                const key = `f${(review.corrections || []).indexOf(c)}`;
                const hasSuggestion = c.suggestion && c.suggestion !== c.original;
                return (
                  <div key={key} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium break-words">&ldquo;{c.original}&rdquo;</p>
                      {hasSuggestion ? (
                        <p className="text-xs text-muted-foreground">
                          Suggested: <span className="font-medium text-foreground">{c.suggestion}</span>
                          {c.term_type ? ` — ${c.term_type}` : ""}
                          {c.confidence ? ` · ${c.confidence} confidence` : ""}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No confident suggestion — verify this term manually
                          {c.term_type ? ` (${c.term_type})` : ""}.
                        </p>
                      )}
                    </div>
                    {hasSuggestion && (
                      applied[key] === "accepted" ? (
                        <span className="text-xs text-emerald-700 font-medium flex items-center gap-1 shrink-0">
                          <Check className="w-3.5 h-3.5" /> Applied
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs shrink-0"
                          onClick={() => {
                            applyCorrection(c);
                            setApplied((a) => ({ ...a, [key]: "accepted" }));
                          }}
                        >
                          Use suggestion
                        </Button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setReview(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmInsert} disabled={!finalText.trim()}>
              <Check className="w-4 h-4" /> Confirm &amp; Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}