import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, X, Loader2 } from "lucide-react";

// Shared secure composer. Files go to PRIVATE storage and only the returned
// private uri is sent to the server, which verifies conversation membership
// before signing any download.
export default function MessageComposer({ onSend, disabled, placeholder, sending }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const addFiles = async (files) => {
    const list = Array.from(files || []).slice(0, 5 - attachments.length);
    if (list.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of list) {
        if (file.size > 10 * 1024 * 1024) {
          setError("Files must be 10 MB or smaller.");
          continue;
        }
        const res = await base44.integrations.Core.UploadPrivateFile({ file });
        if (res?.file_uri) uploaded.push({ file_uri: res.file_uri, file_name: file.name, mime_type: file.type, size: file.size });
      }
      setAttachments((prev) => [...prev, ...uploaded].slice(0, 5));
    } catch (e) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    if (disabled || sending) return;
    if (!text.trim() && attachments.length === 0) return;
    await onSend(text.trim(), attachments);
    setText("");
    setAttachments([]);
  };

  return (
    <div className="border-t border-border bg-card p-3">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px]">
              <Paperclip className="w-3 h-3" /> {a.file_name}
              <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-critical">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="mb-2 text-xs text-critical">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          maxLength={5000}
          placeholder={placeholder || "Write a message…"}
          className="min-h-[44px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || attachments.length >= 5}
          title="Attach a file"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </Button>
        <Button type="button" size="icon" onClick={submit} disabled={sending || (!text.trim() && attachments.length === 0)} title="Send">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Enter to send · Shift+Enter for a new line · sent messages cannot be edited or deleted</p>
    </div>
  );
}