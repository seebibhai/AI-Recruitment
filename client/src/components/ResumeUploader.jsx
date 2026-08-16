import React, { useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { jobsApi } from "../lib/resources.js";
import { apiErrorMessage } from "../lib/api.js";

const ACCEPTED = [".pdf", ".docx", ".txt"];
const MAX_FILES = 100;

export default function ResumeUploader({ jobId, onComplete }) {
  const [queue, setQueue] = useState([]); // { file, status: pending|uploading|done }
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList).filter((f) => ACCEPTED.some((ext) => f.name.toLowerCase().endsWith(ext)));
    const rejected = fileList.length - incoming.length;
    if (rejected > 0) setError(`${rejected} file(s) skipped — only PDF, DOCX, and TXT resumes are supported.`);
    setQueue((prev) => [...prev, ...incoming].slice(0, MAX_FILES).map((file) => ({ file, name: file.name })));
  };

  const removeFile = (name) => setQueue((prev) => prev.filter((q) => q.name !== name));

  const upload = async () => {
    if (!queue.length) return;
    setUploading(true);
    setError("");
    setResults(null);
    const formData = new FormData();
    queue.forEach((q) => formData.append("resumes", q.file));

    try {
      const { data } = await jobsApi.uploadResumes(jobId, formData, (evt) => {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      setResults(data);
      setQueue([]);
      onComplete?.(data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-accent-400 bg-accent-50" : "border-slate-200 hover:border-accent-300 bg-slate-50/50"
        }`}
      >
        <UploadCloud size={28} className="mx-auto text-accent-500 mb-2" />
        <p className="text-sm font-medium text-ink-900">Drag & Drop Resumes</p>
        <p className="text-xs text-slate-500 mt-1">or <span className="text-accent-600 font-medium">Browse Files</span></p>
        <p className="text-[11px] text-slate-400 mt-3">PDF · DOCX · TXT — up to {MAX_FILES} files</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      {queue.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500">{queue.length} file(s) ready to upload</p>
            <button onClick={upload} disabled={uploading} className="btn-accent text-xs">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
              {uploading ? `Processing… ${progress}%` : "Upload & Process"}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {queue.map((q) => (
              <div key={q.name} className="flex items-center gap-2 text-sm bg-white border border-slate-100 rounded-lg px-3 py-2">
                <FileText size={14} className="text-slate-400 shrink-0" />
                <span className="truncate flex-1">{q.name}</span>
                {!uploading && (
                  <button onClick={() => removeFile(q.name)} className="text-slate-400 hover:text-red-500">
                    <XCircle size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {uploading && (
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-accent-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {results && (
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-sm font-medium text-ink-900 mb-2">
            Processed {results.processed} resume(s) — {results.succeeded} succeeded, {results.failed} failed
          </p>
          <div className="max-h-56 overflow-y-auto space-y-1.5">
            {results.results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-white rounded-lg px-3 py-2 border border-slate-100">
                {r.success ? <CheckCircle2 size={14} className="text-accent-500 shrink-0" /> : <XCircle size={14} className="text-red-500 shrink-0" />}
                <span className="truncate flex-1">{r.fileName}</span>
                {r.success ? (
                  <>
                    {r.isDuplicate && <span className="text-amber-600 shrink-0">Duplicate</span>}
                    <span className="font-mono font-semibold text-ink-900 shrink-0">{r.matchScore}%</span>
                  </>
                ) : (
                  <span className="text-red-500 shrink-0">{r.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
